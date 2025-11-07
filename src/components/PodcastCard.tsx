import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import type { Podcast } from '../types/podcast';
import { savePodcast, unsavePodcast, isPodcastSaved } from '../services/savedPodcastsService';
import { useAuth } from '../contexts/AuthContext';
import { stripHtml, decodeHtmlEntities } from '../utils/textUtils';

interface PodcastCardProps {
  podcast: Podcast;
  onClick: () => void;
  onSaveChange?: () => void;
}

export default function PodcastCard({ podcast, onClick, onSaveChange }: PodcastCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  useEffect(() => {
    if (user) {
      isPodcastSaved(podcast.podcast_id).then(setIsSaved);
    }
  }, [user, podcast.podcast_id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isTogglingBookmark) return;

    setIsTogglingBookmark(true);
    try {
      if (isSaved) {
        await unsavePodcast(podcast.podcast_id);
        setIsSaved(false);
      } else {
        await savePodcast(podcast);
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
    <div className="w-full bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm hover:shadow-lg transition-all p-5 flex gap-4 border border-slate-200 hover:border-emerald-300 relative group">
      <button
        onClick={onClick}
        className="absolute inset-0 z-0"
        aria-label="View podcast details"
      />

      <img
        src={podcast.podcast_image_url}
        alt={podcast.podcast_name}
        className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-md ring-2 ring-slate-100 group-hover:ring-emerald-200 transition-all"
        loading="lazy"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-lg bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent line-clamp-1 flex-1 group-hover:from-emerald-700 group-hover:to-teal-700 transition-all">
            {decodeHtmlEntities(podcast.podcast_name)}
          </h3>
          {user && (
            <button
              onClick={handleBookmarkClick}
              disabled={isTogglingBookmark}
              className="relative z-10 p-2 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label={isSaved ? 'Unsave podcast' : 'Save podcast'}
            >
              <Bookmark
                className={`w-5 h-5 ${
                  isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400'
                }`}
              />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
          {podcast.publisher_name}
        </p>
        {podcast.podcast_description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2 break-words">
            {stripHtml(podcast.podcast_description)}
          </p>
        )}
        {podcast.podcast_categories && podcast.podcast_categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {podcast.podcast_categories.slice(0, 3).map((cat) => (
              <span
                key={cat.category_id}
                className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium"
              >
                {cat.category_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
