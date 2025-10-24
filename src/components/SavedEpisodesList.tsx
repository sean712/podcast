import { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import type { Episode } from '../types/podcast';
import { getSavedEpisodes } from '../services/savedEpisodesService';
import EpisodeList from './EpisodeList';

interface SavedEpisodesListProps {
  onSelectEpisode: (episode: Episode) => void;
}

export default function SavedEpisodesList({ onSelectEpisode }: SavedEpisodesListProps) {
  const [savedEpisodes, setSavedEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const episodes = await getSavedEpisodes();
      setSavedEpisodes(episodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved episodes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedEpisodes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (savedEpisodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No saved episodes yet</p>
        <p className="text-gray-400 text-sm">
          Bookmark episodes to save them for later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-blue-600" />
        Your Saved Episodes ({savedEpisodes.length})
      </h2>
      <EpisodeList
        episodes={savedEpisodes}
        onEpisodeClick={onSelectEpisode}
        onSaveChange={loadSavedEpisodes}
      />
    </div>
  );
}
