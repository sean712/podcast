import { TrendingUp, Newspaper, History, Trophy, Tv, ChevronRight } from 'lucide-react';
import type { ChartShow } from '../types/podcast';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  shows: ChartShow[];
}

const FEATURED_CATEGORIES: Category[] = [
  {
    id: 'news',
    name: 'News',
    icon: Newspaper,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    shows: [
      { rank: 1, name: 'The Daily', publisher: 'The New York Times', movement: 'up', podcast_id: '1200361736' },
      { rank: 2, name: 'Up First', publisher: 'NPR', movement: 'same', podcast_id: '1222114325' },
      { rank: 3, name: 'Post Reports', publisher: 'The Washington Post', movement: 'up', podcast_id: '1444873564' },
      { rank: 4, name: 'The Journal', publisher: 'The Wall Street Journal', movement: 'down', podcast_id: '1469394914' },
      { rank: 5, name: 'Start Here', publisher: 'ABC News', movement: 'same', podcast_id: '1297181557' },
    ]
  },
  {
    id: 'history',
    name: 'History',
    icon: History,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
    shows: [
      { rank: 1, name: 'Hardcore History', publisher: 'Dan Carlin', movement: 'up', podcast_id: '173001861' },
      { rank: 2, name: 'Stuff You Missed in History Class', publisher: 'iHeartPodcasts', movement: 'same', podcast_id: '283605519' },
      { rank: 3, name: 'Ridiculous History', publisher: 'iHeartPodcasts', movement: 'up', podcast_id: '1299826850' },
      { rank: 4, name: 'The Rest Is History', publisher: 'Goalhanger Podcasts', movement: 'down', podcast_id: '1537788786' },
      { rank: 5, name: 'History Daily', publisher: 'Airwave Media', movement: 'same', podcast_id: '1574003453' },
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Trophy,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
    shows: [
      { rank: 1, name: 'Pardon My Take', publisher: 'Barstool Sports', movement: 'up', podcast_id: '1089022756' },
      { rank: 2, name: 'The Bill Simmons Podcast', publisher: 'The Ringer', movement: 'same', podcast_id: '1043699613' },
      { rank: 3, name: 'The Pat McAfee Show', publisher: 'Pat McAfee', movement: 'up', podcast_id: '1119031736' },
      { rank: 4, name: 'Fantasy Footballers', publisher: 'Fantasy Footballers', movement: 'down', podcast_id: '1015863878' },
      { rank: 5, name: 'New Heights', publisher: 'Wave Sports + Entertainment', movement: 'same', podcast_id: '1650066842' },
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Tv,
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-rose-600',
    shows: [
      { rank: 1, name: 'SmartLess', publisher: 'Jason Bateman, Sean Hayes, Will Arnett', movement: 'up', podcast_id: '1521578868' },
      { rank: 2, name: 'Conan O\'Brien Needs A Friend', publisher: 'Team Coco & Earwolf', movement: 'same', podcast_id: '1438054347' },
      { rank: 3, name: 'WTF with Marc Maron', publisher: 'Marc Maron', movement: 'up', podcast_id: '329875043' },
      { rank: 4, name: 'Office Ladies', publisher: 'Earwolf & Jenna Fischer and Angela Kinsey', movement: 'down', podcast_id: '1480311435' },
      { rank: 5, name: 'Armchair Expert', publisher: 'Armchair Umbrella', movement: 'same', podcast_id: '1345682353' },
    ]
  },
];

interface FeaturedPodcastsProps {
  onSelectPodcast: (podcastId: string) => void;
}

export default function FeaturedPodcasts({ onSelectPodcast }: FeaturedPodcastsProps) {

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
        {FEATURED_CATEGORIES.map((category) => {
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
                {category.shows.map((show, index) => (
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
