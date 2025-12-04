import { supabase } from '../lib/supabase';

export interface FeaturedEpisode {
  episode_id: string;
  episode_title: string;
  episode_slug: string;
  description: string;
  published_date: string;
  audio_url: string;
  featured_at: string;
  podcast_id: string;
  podcast_title: string;
  podcast_slug: string;
  artwork_url?: string;
  creator_name?: string;
}

export const featuredEpisodesService = {
  async getFeaturedEpisodes(): Promise<FeaturedEpisode[]> {
    const { data, error } = await supabase
      .from('episode_analyses')
      .select(`
        episode_id,
        episode_title,
        episode_slug,
        description,
        published_date,
        audio_url,
        featured_at,
        podcast_id,
        podcasts (
          podcast_title,
          podcast_slug,
          artwork_url,
          creator_name
        )
      `)
      .eq('is_featured', true)
      .order('featured_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured episodes:', error);
      throw error;
    }

    return (data || []).map((episode: any) => ({
      episode_id: episode.episode_id,
      episode_title: episode.episode_title,
      episode_slug: episode.episode_slug,
      description: episode.description,
      published_date: episode.published_date,
      audio_url: episode.audio_url,
      featured_at: episode.featured_at,
      podcast_id: episode.podcast_id,
      podcast_title: episode.podcasts?.podcast_title || '',
      podcast_slug: episode.podcasts?.podcast_slug || '',
      artwork_url: episode.podcasts?.artwork_url,
      creator_name: episode.podcasts?.creator_name,
    }));
  },

  async toggleFeaturedStatus(episodeId: string, isFeatured: boolean): Promise<void> {
    const updateData = isFeatured
      ? { is_featured: true, featured_at: new Date().toISOString() }
      : { is_featured: false, featured_at: null };

    const { error } = await supabase
      .from('episode_analyses')
      .update(updateData)
      .eq('episode_id', episodeId);

    if (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  },
};
