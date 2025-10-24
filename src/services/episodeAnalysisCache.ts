import { supabase } from '../lib/supabase';
import type { TranscriptAnalysis } from './openaiService';
import type { GeocodedLocation } from './geocodingService';

export interface CachedAnalysis {
  id: string;
  episode_id: string;
  episode_title: string;
  podcast_name: string;
  summary: string;
  key_personnel: any[];
  timeline_events: any[];
  locations: GeocodedLocation[];
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export async function getCachedAnalysis(episodeId: string): Promise<CachedAnalysis | null> {
  const { data, error } = await supabase
    .from('episode_analyses')
    .select('*')
    .eq('episode_id', episodeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching cached analysis:', error);
    return null;
  }

  return data;
}

export async function saveCachedAnalysis(
  episodeId: string,
  episodeTitle: string,
  podcastName: string,
  analysis: TranscriptAnalysis,
  locations: GeocodedLocation[]
): Promise<void> {
  const { error } = await supabase
    .from('episode_analyses')
    .insert({
      episode_id: episodeId,
      episode_title: episodeTitle,
      podcast_name: podcastName,
      summary: analysis.summary,
      key_personnel: analysis.keyPersonnel,
      timeline_events: analysis.timeline,
      locations: locations,
      analysis_version: 'v1',
    });

  if (error) {
    if (error.code === '23505') {
      console.log('Analysis already cached for this episode');
      return;
    }
    console.error('Error saving cached analysis:', error);
    throw new Error(`Failed to cache analysis: ${error.message}`);
  }
}
