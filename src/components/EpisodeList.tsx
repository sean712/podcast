import { useState, useEffect } from 'react';
import { Clock, Calendar, Bookmark } from 'lucide-react';
import type { Episode } from '../types/podcast';
import { saveEpisode, unsaveEpisode, isEpisodeSaved } from '../services/savedEpisodesService';
import { useAuth } from '../contexts/AuthContext';

interface EpisodeListProps {
  episodes: Episode[];
  onEpisodeClick: (episode: Episode) => void;
  isLoading?: boolean;
  onSaveChange?: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function EpisodeItem({ episode, onEpisodeClick, onSaveChange }: { episode: Episode; onEpisodeClick: (episode: Episode) => void; onSaveChange?: () => void }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  useEffect(() => {
    if (user) {
      isEpisodeSaved(episode.episode_id).then(setIsSaved);
    }
  }, [user, episode.episode_id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isTogglingBookmark) return;

    setIsTogglingBookmark(true);
    try {
      if (isSaved) {
        await unsaveEpisode(episode.episode_id);
        setIsSaved(false);
      } else {
        await saveEpisode(episode);
        setIsSaved(true);
      }
      onSaveChange?.();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 hover:shadow-lg transition-all border border-slate-200 hover:border-emerald-300 group">
      <button
        onClick={() => onEpisodeClick(episode)}
        className="absolute inset-0 z-0"
        aria-label="View episode"
      />
      <div className="flex gap-4">
        {episode.episode_image_url && (
          <img
            src={episode.episode_image_url}
            alt={episode.episode_title}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:bg-clip-text group-hover:text-transparent transition-all flex-1">
              {episode.episode_title}
            </h3>
            {user && (
              <button
                onClick={handleBookmarkClick}
                disabled={isTogglingBookmark}
                className="relative z-10 p-2 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                aria-label={isSaved ? 'Unsave episode' : 'Save episode'}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400'
                  }`}
                />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(episode.posted_at)}</span>
            </div>
            {episode.episode_duration > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(episode.episode_duration)}</span>
              </div>
            )}
            {episode.episode_fully_processed && episode.episode_word_count > 0 && (
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                Transcript Available
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EpisodeList({ episodes, onEpisodeClick, isLoading, onSaveChange }: EpisodeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No episodes found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <EpisodeItem
          key={episode.episode_id}
          episode={episode}
          onEpisodeClick={onEpisodeClick}
          onSaveChange={onSaveChange}
        />
      ))}
    </div>
  );
}
