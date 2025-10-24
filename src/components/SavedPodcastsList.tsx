import { useEffect, useState } from 'react';
import { Bookmark, Loader2, AlertCircle } from 'lucide-react';
import PodcastCard from './PodcastCard';
import { getSavedPodcasts } from '../services/savedPodcastsService';
import type { Podcast } from '../types/podcast';

interface SavedPodcastsListProps {
  onSelectPodcast: (podcast: Podcast) => void;
  onRefresh?: number;
}

export default function SavedPodcastsList({ onSelectPodcast, onRefresh }: SavedPodcastsListProps) {
  const [savedPodcasts, setSavedPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedPodcasts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const podcasts = await getSavedPodcasts();
      setSavedPodcasts(podcasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved podcasts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPodcasts();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">Error loading saved podcasts</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (savedPodcasts.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved podcasts yet</h3>
        <p className="text-gray-600">
          Search for podcasts and click the bookmark icon to save them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-blue-600" />
        Your Saved Podcasts ({savedPodcasts.length})
      </h2>
      <div className="grid gap-4">
        {savedPodcasts.map((podcast) => (
          <PodcastCard
            key={podcast.podcast_id}
            podcast={podcast}
            onClick={() => onSelectPodcast(podcast)}
            onSaveChange={loadSavedPodcasts}
          />
        ))}
      </div>
    </div>
  );
}
