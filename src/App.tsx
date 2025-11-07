import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Radio, AlertCircle, LogOut, Search as SearchIcon, Bookmark, Compass, TrendingUp, MapPin, MessageCircle, BookOpen, Sparkles, Zap, Users, Clock, BarChart3, FileText, Users as UsersIcon, Map, StickyNote, ChevronDown } from 'lucide-react';
import LandingPage from './components/LandingPage';
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
  const [showTabMenu, setShowTabMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTabMenu && !target.closest('.tab-menu-container')) {
        setShowTabMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTabMenu]);

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
    // Switch to notes tab so user can see and save the note
    setActiveEpisodeTab('notes');
  };

  const handleAskAI = (text: string) => {
    // Switch to chat tab and populate the input with the quoted text
    setActiveEpisodeTab('chat');
    // Set the highlighted text with quotes for the AI chat
    setHighlightedTextForNote(`"${text}"`);
    // Clear it after a brief moment so it doesn't persist
    setTimeout(() => {
      setHighlightedTextForNote(undefined);
    }, 100);
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
      <>
        <LandingPage
          onGetStarted={() => setShowCreatorModal(true)}
          onSignIn={() => setShowAuthModal(true)}
        />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <CreatorContactModal isOpen={showCreatorModal} onClose={() => setShowCreatorModal(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-2">
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
                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
              >
                <Radio className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">Augmented Pods</h1>
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setView('search')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20"
              >
                <SearchIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Search Podcasts</span>
                <span className="sm:hidden">Search</span>
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
          <div className="space-y-0 w-full max-w-full overflow-x-hidden">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
              <div className="flex gap-4 sm:gap-6">
                {selectedEpisode.episode_image_url && (
                  <img
                    src={selectedEpisode.episode_image_url}
                    alt={selectedEpisode.episode_title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex-1 break-words">
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
              {/* Desktop Tabs */}
              <nav className="hidden sm:hidden md:flex gap-2 px-4">
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
                      Chat
                    </button>
                  </>
                )}
              </nav>

              {/* Mobile Dropdown Menu */}
              <div className="block sm:block md:hidden relative px-4 py-3 tab-menu-container">
                <button
                  onClick={() => setShowTabMenu(!showTabMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-semibold text-sm text-gray-700">
                    {activeEpisodeTab === 'overview' && <><FileText className="w-4 h-4" /> Overview</>}
                    {activeEpisodeTab === 'insights' && <><UsersIcon className="w-4 h-4" /> People & Timeline</>}
                    {activeEpisodeTab === 'map' && <><Map className="w-4 h-4" /> Locations</>}
                    {activeEpisodeTab === 'transcript' && <><BookOpen className="w-4 h-4" /> Transcript</>}
                    {activeEpisodeTab === 'notes' && <><StickyNote className="w-4 h-4" /> Notes</>}
                    {activeEpisodeTab === 'chat' && <><MessageCircle className="w-4 h-4" /> Chat</>}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTabMenu ? 'rotate-180' : ''}`} />
                </button>

                {showTabMenu && (
                  <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden max-w-full">
                    <button
                      onClick={() => {
                        setActiveEpisodeTab('overview');
                        setShowTabMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        activeEpisodeTab === 'overview'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Overview
                    </button>
                    <button
                      onClick={() => {
                        setActiveEpisodeTab('insights');
                        setShowTabMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        activeEpisodeTab === 'insights'
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UsersIcon className="w-4 h-4" />
                      People & Timeline
                    </button>
                    {locations.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveEpisodeTab('map');
                          setShowTabMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          activeEpisodeTab === 'map'
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Map className="w-4 h-4" />
                        Locations ({locations.length})
                      </button>
                    )}
                    {selectedEpisode.episode_transcript && (
                      <>
                        <button
                          onClick={() => {
                            setActiveEpisodeTab('transcript');
                            setShowTabMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            activeEpisodeTab === 'transcript'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Transcript
                        </button>
                        <button
                          onClick={() => {
                            setActiveEpisodeTab('notes');
                            setShowTabMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            activeEpisodeTab === 'notes'
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <StickyNote className="w-4 h-4" />
                          Notes
                        </button>
                        <button
                          onClick={() => {
                            setActiveEpisodeTab('chat');
                            setShowTabMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            activeEpisodeTab === 'chat'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
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
                      onAskAI={handleAskAI}
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
                          initialInput={activeEpisodeTab === 'chat' ? highlightedTextForNote : undefined}
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
