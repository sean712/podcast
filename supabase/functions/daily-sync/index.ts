import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PodcastRecord {
  id: string;
  podcast_id: string;
  name: string;
  is_paused: boolean;
  check_frequency_hours: number;
  consecutive_empty_checks: number;
  last_synced_at: string | null;
}

interface SyncResult {
  podcast_id: string;
  podcast_name: string;
  synced: number;
  errors: number;
  skipped: number;
  had_new_episodes: boolean;
}

interface BatchProbeResult {
  podcast_id: string;
  has_new_episodes: boolean;
  latest_episode_date?: string;
}

async function getConfig(supabase: any, key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching config for ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Failed to get config ${key}:`, error);
    return null;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function batchProbePodcasts(
  podscanApiUrl: string,
  podscanApiKey: string,
  podcastIds: string[]
): Promise<Map<string, boolean>> {
  const resultMap = new Map<string, boolean>();

  if (podcastIds.length === 0) return resultMap;

  try {
    const response = await fetch(`${podscanApiUrl}/podcasts/batch_probe_for_latest_episodes`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${podscanApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ podcast_ids: podcastIds.join(",") }),
    });

    if (!response.ok) {
      console.error(`Batch probe failed: ${response.status}`);
      return resultMap;
    }

    const data = await response.json();
    const results: BatchProbeResult[] = data.results || [];

    for (const result of results) {
      resultMap.set(result.podcast_id, result.has_new_episodes || false);
    }
  } catch (error) {
    console.error("Error in batch probe:", error);
  }

  return resultMap;
}

async function syncPodcastEpisodes(
  supabase: any,
  podscanApiUrl: string,
  podscanApiKey: string,
  podcast: PodcastRecord
): Promise<SyncResult> {
  let synced = 0;
  let errors = 0;
  let skipped = 0;
  let hadNewEpisodes = false;

  try {
    console.log(`Checking podcast: ${podcast.name}`);

    const podscanHeaders = {
      "Authorization": `Bearer ${podscanApiKey}`,
      "Content-Type": "application/json",
    };

    const params = new URLSearchParams({
      per_page: "50",
      order_by: "posted_at",
      order_dir: "desc",
      show_only_fully_processed: "false",
    });

    const response = await fetch(
      `${podscanApiUrl}/podcasts/${podcast.podcast_id}/episodes?${params}`,
      { headers: podscanHeaders }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch episodes: ${response.status}`);
    }

    const data = await response.json();
    const episodes = data.episodes || [];

    if (episodes.length === 0) {
      console.log(`No episodes found for ${podcast.name}`);
      return { podcast_id: podcast.id, podcast_name: podcast.name, synced: 0, errors: 0, skipped: 0, had_new_episodes: false };
    }

    const newEpisodes = [];
    for (const episode of episodes) {
      const { data: existing } = await supabase
        .from('episodes')
        .select('id, episode_id')
        .eq('episode_id', episode.episode_id)
        .maybeSingle();

      if (!existing) {
        newEpisodes.push(episode);
      } else {
        skipped++;
        break;
      }
    }

    if (newEpisodes.length === 0) {
      console.log(`No new episodes for ${podcast.name}`);
      return { podcast_id: podcast.id, podcast_name: podcast.name, synced: 0, errors: 0, skipped, had_new_episodes: false };
    }

    hadNewEpisodes = true;
    console.log(`Found ${newEpisodes.length} new episodes for ${podcast.name}`);

    const episodeIds = newEpisodes.map(ep => ep.episode_id);
    const BATCH_SIZE = 50;

    for (let i = 0; i < episodeIds.length; i += BATCH_SIZE) {
      const batchIds = episodeIds.slice(i, i + BATCH_SIZE);

      try {
        const bulkResponse = await fetch(`${podscanApiUrl}/episodes/bulk`, {
          method: "POST",
          headers: podscanHeaders,
          body: JSON.stringify({
            episode_ids: batchIds.join(","),
            show_full_podcast: false,
            word_level_timestamps: true,
          }),
        });

        if (!bulkResponse.ok) {
          console.error(`Bulk download failed for batch: ${bulkResponse.status}`);
          errors += batchIds.length;
          continue;
        }

        const bulkData = await bulkResponse.json();
        const fullEpisodes = bulkData.episodes || [];

        for (const episodeData of fullEpisodes) {
          try {
            const slug = generateSlug(episodeData.episode_title);

            const { error: insertError } = await supabase
              .from('episodes')
              .insert([{
                podcast_id: podcast.id,
                episode_id: episodeData.episode_id,
                episode_guid: episodeData.episode_guid,
                title: episodeData.episode_title,
                slug,
                description: episodeData.episode_description || '',
                audio_url: episodeData.episode_audio_url,
                image_url: episodeData.episode_image_url,
                duration: episodeData.episode_duration || 0,
                word_count: episodeData.episode_word_count || 0,
                transcript: episodeData.episode_transcript,
                transcript_word_timestamps: episodeData.episode_transcript_word_level_timestamps,
                published_at: episodeData.posted_at,
              }]);

            if (insertError) {
              console.error(`Error inserting episode: ${insertError.message}`);
              errors++;
            } else {
              synced++;
            }
          } catch (err) {
            console.error(`Error processing episode:`, err);
            errors++;
          }
        }

        if (i + BATCH_SIZE < episodeIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchErr) {
        console.error(`Error processing batch:`, batchErr);
        errors += batchIds.length;
      }
    }

    console.log(`Sync complete for ${podcast.name}: ${synced} synced, ${errors} errors, ${skipped} skipped`);
  } catch (err) {
    console.error(`Error syncing podcast ${podcast.name}:`, err);
    errors++;
  }

  return { podcast_id: podcast.id, podcast_name: podcast.name, synced, errors, skipped, had_new_episodes: hadNewEpisodes };
}

