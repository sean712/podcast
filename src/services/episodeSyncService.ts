import { supabase } from '../lib/supabase';
import { getPodcastEpisodes, getEpisode } from './podscanApi';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

export async function syncPodcastEpisodes(
  internalPodcastId: string,
  podscanPodcastId: string
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    const response = await getPodcastEpisodes(podscanPodcastId, {
      perPage: 50,
      showOnlyFullyProcessed: true,
    });

    const episodes = response.episodes || [];

    for (const episode of episodes) {
      try {
        const { data: existing } = await supabase
          .from('episodes')
          .select('id')
          .eq('episode_id', episode.episode_id)
          .maybeSingle();

        if (existing) {
          continue;
        }

        const fullEpisode = await getEpisode(episode.episode_id, {
          showFullPodcast: false,
          wordLevelTimestamps: true,
        });

        const episodeData = fullEpisode.episode;
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
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error processing episode:`, err);
        errors++;
      }
    }

    const { error: updateError } = await supabase
      .from('podcasts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', internalPodcastId);

    if (updateError) {
      console.error('Error updating last_synced_at:', updateError);
    }
  } catch (err) {
    console.error('Error syncing podcast episodes:', err);
    throw err;
  }

  return { synced, errors };
}
