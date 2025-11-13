import { useState, useEffect, ReactNode } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Play, Pause, Clock, Calendar, Hash, Share2, Sparkles, FileText, Users as UsersIcon, Map, BookOpen, StickyNote, List, Tag } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
import KeyMoments from './KeyMoments';
import KeyPersonnel from './KeyPersonnel';
import Timeline from './Timeline';
import TranscriptViewer from './TranscriptViewer';
import EpisodeNotes from './EpisodeNotes';
import References from './References';
import AudioPlayer from './AudioPlayer';
import PodcastFooter from './PodcastFooter';
import { getCachedAnalysis, saveCachedAnalysis } from '../services/episodeAnalysisCache';
import { analyzeTranscript, OpenAIServiceError, type TranscriptAnalysis } from '../services/openaiService';
import { geocodeLocations, type GeocodedLocation } from '../services/geocodingService';
import { stripHtml, decodeHtmlEntities } from '../utils/textUtils';
import type { StoredEpisode, PodcastSpace, PodcastSettings } from '../types/multiTenant';

interface PodcastSpaceEpisodeProps {
  episode: StoredEpisode;
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  episodes: StoredEpisode[];
  onBack: () => void;
  onEpisodeClick: (episode: StoredEpisode) => void;
}

type TabType = 'overview' | 'moments' | 'people' | 'timeline' | 'map' | 'references' | 'transcript' | 'notes';

// Helper to get the title for the sidebar based on the active tab
const getSidebarTitle = (tab: TabType): string => {
  switch (tab) {
    case 'map': return 'Locations';
    case 'overview': return 'Overview';
    case 'moments': return 'Key Moments';
    case 'people': return 'People';
    case 'timeline': return 'Timeline';
    case 'references': return 'References';
    case 'transcript': return 'Transcript';
    case 'notes': return 'Notes';
    default: return 'Information';
  }
};

// Helper to determine if a tab should show content in the sidebar
const isInfoTabActive = (tab: TabType): boolean => {
  return tab !== 'map'; // Map is always in the background, other tabs go in the sidebar
};

