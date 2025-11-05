import { useState } from 'react';
import { Loader2, AlertCircle, Radio, Clock, Calendar } from 'lucide-react';
import type { PodcastSpace, PodcastSettings, StoredEpisode } from '../types/multiTenant';

interface PodcastSpaceHomeProps {
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  episodes: StoredEpisode[];
  onEpisodeClick: (episode: StoredEpisode) => void;
}

export default function PodcastSpaceHome({ podcast, settings, episodes, onEpisodeClick }: PodcastSpaceHomeProps) {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No episodes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => onEpisodeClick(episode)}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all text-left group"
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {episode.image_url ? (
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Radio className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {episode.word_count > 0 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                      Transcript Available
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {episode.title}
                  </h3>
                  {episode.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {episode.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {episode.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(episode.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    {episode.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{Math.floor(episode.duration / 60)} min</span>
                      </div>
                    )}
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
