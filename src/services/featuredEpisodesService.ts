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
    const { data: episodesData, error: episodesError } = await supabase
      .from('episodes')
      .select(`
        episode_id,
        title,
        slug,
        description,
        published_at,
        audio_url,
        podcast_id,
        featured_at,
        podcasts (
          name,
          slug,
          image_url,
          publisher_name
        )
      `)
      .eq('is_featured', true)
      .order('featured_at', { ascending: false });

    if (episodesError) {
      console.error('Error fetching featured episodes:', episodesError);
      throw episodesError;
    }

    if (!episodesData || episodesData.length === 0) {
      return [];
    }

    const episodes = episodesData.map((episode: any) => ({
      episode_id: episode.episode_id,
      episode_title: episode.title,
      episode_slug: episode.slug,
      description: episode.description || '',
      published_date: episode.published_at,
      audio_url: episode.audio_url || '',
      featured_at: episode.featured_at || new Date().toISOString(),
      podcast_id: episode.podcast_id,
      podcast_title: episode.podcasts?.name || '',
      podcast_slug: episode.podcasts?.slug || '',
      artwork_url: episode.podcasts?.image_url,
      creator_name: episode.podcasts?.publisher_name,
    }));

    return episodes;
  },

  async toggleFeaturedStatus(episodeId: string, isFeatured: boolean): Promise<void> {
    const updateData = isFeatured
      ? { is_featured: true, featured_at: new Date().toISOString() }
      : { is_featured: false, featured_at: null };

    const { error } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('episode_id', episodeId);

    if (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  },
};