async function updatePodcastTracking(
  supabase: any,
  podcastId: string,
  hadNewEpisodes: boolean,
  currentEmptyChecks: number,
  currentFrequency: number,
  adaptiveEnabled: boolean
): Promise<void> {
  let newEmptyChecks = currentEmptyChecks;
  let newFrequency = currentFrequency;

  if (hadNewEpisodes) {
    newEmptyChecks = 0;
    newFrequency = 24;
  } else if (adaptiveEnabled) {
    newEmptyChecks = currentEmptyChecks + 1;
    
    if (newEmptyChecks >= 14) {
      newFrequency = 72;
    } else if (newEmptyChecks >= 7) {
      newFrequency = 48;
    }
  }

  const nextCheckAt = new Date(Date.now() + newFrequency * 60 * 60 * 1000).toISOString();

  const updates: any = {
    next_check_at: nextCheckAt,
    check_frequency_hours: newFrequency,
    consecutive_empty_checks: newEmptyChecks,
  };

  if (hadNewEpisodes) {
    updates.last_synced_at = new Date().toISOString();
  }

  await supabase
    .from('podcasts')
    .update(updates)
    .eq('id', podcastId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const dailySyncEnabled = await getConfig(supabase, "DAILY_SYNC_ENABLED");
    if (dailySyncEnabled !== "true") {
      return new Response(
        JSON.stringify({ success: false, message: "Daily sync is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: logData } = await supabase
      .from('episode_sync_logs')
      .insert([{
        job_type: 'daily',
        started_at: new Date().toISOString(),
        status: 'running',
      }])
      .select()
      .single();

    logId = logData?.id;

    const podscanApiKey = await getConfig(supabase, "PODSCAN_API_KEY");
    const podscanApiUrl = await getConfig(supabase, "PODSCAN_API_URL") || "https://podscan.fm/api/v1";
    const batchProbeEnabled = await getConfig(supabase, "BATCH_PROBE_ENABLED") === "true";
    const maxPodcasts = parseInt(await getConfig(supabase, "MAX_PODCASTS_PER_SYNC") || "500");
    const adaptiveEnabled = await getConfig(supabase, "ADAPTIVE_FREQUENCY_ENABLED") === "true";

    if (!podscanApiKey) {
      throw new Error("PODSCAN_API_KEY not configured in app_config table");
    }

    const { data: podcasts, error: fetchError } = await supabase
      .from('podcasts')
      .select('id, podcast_id, name, is_paused, check_frequency_hours, consecutive_empty_checks, last_synced_at')
      .eq('status', 'active')
      .eq('is_paused', false)
      .lte('next_check_at', new Date().toISOString())
      .limit(maxPodcasts);

    if (fetchError) {
      throw new Error(`Failed to fetch podcasts: ${fetchError.message}`);
    }

    if (!podcasts || podcasts.length === 0) {
      if (logId) {
        await supabase
          .from('episode_sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            podcasts_checked: 0,
          })
          .eq('id', logId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "No podcasts due for checking",
          results: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${podcasts.length} podcasts to check`);

    let apiCallsUsed = 0;
    let podcastsToCheck: PodcastRecord[] = [];

    if (batchProbeEnabled && podcasts.length > 10) {
      console.log("Using batch probe to identify podcasts with new episodes...");
      
      const PROBE_BATCH_SIZE = 50;
      const podcastsWithNewEpisodes = new Set<string>();

      for (let i = 0; i < podcasts.length; i += PROBE_BATCH_SIZE) {
        const batchPodcasts = podcasts.slice(i, i + PROBE_BATCH_SIZE);
        const podcastIds = batchPodcasts.map(p => p.podcast_id);
        
        const probeResults = await batchProbePodcasts(podscanApiUrl, podscanApiKey, podcastIds);
        apiCallsUsed++;

        for (const podcast of batchPodcasts) {
          const hasNew = probeResults.get(podcast.podcast_id);
          if (hasNew) {
            podcastsWithNewEpisodes.add(podcast.podcast_id);
          } else {
            await updatePodcastTracking(
              supabase,
              podcast.id,
              false,
              podcast.consecutive_empty_checks,
              podcast.check_frequency_hours,
              adaptiveEnabled
            );
          }
        }

        if (i + PROBE_BATCH_SIZE < podcasts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      podcastsToCheck = podcasts.filter(p => podcastsWithNewEpisodes.has(p.podcast_id));
      console.log(`Batch probe found ${podcastsToCheck.length} podcasts with new episodes`);
    } else {
      podcastsToCheck = podcasts;
    }

    const results: SyncResult[] = [];
    let totalSynced = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let podcastsWithNewEpisodes = 0;

    for (const podcast of podcastsToCheck) {
      const result = await syncPodcastEpisodes(
        supabase,
        podscanApiUrl,
        podscanApiKey,
        podcast
      );
      
      results.push(result);
      totalSynced += result.synced;
      totalErrors += result.errors;
      totalSkipped += result.skipped;
      
      if (result.had_new_episodes) {
        podcastsWithNewEpisodes++;
      }

      apiCallsUsed += 1 + Math.ceil(result.synced / 50);

      await updatePodcastTracking(
        supabase,
        podcast.id,
        result.had_new_episodes,
        podcast.consecutive_empty_checks,
        podcast.check_frequency_hours,
        adaptiveEnabled
      );

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const finalStatus = totalErrors > 0 ? (totalSynced > 0 ? 'partial' : 'failed') : 'completed';

    if (logId) {
      await supabase
        .from('episode_sync_logs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          podcasts_checked: podcasts.length,
          podcasts_with_new_episodes: podcastsWithNewEpisodes,
          episodes_synced: totalSynced,
          episodes_failed: totalErrors,
          api_calls_made: apiCallsUsed,
        })
        .eq('id', logId);
    }

    const successMessage = `Daily sync complete: ${totalSynced} episodes synced from ${podcastsWithNewEpisodes} podcasts (checked ${podcasts.length} total)${
      totalSkipped > 0 ? `, ${totalSkipped} already existed` : ''
    }${totalErrors > 0 ? `, ${totalErrors} errors` : ''}. API calls: ${apiCallsUsed}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        results,
        summary: {
          total_podcasts_checked: podcasts.length,
          podcasts_with_new_episodes: podcastsWithNewEpisodes,
          total_synced: totalSynced,
          total_errors: totalErrors,
          total_skipped: totalSkipped,
          api_calls_used: apiCallsUsed,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily-sync function:", error);

    if (logId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('episode_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
