import { supabase } from '../lib/supabase';
import type { Episode } from '../types/podcast';

export interface SavedEpisode {
  id: string;
  user_id: string;
  episode_id: string;
  episode_title: string;
  episode_description: string | null;
  episode_image_url: string | null;
  episode_duration: number | null;
  podcast_id: string;
  podcast_name: string;
  posted_at: string | null;
  saved_at: string;
  created_at: string;
}

export async function getSavedEpisodes(): Promise<Episode[]> {
  const { data, error } = await supabase
    .from('saved_episodes')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch saved episodes: ${error.message}`);
  }

  return (data || []).map(saved => ({
    episode_id: saved.episode_id,
    episode_guid: '',
    episode_title: saved.episode_title,
    episode_url: '',
    episode_audio_url: '',
    episode_image_url: saved.episode_image_url || '',
    episode_description: saved.episode_description || '',
    episode_duration: saved.episode_duration || 0,
    episode_word_count: 0,
    posted_at: saved.posted_at || '',
    episode_fully_processed: false,
    podcast: {
      podcast_id: saved.podcast_id,
      podcast_name: saved.podcast_name,
    }
  }));
}

export async function saveEpisode(episode: Episode): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to save episodes');
  }

  const { error } = await supabase
    .from('saved_episodes')
    .insert({
      user_id: user.id,
      episode_id: episode.episode_id,
      episode_title: episode.episode_title,
      episode_description: episode.episode_description,
      episode_image_url: episode.episode_image_url,
      episode_duration: episode.episode_duration,
      podcast_id: episode.podcast?.podcast_id || '',
      podcast_name: episode.podcast?.podcast_name || 'Unknown Podcast',
      posted_at: episode.posted_at,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Episode already saved');
    }
    throw new Error(`Failed to save episode: ${error.message}`);
  }
}

export async function unsaveEpisode(episodeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to unsave episodes');
  }

  const { error } = await supabase
    .from('saved_episodes')
    .delete()
    .eq('user_id', user.id)
    .eq('episode_id', episodeId);

  if (error) {
    throw new Error(`Failed to unsave episode: ${error.message}`);
  }
}

export async function isEpisodeSaved(episodeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('saved_episodes')
    .select('id')
    .eq('user_id', user.id)
    .eq('episode_id', episodeId)
    .maybeSingle();

  if (error) {
    console.error('Error checking saved status:', error);
    return false;
  }

  return !!data;
}
