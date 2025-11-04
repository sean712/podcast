import { supabase } from '../lib/supabase';
import type { PodcastSearchResponse, EpisodesResponse, SingleEpisodeResponse } from '../types/podcast';

class PodscanApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public rateLimitRemaining?: number
  ) {
    super(message);
    this.name = 'PodscanApiError';
  }
}

export async function searchPodcasts(
  query: string,
  options: {
    perPage?: number;
    orderBy?: 'best_match' | 'name' | 'created_at' | 'episode_count' | 'rating' | 'audience_size' | 'last_posted_at';
    orderDir?: 'asc' | 'desc';
  } = {}
): Promise<PodcastSearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('podscan-proxy', {
      body: {
        action: 'search',
        query,
        perPage: options.perPage || 20,
        orderBy: options.orderBy || 'best_match',
        orderDir: options.orderDir || 'desc',
      },
    });

    if (error) {
      throw new PodscanApiError(error.message || 'Failed to search podcasts');
    }

    return data as PodcastSearchResponse;
  } catch (error) {
    if (error instanceof PodscanApiError) {
      throw error;
    }
    throw new PodscanApiError('Failed to search podcasts');
  }
}

export async function getPodcastEpisodes(
  podcastId: string,
  options: {
    perPage?: number;
    orderBy?: 'posted_at' | 'created_at' | 'title' | 'podcast_rating';
    orderDir?: 'asc' | 'desc';
    showOnlyFullyProcessed?: boolean;
  } = {}
): Promise<EpisodesResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('podscan-proxy', {
      body: {
        action: 'getEpisodes',
        podcastId,
        perPage: options.perPage || 50,
        orderBy: options.orderBy || 'posted_at',
        orderDir: options.orderDir || 'desc',
        showOnlyFullyProcessed: options.showOnlyFullyProcessed ?? false,
      },
    });

    if (error) {
      throw new PodscanApiError(error.message || 'Failed to get podcast episodes');
    }

    return data as EpisodesResponse;
  } catch (error) {
    if (error instanceof PodscanApiError) {
      throw error;
    }
    throw new PodscanApiError('Failed to get podcast episodes');
  }
}

export async function getEpisode(
  episodeId: string,
  options: {
    showFullPodcast?: boolean;
    wordLevelTimestamps?: boolean;
    transcriptFormatter?: 'paragraph';
  } = {}
): Promise<SingleEpisodeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('podscan-proxy', {
      body: {
        action: 'getEpisode',
        episodeId,
        showFullPodcast: options.showFullPodcast ?? false,
        wordLevelTimestamps: options.wordLevelTimestamps ?? false,
        transcriptFormatter: options.transcriptFormatter,
      },
    });

    if (error) {
      throw new PodscanApiError(error.message || 'Failed to get episode');
    }

    return data as SingleEpisodeResponse;
  } catch (error) {
    if (error instanceof PodscanApiError) {
      throw error;
    }
    throw new PodscanApiError('Failed to get episode');
  }
}

export { PodscanApiError };
