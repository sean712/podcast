import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getPodcastBySlug, getPodcastSettings } from './services/podcastSpaceService';
import { useAuth } from './contexts/AuthContext';
import PodcastSpaceHome from './components/PodcastSpaceHome';
import PodcastSpaceEpisode from './components/PodcastSpaceEpisode';
import AdminPanel from './components/AdminPanel';
import App from './App';
import type { PodcastSpace, PodcastSettings, StoredEpisode } from './types/multiTenant';

export default function AppRouter() {
  const { user, loading: authLoading } = useAuth();
  const [routeType, setRouteType] = useState<'admin' | 'podcast-space' | 'main'>('main');
  const [podcast, setPodcast] = useState<PodcastSpace | null>(null);
  const [settings, setSettings] = useState<PodcastSettings | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<StoredEpisode | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    detectRoute();
  }, []);

  const detectRoute = async () => {
    setIsLoadingRoute(true);
    setNotFound(false);

    const path = window.location.pathname;

    if (path === '/admin' || path === '/admin/') {
      setRouteType('admin');
      setIsLoadingRoute(false);
      return;
    }

    const pathSegments = path.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      setRouteType('main');
      setIsLoadingRoute(false);
      return;
    }

    const slug = pathSegments[0];

    try {
      const podcastData = await getPodcastBySlug(slug);

      if (!podcastData) {
        setNotFound(true);
        setIsLoadingRoute(false);
        return;
      }

      setPodcast(podcastData);
      const settingsData = await getPodcastSettings(podcastData.id);
      setSettings(settingsData);
      setRouteType('podcast-space');
    } catch (err) {
      console.error('Error loading podcast space:', err);
      setNotFound(true);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleEpisodeClick = (episode: StoredEpisode) => {
    setSelectedEpisode(episode);
  };

  const handleBackToHome = () => {
    setSelectedEpisode(null);
  };

  if (authLoading || isLoadingRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600 mb-4">Podcast space not found</p>
          <a
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Go to home
          </a>
        </div>
      </div>
    );
  }

  if (routeType === 'admin') {
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600 mb-4">Please sign in to access the admin panel</p>
            <a
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to home
            </a>
          </div>
        </div>
      );
    }

    return <AdminPanel />;
  }

  if (routeType === 'podcast-space' && podcast) {
    if (selectedEpisode) {
      return (
        <PodcastSpaceEpisode
          episode={selectedEpisode}
          podcast={podcast}
          settings={settings}
          onBack={handleBackToHome}
        />
      );
    }

    return (
      <PodcastSpaceHome
        podcast={podcast}
        settings={settings}
        onEpisodeClick={handleEpisodeClick}
      />
    );
  }

  return <App />;
}
