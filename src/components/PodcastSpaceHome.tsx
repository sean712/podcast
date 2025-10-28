import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Radio } from 'lucide-react';
import { getPodcastEpisodesFromDB } from '../services/podcastSpaceService';
import type { PodcastSpace, PodcastSettings, StoredEpisode } from '../types/multiTenant';

interface PodcastSpaceHomeProps {
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  onEpisodeClick: (episode: StoredEpisode) => void;
}

export default function PodcastSpaceHome({ podcast, settings, onEpisodeClick }: PodcastSpaceHomeProps) {
  const [episodes, setEpisodes] = useState<StoredEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEpisodes();
  }, [podcast.id]);

  const loadEpisodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPodcastEpisodesFromDB(podcast.id, 100);
      setEpisodes(data);
    } catch (err) {
      console.error('Error loading episodes:', err);
      setError('Failed to load episodes');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = settings?.primary_color || '#10b981';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            {podcast.image_url ? (
              <img
                src={podcast.image_url}
                alt={podcast.name}
                className="w-32 h-32 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div
                className="w-32 h-32 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Radio className="w-16 h-16 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-gray-900">
                {settings?.custom_header_text || podcast.name}
              </h1>
              {podcast.publisher_name && (
                <p className="text-gray-600 text-lg mb-3">{podcast.publisher_name}</p>
              )}
              {podcast.description && (
                <p className="text-gray-700 leading-relaxed">{podcast.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Episodes</h2>
          <p className="text-gray-600 mt-1">
            {episodes.length} episodes with interactive transcripts and AI insights
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No episodes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => onEpisodeClick(episode)}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex gap-4">
                  {episode.image_url && (
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {episode.title}
                    </h3>
                    {episode.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {episode.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {episode.published_at && (
                        <span>{new Date(episode.published_at).toLocaleDateString()}</span>
                      )}
                      {episode.duration > 0 && (
                        <span>{Math.floor(episode.duration / 60)} min</span>
                      )}
                      {episode.word_count > 0 && (
                        <span>{episode.word_count.toLocaleString()} words</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
