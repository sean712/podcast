import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getPodcastBySlug, getPodcastSettings, getEpisodeBySlug, getPodcastEpisodesFromDB } from './services/podcastSpaceService';
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
  const [episodes, setEpisodes] = useState<StoredEpisode[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [isLoadingEpisode, setIsLoadingEpisode] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    detectRoute();

    const handlePopState = () => {
      detectRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const detectRoute = async () => {
    setIsLoadingRoute(true);
    setNotFound(false);

    try {
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

      const podcastSlug = pathSegments[0];
      const episodeSlug = pathSegments[1];

      try {
        const podcastData = await getPodcastBySlug(podcastSlug);

        if (!podcastData) {
          setNotFound(true);
          setIsLoadingRoute(false);
          return;
        }

        setPodcast(podcastData);
        const settingsData = await getPodcastSettings(podcastData.id);
        setSettings(settingsData);
        const episodesData = await getPodcastEpisodesFromDB(podcastData.id, 100);
        setEpisodes(episodesData);
        setRouteType('podcast-space');

        if (episodeSlug) {
          setIsLoadingRoute(false);
          setIsLoadingEpisode(true);
          try {
            const episodeData = await getEpisodeBySlug(podcastData.id, episodeSlug);
            if (episodeData) {
              setSelectedEpisode(episodeData);
            } else {
              setNotFound(true);
            }
          } catch (err) {
            console.error('Error loading episode:', err);
            setNotFound(true);
          } finally {
            setIsLoadingEpisode(false);
          }
        }
      } catch (err) {
        console.error('Error loading podcast space:', err);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Critical error in detectRoute:', err);
      setRouteType('main');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleEpisodeClick = async (episode: StoredEpisode) => {
    if (!podcast) return;

    setIsLoadingEpisode(true);
    try {
      const fullEpisode = await getEpisodeBySlug(podcast.id, episode.slug);
      if (fullEpisode) {
        setSelectedEpisode(fullEpisode);
        const newUrl = `/${podcast.slug}/${episode.slug}`;
        window.history.pushState({}, '', newUrl);
      }
    } catch (err) {
      console.error('Error loading full episode:', err);
      setSelectedEpisode(episode);
      const newUrl = `/${podcast.slug}/${episode.slug}`;
      window.history.pushState({}, '', newUrl);
    } finally {
      setIsLoadingEpisode(false);
    }
  };

  const handleBackToHome = () => {
    if (!podcast) return;
    setSelectedEpisode(null);
    const newUrl = `/${podcast.slug}`;
    window.history.pushState({}, '', newUrl);
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
    if (isLoadingEpisode) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      );
    }

    if (selectedEpisode) {
      return (
        <PodcastSpaceEpisode
          episode={selectedEpisode}
          podcast={podcast}
          settings={settings}
          episodes={episodes}
          onBack={handleBackToHome}
          onEpisodeClick={handleEpisodeClick}
        />
      );
    }

    return (
      <PodcastSpaceHome
        podcast={podcast}
        settings={settings}
        episodes={episodes}
        onEpisodeClick={handleEpisodeClick}
      />
    );
  }

  return <App />;
}
