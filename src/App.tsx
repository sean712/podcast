import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Radio, AlertCircle, LogOut, Search as SearchIcon, Bookmark, Compass, TrendingUp, MapPin, MessageCircle, BookOpen, Sparkles, Zap, Users, Clock, BarChart3, FileText, Users as UsersIcon, Map, StickyNote } from 'lucide-react';
import SearchBar from './components/SearchBar';
import PodcastCard from './components/PodcastCard';
import EpisodeList from './components/EpisodeList';
import TranscriptViewer from './components/TranscriptViewer';
import LocationMap from './components/LocationMap';
import EpisodeSummary from './components/EpisodeSummary';
import KeyPersonnel from './components/KeyPersonnel';
import Timeline from './components/Timeline';
import ChatWidget from './components/ChatWidget';
import AuthModal from './components/AuthModal';
import CreatorContactModal from './components/CreatorContactModal';
import SavedPodcastsList from './components/SavedPodcastsList';
import SavedEpisodesList from './components/SavedEpisodesList';
import EpisodeNotes from './components/EpisodeNotes';
import { searchPodcasts, getPodcastEpisodes, getEpisode, PodscanApiError } from './services/podscanApi';
import { analyzeTranscript, chatWithTranscript, OpenAIServiceError, type TranscriptAnalysis } from './services/openaiService';
import { geocodeLocations, type GeocodedLocation } from './services/geocodingService';
import { getCachedAnalysis, saveCachedAnalysis } from './services/episodeAnalysisCache';
import { saveEpisode, unsaveEpisode, isEpisodeSaved } from './services/savedEpisodesService';
import { stripHtml } from './utils/textUtils';
import { useAuth } from './contexts/AuthContext';
import type { Podcast, Episode } from './types/podcast';

