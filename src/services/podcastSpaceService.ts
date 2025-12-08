import { supabase } from '../lib/supabase';
import type { PodcastSpace, PodcastSettings, StoredEpisode } from '../types/multiTenant';

export async function getPodcastBySlug(slug: string): Promise<PodcastSpace | null> {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('is_paused', false)
    .maybeSingle();

  if (error) {
    console.error('Error fetching podcast by slug:', error);
    throw error;
  }

  return data;
}

export async function getPodcastSettings(podcastId: string): Promise<PodcastSettings | null> {
  const { data, error } = await supabase
    .from('podcast_settings')
    .select('*')
    .eq('podcast_id', podcastId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching podcast settings:', error);
    throw error;
  }

  return data;
}

export async function getPodcastEpisodesFromDB(
  podcastId: string,
  limit: number = 50
): Promise<StoredEpisode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('id, podcast_id, episode_id, episode_guid, title, slug, description, audio_url, image_url, duration, word_count, published_at, synced_at, created_at, updated_at, transcript')
    .eq('podcast_id', podcastId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching episodes:', error);
    throw error;
  }

  return (data || []).map(episode => ({
    ...episode,
    transcript_word_timestamps: null
  }));
}

export async function getEpisodeBySlug(
  podcastId: string,
  episodeSlug: string
): Promise<StoredEpisode | null> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('podcast_id', podcastId)
    .eq('slug', episodeSlug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching episode by slug:', error);
    throw error;
  }

  return data;
}

export async function getAllActivePodcasts(): Promise<PodcastSpace[]> {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error fetching active podcasts:', error);
    throw error;
  }

  return data || [];
}

export async function createPodcast(podcast: {
  podcast_id: string;
  slug: string;
  name: string;
  description: string;
  image_url?: string;
  publisher_name?: string;
  podcast_url?: string;
}): Promise<PodcastSpace> {
  console.log('Creating podcast with data:', podcast);

  const { data: { session } } = await supabase.auth.getSession();
  console.log('Current session:', session ? 'Authenticated' : 'NOT AUTHENTICATED');
  console.log('User ID:', session?.user?.id);
  console.log('User email:', session?.user?.email);

  const { data, error } = await supabase
    .from('podcasts')
    .insert([podcast])
    .select()
    .single();

  if (error) {
    console.error('Error creating podcast:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('Podcast created successfully:', data);

  const { error: settingsError } = await supabase
    .from('podcast_settings')
    .insert([{ podcast_id: data.id }]);

  if (settingsError) {
    console.error('Error creating podcast settings:', settingsError);
  }

  return data;
}

export async function updatePodcastStatus(
  podcastId: string,
  status: 'active' | 'inactive' | 'pending'
): Promise<void> {
  const { error } = await supabase
    .from('podcasts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', podcastId);

  if (error) {
    console.error('Error updating podcast status:', error);
    throw error;
  }
}

export async function deletePodcast(podcastId: string): Promise<void> {
  const { error } = await supabase
    .from('podcasts')
    .delete()
    .eq('id', podcastId);

  if (error) {
    console.error('Error deleting podcast:', error);
    throw error;
  }
}

export async function togglePodcastPause(podcastId: string, isPaused: boolean): Promise<void> {
  const { error } = await supabase
    .from('podcasts')
    .update({ is_paused: isPaused, updated_at: new Date().toISOString() })
    .eq('id', podcastId);

  if (error) {
    console.error('Error toggling podcast pause:', error);
    throw error;
  }
}

export async function updatePodcastSlug(podcastId: string, newSlug: string): Promise<void> {
  const { error } = await supabase
    .from('podcasts')
    .update({ slug: newSlug, updated_at: new Date().toISOString() })
    .eq('id', podcastId);

  if (error) {
    console.error('Error updating podcast slug:', error);
    throw error;
  }
}

export async function getFeaturedEpisodes(podcastId: string): Promise<StoredEpisode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('id, podcast_id, episode_id, episode_guid, title, slug, description, audio_url, image_url, duration, word_count, published_at, synced_at, created_at, updated_at')
    .eq('podcast_id', podcastId)
    .eq('is_featured', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured episodes:', error);
    throw error;
  }

  return (data || []).map(episode => ({
    ...episode,
    transcript: null,
    transcript_word_timestamps: null
  }));
}

export async function updatePodcastClientStatus(podcastId: string, isClient: boolean): Promise<void> {
  const { error } = await supabase
    .from('podcasts')
    .update({ is_client: isClient, updated_at: new Date().toISOString() })
    .eq('id', podcastId);

  if (error) {
    console.error('Error updating podcast client status:', error);
    throw error;
  }
}
