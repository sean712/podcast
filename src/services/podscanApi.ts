import type { PodcastSearchResponse, EpisodesResponse, SingleEpisodeResponse } from '../types/podcast';

const API_BASE_URL = import.meta.env.VITE_PODSCAN_API_URL || 'https://podscan.fm/api/v1';
const API_KEY = import.meta.env.VITE_PODSCAN_API_KEY;

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

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  if (!API_KEY || API_KEY === 'your_podscan_api_key_here') {
    throw new PodscanApiError('Podscan API key is not configured. Please set VITE_PODSCAN_API_KEY in your .env file.');
  }

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
  const rateLimitRemainingNum = rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new PodscanApiError(
      errorData.error || `API request failed with status ${response.status}`,
      response.status,
      rateLimitRemainingNum
    );
  }

  return {
    data: await response.json(),
    rateLimitRemaining: rateLimitRemainingNum,
  };
}

export async function searchPodcasts(
  query: string,
  options: {
    perPage?: number;
    orderBy?: 'best_match' | 'name' | 'created_at' | 'episode_count' | 'rating' | 'audience_size' | 'last_posted_at';
    orderDir?: 'asc' | 'desc';
  } = {}
): Promise<PodcastSearchResponse> {
  const params = new URLSearchParams({
    query,
    per_page: (options.perPage || 20).toString(),
    order_by: options.orderBy || 'best_match',
    order_dir: options.orderDir || 'desc',
  });

  const { data } = await fetchWithAuth(`${API_BASE_URL}/podcasts/search?${params}`);
  return data as PodcastSearchResponse;
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
  const params = new URLSearchParams({
    per_page: (options.perPage || 50).toString(),
    order_by: options.orderBy || 'posted_at',
    order_dir: options.orderDir || 'desc',
    show_only_fully_processed: (options.showOnlyFullyProcessed ?? false).toString(),
  });

  const { data } = await fetchWithAuth(`${API_BASE_URL}/podcasts/${podcastId}/episodes?${params}`);
  return data as EpisodesResponse;
}

export async function getEpisode(
  episodeId: string,
  options: {
    showFullPodcast?: boolean;
    wordLevelTimestamps?: boolean;
    transcriptFormatter?: 'paragraph';
  } = {}
): Promise<SingleEpisodeResponse> {
  const params = new URLSearchParams({
    show_full_podcast: (options.showFullPodcast ?? false).toString(),
    word_level_timestamps: (options.wordLevelTimestamps ?? false).toString(),
  });

  if (options.transcriptFormatter) {
    params.set('transcript_formatter', options.transcriptFormatter);
  }

  const { data } = await fetchWithAuth(`${API_BASE_URL}/episodes/${episodeId}?${params}`);
  return data as SingleEpisodeResponse;
}

export { PodscanApiError };
