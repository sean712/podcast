export interface PodcastCategory {
  category_id: string;
  category_name: string;
}

export interface PodcastReach {
  itunes?: {
    itunes_rating_average: string;
    itunes_rating_count: string;
    itunes_rating_count_bracket: string;
  };
  spotify?: {
    spotify_rating_average: string;
    spotify_rating_count: string;
    spotify_rating_count_bracket: string;
  };
  audience_size: number;
}

export interface Podcast {
  podcast_id: string;
  podcast_guid: string;
  podcast_name: string;
  podcast_url: string;
  podcast_description: string;
  podcast_image_url: string;
  podcast_categories: PodcastCategory[];
  publisher_name: string;
  reach: PodcastReach;
}

export interface Episode {
  episode_id: string;
  episode_guid: string;
  episode_title: string;
  episode_url: string;
  episode_audio_url: string;
  episode_image_url: string;
  episode_description: string;
  episode_duration: number;
  episode_word_count: number;
  posted_at: string;
  episode_transcript?: string;
  episode_transcript_word_level_timestamps?: any;
  episode_fully_processed: boolean;
  podcast?: {
    podcast_id: string;
    podcast_name: string;
  };
}

export interface PodcastSearchResponse {
  podcasts: Podcast[];
}

export interface EpisodesResponse {
  episodes: Episode[];
}

export interface SingleEpisodeResponse {
  episode: Episode;
}