type View = 'saved' | 'search' | 'episodes' | 'transcript';
type EpisodeTab = 'overview' | 'insights' | 'map' | 'transcript' | 'notes' | 'chat';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>('saved');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [savedPodcastsRefresh, setSavedPodcastsRefresh] = useState(0);
  const [isEpisodeBookmarked, setIsEpisodeBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);
  const [activeEpisodeTab, setActiveEpisodeTab] = useState<EpisodeTab>('overview');

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchPodcasts(query, { perPage: 20 });
      setPodcasts(response.podcasts || []);
    } catch (err) {
      if (err instanceof PodscanApiError) {
        setError(err.message);
      } else {
        setError('An error occurred while searching. Please try again.');
      }
      setPodcasts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPodcast = async (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setView('episodes');
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPodcastEpisodes(podcast.podcast_id, {
        perPage: 50,
        showOnlyFullyProcessed: true
      });
      setEpisodes(response.episodes || []);
    } catch (err) {
      if (err instanceof PodscanApiError) {
        setError(err.message);
      } else {
        setError('An error occurred while loading episodes. Please try again.');
      }
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEpisodeClick = async (episode: Episode) => {
    setView('transcript');
    setIsLoading(true);
    setError(null);
    setLocations([]);
    setLocationError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setIsEpisodeBookmarked(false);
    try {
      const response = await getEpisode(episode.episode_id, {
        showFullPodcast: true,
        wordLevelTimestamps: true
      });
      setSelectedEpisode(response.episode);

      if (user) {
        const bookmarked = await isEpisodeSaved(response.episode.episode_id);
        setIsEpisodeBookmarked(bookmarked);
      }
    } catch (err) {
      if (err instanceof PodscanApiError) {
        setError(err.message);
      } else {
        setError('An error occurred while loading the transcript. Please try again.');
      }
      setSelectedEpisode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEpisodeBookmark = async () => {
    if (!selectedEpisode || !user || isTogglingBookmark) return;

    setIsTogglingBookmark(true);
    try {
      if (isEpisodeBookmarked) {
        await unsaveEpisode(selectedEpisode.episode_id);
        setIsEpisodeBookmarked(false);
      } else {
        await saveEpisode(selectedEpisode);
        setIsEpisodeBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  useEffect(() => {
    async function analyzeAndProcessTranscript() {
      if (!selectedEpisode?.episode_transcript || view !== 'transcript') {
        return;
      }

      setIsLoadingAnalysis(true);
      setIsLoadingLocations(true);
      setAnalysisError(null);
      setLocationError(null);

      try {
        const cachedAnalysis = await getCachedAnalysis(selectedEpisode.episode_id);

        if (cachedAnalysis) {
          console.log('Using cached analysis for episode:', selectedEpisode.episode_id);
          setAnalysis({
            summary: cachedAnalysis.summary,
            keyPersonnel: cachedAnalysis.key_personnel,
            timeline: cachedAnalysis.timeline_events,
            locations: cachedAnalysis.locations.map((loc: any) => loc.name || loc),
          });
          setLocations(cachedAnalysis.locations);
          setIsLoadingLocations(false);
          setIsLoadingAnalysis(false);
          return;
        }

        console.log('No cache found, analyzing transcript for:', selectedEpisode.episode_id);
        const transcriptAnalysis = await analyzeTranscript(
          selectedEpisode.episode_transcript
        );

        setAnalysis(transcriptAnalysis);

        let geocoded: GeocodedLocation[] = [];
        if (transcriptAnalysis.locations.length > 0) {
          geocoded = await geocodeLocations(transcriptAnalysis.locations.slice(0, 10));
          setLocations(geocoded);
        }
        setIsLoadingLocations(false);

        await saveCachedAnalysis(
          selectedEpisode.episode_id,
          selectedEpisode.episode_title,
          selectedEpisode.podcast?.podcast_name || 'Unknown Podcast',
          transcriptAnalysis,
          geocoded
        );
        console.log('Analysis cached successfully');
      } catch (err) {
        if (err instanceof OpenAIServiceError) {
          setAnalysisError(err.message);
          setLocationError(err.message);
        } else {
          setAnalysisError('Failed to analyze transcript');
          setLocationError('Failed to extract locations');
        }
        setIsLoadingLocations(false);
      } finally {
        setIsLoadingAnalysis(false);
      }
    }

    analyzeAndProcessTranscript();
  }, [selectedEpisode, view]);

  const handleBack = () => {
    if (view === 'transcript') {
      setView('episodes');
      setSelectedEpisode(null);
      setLocations([]);
      setLocationError(null);
      setAnalysis(null);
      setAnalysisError(null);
    } else if (view === 'episodes') {
      setView('saved');
      setSelectedPodcast(null);
      setEpisodes([]);
    } else if (view === 'search') {
      setView('saved');
      setPodcasts([]);
    }
  };

  const handlePodcastSaved = () => {
    setSavedPodcastsRefresh(prev => prev + 1);
  };

  const handleChatMessage = async (message: string): Promise<string> => {
    if (!selectedEpisode?.episode_transcript) {
      throw new Error('No transcript available');
    }

    return await chatWithTranscript(
      selectedEpisode.episode_transcript,
      selectedEpisode.episode_title,
      message
    );
  };

  const handleTextSelected = (text: string) => {
    setHighlightedTextForNote(text);
  };

  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-20" />

          <div className="relative">
            <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-8 h-8 text-blue-500" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Augmented Pods</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <a
                      href="#for-creators"
                      className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block"
                    >
                      For Creators
                    </a>
                    <a
                      href="#for-fans"
                      className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block"
                    >
                      For Fans
                    </a>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-slate-300 hover:text-white font-medium transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <main>
              <section id="for-creators" className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                <div className="max-w-7xl mx-auto relative">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                      <Sparkles className="w-4 h-4" />
                      For Podcast Creators
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                      Your Podcast.
                      <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                        Brought to Life.
                      </span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                      Give your audience an immersive experience with interactive transcripts, AI-powered insights, and a dedicated branded space. Fully automated, white-glove service included.
                    </p>
                    <button
                      onClick={() => setShowCreatorModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                    >
                      Get Your Podcast Space
                    </button>
                    <p className="text-sm text-slate-400 mt-4">
                      Premium setup • Full automation • Live in 48 hours
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/10 hover:border-blue-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Deeper Fan Engagement
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Interactive maps, timelines, and AI chat keep listeners engaged long after the episode ends.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-sky-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Fully Automated
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        New episodes sync automatically. Zero maintenance required from your team.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/10 hover:border-sky-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-sky-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Entire Back Catalog
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Every episode searchable, browsable, and enriched with AI insights and interactive features.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/10 hover:border-blue-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Bespoke Episode Pages
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Each episode gets a premium landing page with custom branding and rich media features.
                      </p>
                    </div>
                  </div>

                  <div className="mt-16 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-3">
                          White-Glove Onboarding
                        </h3>
                        <p className="text-slate-300 leading-relaxed mb-4">
                          We handle everything. From initial setup to ongoing episode syncing, quality control, and custom branding. Your dedicated space goes live in 48 hours.
                        </p>
                        <ul className="space-y-2 text-slate-300 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            Premium setup and configuration
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            Automatic daily episode syncing
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                            Custom branding and colors
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            Ongoing quality assurance
                          </li>
                        </ul>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setShowCreatorModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
                        >
                          Get Started
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

              <section id="for-fans" className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                      <Compass className="w-4 h-4" />
                      For Podcast Fans
                    </div>
                    <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                      Experience Podcasts
                      <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        Like Never Before
                      </span>
                    </h2>
                    <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                      Explore your favorite shows with interactive maps, timelines, and transcripts.
                      Save episodes, discover hidden details, and get more from every listen.
                    </p>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                    >
                      Start Exploring Free
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Visualize The Journey
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        See where stories take place with interactive maps and follow episode timelines to navigate through topics and key moments.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Find What Matters
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        Search millions of episodes and jump straight to the topics and moments you care about. Never miss an important detail again.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-teal-500/10 hover:border-teal-500/30 transition-all group">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Bookmark className="w-6 h-6 text-teal-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Build Your Library
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        Save your favorite podcasts and episodes in one place. Revisit memorable moments and build your personal collection.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                      Rich Features For Every Episode
                    </h2>
                    <p className="text-lg text-slate-300">
                      Powerful tools that bring podcast episodes to life
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-semibold text-white">Interactive Location Maps</h4>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Discover where stories unfold with interactive maps showing every location mentioned in the episode.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-semibold text-white">Episode Timelines</h4>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Jump to the topics that interest you most with episode timelines showing key moments and discussions.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/10 hover:border-teal-500/30 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="w-5 h-5 text-teal-400" />
                        <h4 className="font-semibold text-white">AI-Powered Chat</h4>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Curious about something mentioned? Chat with episodes to explore topics deeper and learn more.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-semibold text-white">Searchable Transcripts</h4>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Search full transcripts to find memorable quotes, specific moments, or topics you want to revisit.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    Ready to Explore Your Favorite Podcasts?
                  </h2>
                  <p className="text-xl text-slate-300 mb-8">
                    Join thousands of podcast fans getting more from every episode with Augmented Pods.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                  >
                    Start Exploring Free
                  </button>
                </div>
              </section>
            </main>

            <footer className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-6 h-6 text-blue-500" />
                    <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Augmented Pods</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    © 2025 Augmented Pods. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <CreatorContactModal isOpen={showCreatorModal} onClose={() => setShowCreatorModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== 'saved' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <button
                onClick={() => setView('saved')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Radio className="w-8 h-8 text-emerald-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Augmented Pods</h1>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('search')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20"
              >
                <SearchIcon className="w-4 h-4" />
                Search Podcasts
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'saved' && (
          <div className="space-y-8">
            <SavedPodcastsList
              onSelectPodcast={handleSelectPodcast}
              onRefresh={savedPodcastsRefresh}
            />
            <SavedEpisodesList
              onSelectEpisode={handleEpisodeClick}
            />
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Discover Podcast Transcripts
                </h2>
                <p className="text-gray-600">
                  Search thousands of podcasts and read their transcripts
                </p>
              </div>
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {!isLoading && podcasts.length > 0 && (
              <div className="space-y-3">
                {podcasts.map((podcast) => (
                  <PodcastCard
                    key={podcast.podcast_id}
                    podcast={podcast}
                    onClick={() => handleSelectPodcast(podcast)}
                    onSaveChange={handlePodcastSaved}
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && podcasts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Search for a podcast to get started
              </div>
            )}
          </div>
        )}

        {view === 'episodes' && selectedPodcast && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex gap-6">
                <img
                  src={selectedPodcast.podcast_image_url}
                  alt={selectedPodcast.podcast_name}
                  className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPodcast.podcast_name}
                  </h2>
                  <p className="text-gray-600 mb-3">
                    {selectedPodcast.publisher_name}
                  </p>
                  <p className="text-gray-700 leading-relaxed break-words">
                    {stripHtml(selectedPodcast.podcast_description)}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Episodes with Transcripts</h3>
              <EpisodeList
                episodes={episodes}
                onEpisodeClick={handleEpisodeClick}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {view === 'transcript' && selectedEpisode && (
          <div className="space-y-0">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
              <div className="flex gap-6">
                {selectedEpisode.episode_image_url && (
                  <img
                    src={selectedEpisode.episode_image_url}
                    alt={selectedEpisode.episode_title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 flex-1">
                      {selectedEpisode.episode_title}
                    </h2>
                    {user && (
                      <button
                        onClick={handleToggleEpisodeBookmark}
                        disabled={isTogglingBookmark}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        aria-label={isEpisodeBookmarked ? 'Unsave episode' : 'Save episode'}
                      >
                        <Bookmark
                          className={`w-6 h-6 ${
                            isEpisodeBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  {selectedEpisode.podcast && (
                    <p className="text-gray-600 mb-3">
                      {selectedEpisode.podcast.podcast_name}
                    </p>
                  )}
                  <p className="text-gray-700 leading-relaxed line-clamp-3 break-words overflow-hidden">
                    {stripHtml(selectedEpisode.episode_description)}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Tabbed Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <nav className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
                <button
                  onClick={() => setActiveEpisodeTab('overview')}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                    activeEpisodeTab === 'overview'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveEpisodeTab('insights')}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                    activeEpisodeTab === 'insights'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  People & Timeline
                </button>
                {locations.length > 0 && (
                  <button
                    onClick={() => setActiveEpisodeTab('map')}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                      activeEpisodeTab === 'map'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    Locations ({locations.length})
                  </button>
                )}
                {selectedEpisode.episode_transcript && (
                  <>
                    <button
                      onClick={() => setActiveEpisodeTab('transcript')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                        activeEpisodeTab === 'transcript'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Transcript
                    </button>
                    <button
                      onClick={() => setActiveEpisodeTab('notes')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                        activeEpisodeTab === 'notes'
                          ? 'border-yellow-500 text-yellow-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <StickyNote className="w-4 h-4" />
                      Notes
                    </button>
                    <button
                      onClick={() => setActiveEpisodeTab('chat')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                        activeEpisodeTab === 'chat'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      AI Chat
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            {isLoading ? (
              <div className="bg-white rounded-xl p-12 flex justify-center mt-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="mt-6">
                {/* Overview Tab */}
                {activeEpisodeTab === 'overview' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoadingAnalysis ? (
                      <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-gray-600">Analyzing transcript with AI...</p>
                      </div>
                    ) : (
                      <>
                        {analysisError && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-800 font-medium">Analysis Error</p>
                              <p className="text-red-700 text-sm">{analysisError}</p>
                            </div>
                          </div>
                        )}
                        {analysis && <EpisodeSummary summary={analysis.summary} />}
                      </>
                    )}
                  </div>
                )}

                {/* Insights Tab */}
                {activeEpisodeTab === 'insights' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {analysis ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <KeyPersonnel personnel={analysis.keyPersonnel} />
                        <Timeline events={analysis.timeline} />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                        <p className="text-gray-600">No insights available yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Map Tab */}
                {activeEpisodeTab === 'map' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LocationMap
                      locations={locations}
                      isLoading={isLoadingLocations}
                      error={locationError}
                    />
                  </div>
                )}

                {/* Transcript Tab */}
                {activeEpisodeTab === 'transcript' && selectedEpisode.episode_transcript && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TranscriptViewer
                      transcript={selectedEpisode.episode_transcript || ''}
                      episodeTitle={selectedEpisode.episode_title}
                      onTextSelected={handleTextSelected}
                    />
                  </div>
                )}

                {/* Notes Tab */}
                {activeEpisodeTab === 'notes' && selectedEpisode.episode_transcript && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <EpisodeNotes
                      episodeId={selectedEpisode.episode_id}
                      episodeTitle={selectedEpisode.episode_title}
                      podcastName={selectedEpisode.podcast?.podcast_name || 'Unknown Podcast'}
                      highlightedText={highlightedTextForNote}
                      onHighlightUsed={handleHighlightUsed}
                    />
                  </div>
                )}

                {/* Chat Tab */}
                {activeEpisodeTab === 'chat' && selectedEpisode.episode_transcript && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base">AI Assistant</h3>
                            <p className="text-xs text-green-100">Ask me anything about this episode</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[600px]">
                        <ChatWidget
                          transcript={selectedEpisode.episode_transcript}
                          episodeTitle={selectedEpisode.episode_title}
                          onSendMessage={handleChatMessage}
                          embedded={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
