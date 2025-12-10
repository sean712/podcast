import { useState, useEffect } from 'react';
import { ExternalLink, Clock, Loader2 } from 'lucide-react';
import { getFeaturedEpisodes } from '../services/podcastSpaceService';
import CreatorCallToAction from './CreatorCallToAction';
import PodcastFooter from './PodcastFooter';
import { decodeHtmlEntities } from '../utils/textUtils';
import type { PodcastSpace, StoredEpisode } from '../types/multiTenant';

interface ProtectedPodcastPageProps {
  podcast: PodcastSpace;
  onEpisodeClick: (episode: StoredEpisode, isFeatured: boolean) => void;
}

export default function ProtectedPodcastPage({ podcast, onEpisodeClick }: ProtectedPodcastPageProps) {
  const [featuredEpisodes, setFeaturedEpisodes] = useState<StoredEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedEpisodes();
  }, [podcast.id]);

  const loadFeaturedEpisodes = async () => {
    setIsLoading(true);
    try {
      const episodes = await getFeaturedEpisodes(podcast.id);
      setFeaturedEpisodes(episodes);
    } catch (error) {
      console.error('Error loading featured episodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      <header className="bg-slate-900 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {podcast.image_url && (
              <img
                src={podcast.image_url}
                alt={podcast.name}
                className="w-32 h-32 rounded-2xl object-cover shadow-xl ring-4 ring-cyan-400/30"
              />
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {podcast.name}
              </h1>
              {podcast.publisher_name && (
                <p className="text-slate-300 mb-3">{podcast.publisher_name}</p>
              )}
              {podcast.podcast_url && (
                <a
                  href={podcast.podcast_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Visit podcast website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-slate-300">Loading featured episodes...</p>
          </div>
        ) : featuredEpisodes.length > 0 ? (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Featured Episodes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => onEpisodeClick(episode, true)}
                  className="bg-slate-900/60 border border-slate-700 hover:border-cyan-400/60 rounded-xl p-4 transition-all text-left hover:transform hover:scale-105"
                >
                  {episode.image_url && (
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="w-full aspect-square rounded-lg object-cover mb-4"
                    />
                  )}
                  <h4 className="text-white font-semibold mb-2 line-clamp-2">
                    {decodeHtmlEntities(episode.title)}
                  </h4>
                  {episode.description && (
                    <div
                      className="text-slate-400 text-sm mb-3 line-clamp-2 prose prose-sm prose-invert prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline max-w-none"
                      dangerouslySetInnerHTML={{ __html: episode.description }}
                    />
                  )}
                  {episode.duration > 0 && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{Math.floor(episode.duration / 60)} min</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-8">
              No featured episodes available yet. Check back soon!
            </p>
          </div>
        )}

        <div className="mt-12">
          <CreatorCallToAction />
        </div>
      </main>

      <PodcastFooter />
    </div>
  );
}
