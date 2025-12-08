import { useState, useEffect } from 'react';
import { Star, Loader2, Play, Radio, Home } from 'lucide-react';
import { featuredEpisodesService, type FeaturedEpisode } from '../services/featuredEpisodesService';

export default function FeaturedEpisodesPage() {
  const [episodes, setEpisodes] = useState<FeaturedEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedEpisodes();
  }, []);

  const loadFeaturedEpisodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await featuredEpisodesService.getFeaturedEpisodes();
      setEpisodes(data);
    } catch (err) {
      console.error('Error loading featured episodes:', err);
      setError('Failed to load featured episodes');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={loadFeaturedEpisodes}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group">
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </a>
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6 text-cyan-500" />
              <span className="text-lg font-bold text-white">Augmented Pods</span>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Featured Episodes
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Discover our hand-picked selection of exceptional podcast episodes
          </p>
        </div>

        {episodes.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-400">No featured episodes yet</p>
            <p className="text-slate-500 mt-2">Check back soon for curated content</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((episode) => (
              <a
                key={episode.episode_id}
                href={`/${episode.podcast_slug}/${episode.episode_slug}`}
                className="group"
              >
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 h-full flex flex-col">
                  <div className="relative">
                    {episode.artwork_url ? (
                      <div className="aspect-square w-full overflow-hidden bg-slate-900">
                        <img
                          src={episode.artwork_url}
                          alt={episode.podcast_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <Play className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                        <Star className="w-4 h-4 fill-white" />
                        Featured
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {episode.episode_title}
                      </h3>
                      <p className="text-sm text-emerald-400 font-medium mb-1">
                        {episode.podcast_title}
                      </p>
                      {episode.creator_name && (
                        <p className="text-xs text-slate-400">
                          by {episode.creator_name}
                        </p>
                      )}
                    </div>

                    {episode.description && (
                      <p className="text-sm text-slate-400 line-clamp-3 mb-3 flex-1">
                        {episode.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <span className="text-xs text-slate-500">
                        {formatDate(episode.published_date)}
                      </span>
                      <div className="flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                        <Play className="w-4 h-4" />
                        <span className="text-sm font-medium">Listen</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
