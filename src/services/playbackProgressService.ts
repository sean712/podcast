import { supabase } from '../lib/supabase';

export interface PlaybackProgress {
  id: string;
  user_id: string;
  episode_id: string;
  episode_title: string;
  podcast_name: string;
  audio_url: string;
  current_position: number;
  duration: number;
  completed: boolean;
  last_updated: string;
  created_at: string;
}

export async function savePlaybackProgress(
  episodeId: string,
  episodeTitle: string,
  podcastName: string,
  audioUrl: string,
  currentPosition: number,
  duration: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to save playback progress');
  }

  const completed = duration > 0 && currentPosition >= duration * 0.9;

  const { error } = await supabase
    .from('playback_progress')
    .upsert(
      {
        user_id: user.id,
        episode_id: episodeId,
        episode_title: episodeTitle,
        podcast_name: podcastName,
        audio_url: audioUrl,
        current_position: currentPosition,
        duration: duration,
        completed: completed,
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,episode_id',
      }
    );

  if (error) {
    console.error('Error saving playback progress:', error);
    throw error;
  }
}

export async function getPlaybackProgress(episodeId: string): Promise<PlaybackProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('playback_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('episode_id', episodeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching playback progress:', error);
    return null;
  }

  return data;
}

export async function deletePlaybackProgress(episodeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete playback progress');
  }

  const { error } = await supabase
    .from('playback_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('episode_id', episodeId);

  if (error) {
    console.error('Error deleting playback progress:', error);
    throw error;
  }
}

export async function getRecentPlaybackProgress(limit: number = 10): Promise<PlaybackProgress[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('playback_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('last_updated', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent playback progress:', error);
    return [];
  }

  return data || [];
}
