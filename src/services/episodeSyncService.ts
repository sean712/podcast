import { supabase } from '../lib/supabase';
import { getPodcastEpisodes, bulkDownloadEpisodes } from './podscanApi';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

interface SyncOptions {
  maxEpisodes?: number;
  batchSize?: number;
}

export async function syncPodcastEpisodes(
  internalPodcastId: string,
  podscanPodcastId: string,
  options: SyncOptions = {}
): Promise<{ synced: number; errors: number; total: number }> {
  const { maxEpisodes = 250, batchSize = 50 } = options;
  let synced = 0;
  let errors = 0;

  try {
    const episodesPerPage = Math.min(batchSize, maxEpisodes);
    const response = await getPodcastEpisodes(podscanPodcastId, {
      perPage: episodesPerPage,
      showOnlyFullyProcessed: true,
      orderBy: 'posted_at',
      orderDir: 'desc',
    });

    const episodes = response.episodes || [];
    const totalEpisodes = episodes.length;

    if (episodes.length === 0) {
      console.log('No episodes found');
      return { synced: 0, errors: 0, total: 0 };
    }

    console.log(`Found ${episodes.length} episodes to process`);

    const newEpisodes = [];
    for (const episode of episodes) {
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('episode_id', episode.episode_id)
        .maybeSingle();

      if (!existing) {
        newEpisodes.push(episode);
      }
    }

    if (newEpisodes.length === 0) {
      console.log('All episodes already synced');
      return { synced: 0, errors: 0, total: totalEpisodes };
    }

    console.log(`${newEpisodes.length} new episodes to sync`);

    const episodeIdsToFetch = newEpisodes
      .slice(0, Math.min(newEpisodes.length, maxEpisodes))
      .map(ep => ep.episode_id);

    const BULK_BATCH_SIZE = 50;
    for (let i = 0; i < episodeIdsToFetch.length; i += BULK_BATCH_SIZE) {
      const batchIds = episodeIdsToFetch.slice(i, i + BULK_BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BULK_BATCH_SIZE) + 1}: ${batchIds.length} episodes`);

      try {
        const bulkResponse = await bulkDownloadEpisodes(batchIds, {
          showFullPodcast: false,
          wordLevelTimestamps: true,
        });

        const fullEpisodes = bulkResponse.episodes || [];

        for (const episodeData of fullEpisodes) {
          try {
            const slug = generateSlug(episodeData.episode_title);

            const { error: insertError } = await supabase
              .from('episodes')
              .insert([{
                podcast_id: internalPodcastId,
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
              console.error(`Error inserting episode ${episodeData.episode_id}:`, insertError);
              errors++;
            } else {
              synced++;
              console.log(`Synced: ${episodeData.episode_title} (${synced}/${newEpisodes.length})`);
            }
          } catch (err) {
            console.error(`Error processing episode ${episodeData.episode_id}:`, err);
            errors++;
          }
        }

        if (i + BULK_BATCH_SIZE < episodeIdsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (bulkErr) {
        console.error(`Error bulk downloading batch starting at index ${i}:`, bulkErr);
        errors += batchIds.length;
      }
    }

    const { error: updateError } = await supabase
      .from('podcasts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', internalPodcastId);

    if (updateError) {
      console.error('Error updating last_synced_at:', updateError);
    }

    console.log(`Sync complete: ${synced} synced, ${errors} errors, ${totalEpisodes} total available`);
  } catch (err) {
    console.error('Error syncing podcast episodes:', err);
    throw err;
  }

  return { synced, errors, total: synced + errors };
}
