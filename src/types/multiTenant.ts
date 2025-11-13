export interface PodcastSpace {
  id: string;
  podcast_id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  publisher_name: string | null;
  status: 'active' | 'inactive' | 'pending';
  is_paused: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PodcastSettings {
  id: string;
  podcast_id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  custom_header_text: string | null;
  analytics_code: string | null;
  visible_tabs: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface StoredEpisode {
  id: string;
  podcast_id: string;
  episode_id: string;
  episode_guid: string | null;
  title: string;
  slug: string;
  description: string;
  audio_url: string | null;
  image_url: string | null;
  duration: number;
  word_count: number;
  transcript: string | null;
  transcript_word_timestamps: any;
  published_at: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface PodcastAdmin {
  id: string;
  podcast_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
}
