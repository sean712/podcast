import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Newspaper, History, Trophy, Tv, ChevronRight } from 'lucide-react';
import { getCharts } from '../services/podscanApi';
import type { ChartShow, Podcast } from '../types/podcast';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'news',
    name: 'News',
    icon: Newspaper,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'history',
    name: 'History',
    icon: History,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600'
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Trophy,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'tv-film',
    name: 'Entertainment',
    icon: Tv,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
];

interface FeaturedPodcastsProps {
  onSelectPodcast: (podcastId: string) => void;
}

export default function FeaturedPodcasts({ onSelectPodcast }: FeaturedPodcastsProps) {
  const [categoryShows, setCategoryShows] = useState<Record<string, ChartShow[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const showsMap: Record<string, ChartShow[]> = {};

        for (const category of CATEGORIES) {
          try {
            const response = await getCharts('apple', 'us', category.id);
            showsMap[category.id] = response.data.shows.slice(0, 5);
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (err) {
            console.error(`Failed to fetch ${category.name} charts:`, err);
            showsMap[category.id] = [];
          }
        }

        setCategoryShows(showsMap);
      } catch (err) {
        setError('Failed to load featured podcasts');
        console.error('Error fetching charts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return null;
  }

  const hasAnyShows = Object.values(categoryShows).some(shows => shows.length > 0);
  if (!hasAnyShows) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          Trending Now
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Featured Podcasts
        </h2>
        <p className="text-gray-600">
          Explore top-rated shows across different categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((category) => {
          const shows = categoryShows[category.id] || [];
          if (shows.length === 0) return null;

          const Icon = category.icon;

          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className={`bg-gradient-to-r ${category.gradient} p-4`}>
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">{category.name}</h3>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {shows.map((show, index) => (
                  <button
                    key={show.podcast_id}
                    onClick={() => onSelectPodcast(show.podcast_id)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                          {show.name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">{show.publisher}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
