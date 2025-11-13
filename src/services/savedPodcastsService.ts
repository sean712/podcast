import { supabase } from '../lib/supabase';
import type { Podcast } from '../types/podcast';

export interface SavedPodcast {
  id: string;
  user_id: string;
  podcast_id: string;
  podcast_title: string;
  podcast_author: string | null;
  podcast_image: string | null;
  saved_at: string;
  created_at: string;
}

export async function getSavedPodcasts(): Promise<Podcast[]> {
  const { data, error } = await supabase
    .from('saved_podcasts')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch saved podcasts: ${error.message}`);
  }

  return (data || []).map(saved => ({
    podcast_id: saved.podcast_id,
    podcast_guid: '',
    podcast_name: saved.podcast_title,
    podcast_url: '',
    podcast_description: '',
    podcast_image_url: saved.podcast_image || '',
    podcast_categories: [],
    publisher_name: saved.podcast_author || '',
    reach: {
      audience_size: 0
    }
  }));
}

export async function savePodcast(podcast: Podcast): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to save podcasts');
  }

  const { error } = await supabase
    .from('saved_podcasts')
    .insert({
      user_id: user.id,
      podcast_id: podcast.podcast_id,
      podcast_title: podcast.podcast_name,
      podcast_author: podcast.publisher_name,
      podcast_image: podcast.podcast_image_url,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Podcast already saved');
    }
    throw new Error(`Failed to save podcast: ${error.message}`);
  }
}

export async function unsavePodcast(podcastId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to unsave podcasts');
  }

  const { error } = await supabase
    .from('saved_podcasts')
    .delete()
    .eq('user_id', user.id)
    .eq('podcast_id', podcastId);

  if (error) {
    throw new Error(`Failed to unsave podcast: ${error.message}`);
  }
}

export async function isPodcastSaved(podcastId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('saved_podcasts')
    .select('id')
    .eq('user_id', user.id)
    .eq('podcast_id', podcastId)
    .maybeSingle();

  if (error) {
    console.error('Error checking saved status:', error);
    return false;
  }

  return !!data;
}
