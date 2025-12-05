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
  key_moments: any[];
  references: any[];
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

  if (data) {
    console.log('✓ Cache hit: Loaded analysis from database', { episodeId, version: data.analysis_version });
  } else {
    console.log('✗ Cache miss: No cached analysis found, will analyze transcript', { episodeId });
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
    .upsert(
      {
        episode_id: episodeId,
        episode_title: episodeTitle,
        podcast_name: podcastName,
        summary: analysis.summary,
        key_personnel: analysis.keyPersonnel,
        timeline_events: analysis.timeline,
        locations: locations,
        key_moments: analysis.keyMoments,
        references: analysis.references,
        analysis_version: 'v7',
      },
      {
        onConflict: 'episode_id',
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error('✗ Error saving cached analysis:', error);
    throw new Error(`Failed to cache analysis: ${error.message}`);
  }

  console.log('✓ Successfully cached analysis to database', { episodeId, version: 'v7' });
}

export async function deleteAnalysis(episodeId: string): Promise<void> {
  const { error } = await supabase
    .from('episode_analyses')
    .delete()
    .eq('episode_id', episodeId);

  if (error) {
    console.error('✗ Error deleting cached analysis:', error);
    throw new Error(`Failed to delete analysis: ${error.message}`);
  }

  console.log('✓ Successfully deleted cached analysis', { episodeId });
}
