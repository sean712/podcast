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
  consecutive_empty_checks?: number;
}

interface SyncResult {
  podcast_id: string;
  podcast_name: string;
  synced: number;
  errors: number;
  skipped: number;
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

async function syncPodcastEpisodes(
  supabase: any,
  podscanApiUrl: string,
  podscanApiKey: string,
  podcast: PodcastRecord
): Promise<SyncResult> {
  let synced = 0;
  let errors = 0;
  let skipped = 0;

  try {
    console.log(`Starting sync for podcast: ${podcast.name}`);

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
      return { podcast_id: podcast.id, podcast_name: podcast.name, synced: 0, errors: 0, skipped: 0 };
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
      }
    }

    if (newEpisodes.length === 0) {
      console.log(`All episodes already synced for ${podcast.name}`);
      return { podcast_id: podcast.id, podcast_name: podcast.name, synced: 0, errors: 0, skipped };
    }

    console.log(`Syncing ${newEpisodes.length} new episodes for ${podcast.name}`);

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

    const updates: any = {
      last_synced_at: new Date().toISOString(),
      next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      consecutive_empty_checks: synced > 0 ? 0 : (podcast as any).consecutive_empty_checks || 0,
    };

    await supabase
      .from('podcasts')
      .update(updates)
      .eq('id', podcast.id);

    console.log(`Sync complete for ${podcast.name}: ${synced} synced, ${errors} errors, ${skipped} skipped`);
  } catch (err) {
    console.error(`Error syncing podcast ${podcast.name}:`, err);
    errors++;
  }

  return { podcast_id: podcast.id, podcast_name: podcast.name, synced, errors, skipped };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const podscanApiKey = await getConfig(supabase, "PODSCAN_API_KEY");
    const podscanApiUrl = await getConfig(supabase, "PODSCAN_API_URL") || "https://podscan.fm/api/v1";

    if (!podscanApiKey) {
      throw new Error("PODSCAN_API_KEY not configured in app_config table");
    }

    const { data: podcasts, error: fetchError } = await supabase
      .from('podcasts')
      .select('id, podcast_id, name, is_paused, consecutive_empty_checks')
      .eq('status', 'active')
      .eq('is_paused', false);

    if (fetchError) {
      throw new Error(`Failed to fetch podcasts: ${fetchError.message}`);
    }

    if (!podcasts || podcasts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active podcasts to sync",
          results: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${podcasts.length} active podcasts to sync`);

    const results: SyncResult[] = [];
    let totalSynced = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    for (const podcast of podcasts) {
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

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successMessage = `Sync complete: ${totalSynced} episodes synced across ${podcasts.length} podcasts${
      totalSkipped > 0 ? `, ${totalSkipped} already existed` : ''
    }${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        results,
        summary: {
          total_podcasts: podcasts.length,
          total_synced: totalSynced,
          total_errors: totalErrors,
          total_skipped: totalSkipped,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-episodes function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