// Reusable component for the info sidebar
const InfoSidebar: React.FC<{ children: ReactNode, title: string, onClose: () => void, visibleOnMobile: boolean }> = ({ children, title, onClose, visibleOnMobile }) => {
  return (
    // Mobile view: sidebar takes full screen, slides up or in
    <div className={`fixed inset-0 z-50 md:hidden ${visibleOnMobile ? 'translate-y-0' : 'translate-y-full'} transition-transform duration-300 ease-in-out bg-gradient-to-b from-slate-900/95 to-slate-900 backdrop-blur`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/70">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {getIconForTab(title)} {/* You'll need to implement getIconForTab */}
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close sidebar">
            <ArrowLeft className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {children}
        </div>
      </div>
    </div>
    // Desktop view: sidebar is fixed on the right
    // This will be positioned absolutely within the main container
    // CSS will handle the exact positioning and sizing (e.g., w-96)
  );
};

// Placeholder for icons, you can map these from TabType if you prefer
const getIconForTab = (title: string) => {
  switch (title) {
    case 'Locations': return <Map className="w-4 h-4 text-cyan-400" />;
    case 'Overview': return <FileText className="w-4 h-4 text-cyan-400" />;
    case 'Key Moments': return <Sparkles className="w-4 h-4 text-cyan-400" />;
    case 'People': return <UsersIcon className="w-4 h-4 text-cyan-400" />;
    case 'Timeline': return <Clock className="w-4 h-4 text-cyan-400" />;
    case 'References': return <Tag className="w-4 h-4 text-cyan-400" />;
    case 'Transcript': return <BookOpen className="w-4 h-4 text-cyan-400" />;
    case 'Notes': return <StickyNote className="w-4 h-4 text-cyan-400" />;
    default: return null;
  }
};


export default function PodcastSpaceEpisode({ episode, podcast, settings, episodes, onBack, onEpisodeClick }: PodcastSpaceEpisodeProps) {
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // State to control sidebar visibility

  useEffect(() => {
    if (episode.transcript) {
      analyzeAndProcessTranscript();
    }
  }, [episode.episode_id]);

  useEffect(() => {
    document.title = `${episode.title} - ${podcast.name} | Augmented Pods`;
    return () => {
      document.title = 'Augmented Pods';
    };
  }, [episode.title, podcast.name]);

  const analyzeAndProcessTranscript = async () => {
    if (!episode.transcript) return;

    setIsLoadingAnalysis(true);
    setIsLoadingLocations(true);
    setAnalysisError(null);
    setLocationError(null);

    try {
      const cachedAnalysis = await getCachedAnalysis(episode.episode_id);

      if (cachedAnalysis) {
        const validLocations = cachedAnalysis.locations.filter((loc: any) =>
          loc && typeof loc === 'object' && loc.lat !== undefined && loc.lon !== undefined
        );

        console.log('📍 Retrieved cached locations:', {
          total: cachedAnalysis.locations.length,
          valid: validLocations.length,
          sample: validLocations[0]
        });

        setAnalysis({
          summary: cachedAnalysis.summary,
          keyPersonnel: cachedAnalysis.key_personnel,
          timeline: cachedAnalysis.timeline_events,
          locations: validLocations.map((loc: any) => ({ name: loc.name, context: loc.context })),
          keyMoments: cachedAnalysis.key_moments || [],
          references: cachedAnalysis.references || [],
        });
        setLocations(validLocations);
        setIsLoadingLocations(false);
        setIsLoadingAnalysis(false);
        return;
      }

      const transcriptAnalysis = await analyzeTranscript(episode.transcript, episode.episode_id);
      setAnalysis(transcriptAnalysis);

      let geocoded: GeocodedLocation[] = [];
      if (transcriptAnalysis.locations.length > 0) {
        console.log('🌍 Starting geocoding:', {
          extractedLocations: transcriptAnalysis.locations.length,
          processing: Math.min(transcriptAnalysis.locations.length, 25)
        });

        geocoded = await geocodeLocations(transcriptAnalysis.locations.slice(0, 25));

        console.log('✅ Geocoding complete:', {
          attempted: Math.min(transcriptAnalysis.locations.length, 25),
          successful: geocoded.length,
          failed: Math.min(transcriptAnalysis.locations.length, 25) - geocoded.length,
          sample: geocoded[0]
        });

        setLocations(geocoded);
      }
      setIsLoadingLocations(false);

      await saveCachedAnalysis(
        episode.episode_id,
        episode.title,
        podcast.name,
        transcriptAnalysis,
        geocoded
      );
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
  };


  const handleTextSelected = (text: string) => {
    setHighlightedTextForNote(text);
    setActiveTab('notes');
    setIsSidebarVisible(true); // Ensure sidebar is visible for notes
  };


  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

  const isTabVisible = (tabName: string): boolean => {
    const visibleTabs = settings?.visible_tabs;
    if (!visibleTabs || visibleTabs.length === 0) {
      return true;
    }
    return visibleTabs.includes(tabName);
  };

  const primaryColor = settings?.primary_color || '#10b981';
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const shareUrl = `${window.location.origin}/${podcast.slug}/${episode.slug}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Function to handle tab clicks, opening sidebar on desktop/mobile
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'map') { // Only show sidebar for info tabs
      setIsSidebarVisible(true);
    } else {
      setIsSidebarVisible(false); // Hide sidebar if map is selected
    }
  };

  // Content for the sidebar based on activeTab
  const renderSidebarContent = () => {
    if (!analysis && isLoadingAnalysis) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 bg-cyan-400/20 rounded-full animate-ping" />
            </div>
            <p className="text-slate-700 text-lg font-medium">Loading Data...</p>
            <p className="text-slate-500 text-sm">Analysing transcript and extracting information.</p>
          </div>
        </div>
      );
    }

    if (analysisError && !isLoadingAnalysis) {
      return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold mb-1">Analysis Error</p>
            <p className="text-red-200">{analysisError}</p>
          </div>
        </div>
      );
    }

    if (!analysis && !isLoadingAnalysis) {
      return (
        <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-600">No data available for this section.</p>
        </div>
      );
    }

    // Render specific content based on activeTab
    switch (activeTab) {
      case 'overview':
        return <EpisodeSummary summary={analysis!.summary} />;
      case 'moments':
        return analysis!.keyMoments && analysis!.keyMoments.length > 0 ? (
          <KeyMoments moments={analysis!.keyMoments} />
        ) : (
          <p className="text-slate-600">No key moments found.</p>
        );
      case 'people':
        return analysis!.keyPersonnel && analysis!.keyPersonnel.length > 0 ? (
          <KeyPersonnel personnel={analysis!.keyPersonnel} />
        ) : (
          <p className="text-slate-600">No personnel data found.</p>
        );
      case 'timeline':
        return analysis!.timeline && analysis!.timeline.length > 0 ? (
          <Timeline events={analysis!.timeline} />
        ) : (
          <p className="text-slate-600">No timeline data found.</p>
        );
      case 'references':
        return analysis!.references && analysis!.references.length > 0 ? (
          <References references={analysis!.references} />
        ) : (
          <p className="text-slate-600">No references found.</p>
        );
      case 'transcript':
        return (
          <TranscriptViewer
            transcript={episode.transcript!}
            episodeTitle={episode.title}
            episodeId={episode.episode_id}
            podcastName={podcast.name}
            onTextSelected={handleTextSelected}
          />
        );
      case 'notes':
        return (
          <EpisodeNotes
            episodeId={episode.episode_id}
            episodeTitle={episode.title}
            podcastName={podcast.name}
            highlightedText={highlightedTextForNote}
            onHighlightUsed={handleHighlightUsed}
          />
        );
      default:
        return null;
    }
  };

  // Logic to render the "No Transcript" message
  const renderNoTranscriptMessage = () => (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-12 text-center shadow-sm">
      <div className="max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          Episode Not Yet Transcribed
        </h3>
        <p className="text-slate-600 text-lg leading-relaxed mb-6">
          It looks like this episode hasn't been transcribed yet. Check back later to see timelines, maps, key moments, and much more.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Timelines</span>
          </div>
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-500" />
            <span>Location Maps</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-blue-500" />
            <span>Key People</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Key Moments</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Full Transcript</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      {/* Fixed Header with Episode Info */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800/70 shadow-[0_2px_0_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          {/* Mobile Layout: Stack vertically */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center gap-2">
                {episode.duration && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/70 border border-slate-700 rounded-full text-xs text-slate-300">
                    <Clock className="w-3 h-3" />
                    {Math.floor(episode.duration / 60)}m
                  </span>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400/60 rounded-lg text-xs text-slate-950 font-semibold transition-colors"
                  aria-label="Share episode"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {episode.image_url && (
                <img
                  src={episode.image_url}
                  alt={episode.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-white line-clamp-1">{decodeHtmlEntities(episode.title)}</h1>
                <p className="text-xs text-slate-300 truncate">{podcast.name}</p>
              </div>
            </div>
          </div>
          {episode.audio_url && (
            <div className="md:hidden mt-2">
              <AudioPlayer
                audioUrl={episode.audio_url}
                episodeTitle={episode.title}
                episodeId={episode.episode_id}
                podcastName={podcast.name}
                episodeImage={episode.image_url}
                compact={true}
                theme="dark"
              />
            </div>
          )}

          {/* Desktop Layout: Single row */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              {episode.image_url && (
                <img
                  src={episode.image_url}
                  alt={episode.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-white truncate">{decodeHtmlEntities(episode.title)}</h1>
                <p className="text-xs text-slate-300 truncate">{podcast.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {episode.duration && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/70 border border-slate-700 rounded-full text-xs text-slate-300">
                  <Clock className="w-3 h-3" />
                  {Math.floor(episode.duration / 60)}m
                </span>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400/60 rounded-lg text-xs text-slate-950 font-semibold transition-colors"
                aria-label="Share episode"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
          {episode.audio_url && (
            <div className="hidden md:block mt-2">
              <AudioPlayer
                audioUrl={episode.audio_url}
                episodeTitle={episode.title}
                episodeId={episode.episode_id}
                podcastName={podcast.name}
                episodeImage={episode.image_url}
                compact={true}
                theme="dark"
              />
            </div>
          )}
        </div>
      </header>

      {/* Tabbed Navigation - Fixed to viewport */}
      <div className={`fixed left-0 right-0 bg-slate-900/95 backdrop-blur z-40 top-[146px] md:top-[118px] border-b border-slate-800/60`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
              {isTabVisible('map') && (
                <button
                  onClick={() => handleTabClick('map')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'map'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Locations {locations.length > 0 && `(${locations.length})`}
                </button>
              )}
              {isTabVisible('overview') && (
                <button
                  onClick={() => handleTabClick('overview')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'overview'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> 
                  Overview
                </button>
              )}
              {isTabVisible('moments') && (
                <button
                  onClick={() => handleTabClick('moments')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'moments'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Key Moments
                </button>
              )}
              {isTabVisible('people') && (
                <button
                  onClick={() => handleTabClick('people')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'people'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UsersIcon className="w-3.5 h-3.5" />
                  People
                </button>
              )}
              {isTabVisible('timeline') && (
                <button
                  onClick={() => handleTabClick('timeline')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Timeline
                </button>
              )}
              {isTabVisible('references') && (
                <button
                  onClick={() => handleTabClick('references')} // Use handleTabClick
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'references'
                      ? 'border-cyan-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  References {analysis?.references && analysis.references.length > 0 && `(${analysis.references.length})`}
                </button>
              )}
              {episode.transcript && (
                <>
                  {isTabVisible('transcript') && (
                    <button
                      onClick={() => handleTabClick('transcript')} // Use handleTabClick
                      className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                        activeTab === 'transcript'
                          ? 'border-cyan-400 text-white'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Transcript
                    </button>
                  )}
                  {isTabVisible('notes') && (
                    <button
                      onClick={() => handleTabClick('notes')} // Use handleTabClick
                      className={`flex items-center gap-1.5 px-4 py-2.5 font-medium text-xs whitespace-nowrap border-b-2 transition-all ${
                        activeTab === 'notes'
                          ? 'border-cyan-400 text-white'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                      Notes
                    </button>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>

      <main className={'pt-[222px] md:pt-[158px] relative'}> {/* Added relative to main */}
        {/* Layout container for Map and Sidebar */}
        <div className="flex h-[calc(100vh_-_222px)] md:h-[calc(100vh_-_158px)]"> {/* Adjust height dynamically */}
          
          {/* Map Area - Takes up most of the space */}
          <div className="flex-1 relative overflow-hidden"> {/* Added overflow-hidden */}
            {episode.transcript ? (
              <LocationMap
                locations={locations}
                isLoading={isLoadingLocations}
                error={locationError}
              />
            ) : (
              renderNoTranscriptMessage() // Show message if no transcript
            )}
          </div>

          {/* Sidebar - Appears on the right on desktop, full screen on mobile */}
          {/* Desktop: w-96 fixed width, appears when not on map tab */}
          {/* Mobile: full width, slides in/out */}
          <div className={`w-full md:w-96 flex-shrink-0 transition-all duration-300 ease-in-out
              ${isInfoTabActive(activeTab) ? 'translate-x-0 md:translate-x-0' : 'translate-x-full md:translate-x-full'}
              ${isInfoTabActive(activeTab) ? 'opacity-100 md:opacity-100' : 'opacity-0 md:opacity-0 pointer-events-none'}
              ${activeTab === 'map' ? 'hidden md:hidden' : ''} {/* Hide on desktop when map is active */}
              ${activeTab !== 'map' ? 'bg-gradient-to-b from-slate-900/95 to-slate-900 backdrop-blur border-l border-slate-700/70' : ''}
              absolute md:relative top-0 right-0 bottom-0 z-10 md:z-0
              ${activeTab === 'map' ? 'hidden' : ''} // Hide entirely on desktop when map tab selected
            `}>
            
            {/* Mobile Sidebar Overlay Trigger */}
            {!isInfoTabActive(activeTab) && ( // If on map tab, don't show sidebar content
              <div className="md:hidden w-full h-full flex items-center justify-center">
                <button onClick={() => setIsSidebarVisible(true)} className="text-cyan-400 text-lg font-medium flex items-center gap-2">
                  <Map className="w-4 h-4" /> View Locations Info
                </button>
              </div>
            )}

            {isInfoTabActive(activeTab) && (
              <div className="flex flex-col h-full">
                {/* Sidebar Header (visible on mobile) */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-700/70">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {getIconForTab(getSidebarTitle(activeTab))}
                    {getSidebarTitle(activeTab)}
                  </h3>
                  <button onClick={() => setIsSidebarVisible(false)} aria-label="Close sidebar">
                    <ArrowLeft className="w-5 h-5 text-slate-300 hover:text-white" />
                  </button>
                </div>
                
                {/* Sidebar Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                  {renderSidebarContent()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Episodes - Below Main Content */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">More Episodes</h3>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <List className="w-4 h-4" />
                View All Episodes
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {episodes.slice(0, 12).map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onEpisodeClick(ep)}
                  className={`text-left p-2 rounded-lg transition-all group ${
                    ep.id === episode.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {ep.image_url && (
                    <img
                      src={ep.image_url}
                      alt={ep.title}
                      className="w-full aspect-square rounded object-cover mb-2"
                    />
                  )}
                  <h4 className={`text-xs font-medium mb-1 line-clamp-2 ${
                    ep.id === episode.id ? 'text-blue-700' : 'text-slate-900'
                  }`}>
                    {decodeHtmlEntities(ep.title)}
                  </h4>
                  <div className="text-[10px] text-slate-500">
                    {ep.duration > 0 && (
                      <span>{Math.floor(ep.duration / 60)}m</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PodcastFooter />

      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Share Episode
              </h3>
            </div>

            <p className="text-slate-600 text-sm mb-4">
              Copy the link below to share this episode with others:
            </p>

            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 mb-4">
              <p className="text-slate-700 text-sm break-all font-mono">
                {shareUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyUrl}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}