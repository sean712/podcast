import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Play, Pause, Clock, Calendar, Hash, Share2, Sparkles, FileText, Users as UsersIcon, Map, BookOpen, StickyNote, List } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
import KeyMoments from './KeyMoments';
import KeyPersonnel from './KeyPersonnel';
import Timeline from './Timeline';
import TranscriptViewer from './TranscriptViewer';
import EpisodeNotes from './EpisodeNotes';
import { getCachedAnalysis, saveCachedAnalysis } from '../services/episodeAnalysisCache';
import { analyzeTranscript, OpenAIServiceError, type TranscriptAnalysis } from '../services/openaiService';
import { geocodeLocations, type GeocodedLocation } from '../services/geocodingService';
import { stripHtml } from '../utils/textUtils';
import type { StoredEpisode, PodcastSpace, PodcastSettings } from '../types/multiTenant';

interface PodcastSpaceEpisodeProps {
  episode: StoredEpisode;
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  episodes: StoredEpisode[];
  onBack: () => void;
  onEpisodeClick: (episode: StoredEpisode) => void;
}

type TabType = 'overview' | 'people' | 'timeline' | 'map' | 'transcript' | 'notes';

export default function PodcastSpaceEpisode({ episode, podcast, settings, episodes, onBack, onEpisodeClick }: PodcastSpaceEpisodeProps) {
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
        setAnalysis({
          summary: cachedAnalysis.summary,
          keyPersonnel: cachedAnalysis.key_personnel,
          timeline: cachedAnalysis.timeline_events,
          locations: cachedAnalysis.locations.map((loc: any) => loc.name || loc),
          keyMoments: cachedAnalysis.key_moments || [],
        });
        setLocations(cachedAnalysis.locations);
        setIsLoadingLocations(false);
        setIsLoadingAnalysis(false);
        return;
      }

      const transcriptAnalysis = await analyzeTranscript(episode.transcript, episode.episode_id);
      setAnalysis(transcriptAnalysis);

      let geocoded: GeocodedLocation[] = [];
      if (transcriptAnalysis.locations.length > 0) {
        geocoded = await geocodeLocations(transcriptAnalysis.locations.slice(0, 25));
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
    // Switch to notes tab so user can see and save the note
    setActiveTab('notes');
  };


  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Fixed Header with Episode Info */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4 flex-1 min-w-0">
              {episode.image_url && (
                <img
                  src={episode.image_url}
                  alt={episode.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-white truncate">{episode.title}</h1>
                <p className="text-sm text-slate-400 truncate">{podcast.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {episode.duration && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(episode.duration / 60)}m
                </span>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-xs text-white font-medium transition-colors"
                aria-label="Share episode"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[73px]">
        <div className="lg:grid lg:grid-cols-[1fr_320px]">
          <div>
        {/* Tabbed Navigation */}
        <div className="border-b border-slate-700 bg-slate-900 sticky top-[73px] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <FileText className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === 'people'
                    ? 'border-blue-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                Key People
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === 'timeline'
                    ? 'border-blue-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Clock className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Map className="w-4 h-4" />
                Locations {locations.length > 0 && `(${locations.length})`}
              </button>
              {episode.transcript && (
                <>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                      activeTab === 'transcript'
                        ? 'border-blue-500 text-white bg-slate-800/50'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Transcript
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                      activeTab === 'notes'
                        ? 'border-blue-500 text-white bg-slate-800/50'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                    Notes
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoadingAnalysis ? (
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                      <div className="absolute inset-0 w-12 h-12 bg-cyan-400/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-slate-300 text-lg font-medium">Analysing episode transcript</p>
                    <p className="text-slate-500 text-sm">Please wait a moment</p>
                  </div>
                </div>
              ) : (
                <>
                  {analysisError && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 flex items-start gap-3 backdrop-blur-sm">
                      <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-semibold mb-1">Analysis Error</p>
                        <p className="text-red-200">{analysisError}</p>
                      </div>
                    </div>
                  )}
                  {analysis && (
                    <>
                      <EpisodeSummary summary={analysis.summary} />
                      {analysis.keyMoments && analysis.keyMoments.length > 0 && (
                        <KeyMoments moments={analysis.keyMoments} />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {analysis ? (
                <KeyPersonnel personnel={analysis.keyPersonnel} />
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
                  <p className="text-slate-300">No personnel data available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {analysis ? (
                <Timeline events={analysis.timeline} />
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
                  <p className="text-slate-300">No timeline data available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Map Tab - Full width */}
          {activeTab === 'map' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LocationMap
                locations={locations}
                isLoading={isLoadingLocations}
                error={locationError}
              />
            </div>
          )}

          {/* Transcript Tab */}
          {activeTab === 'transcript' && episode.transcript && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TranscriptViewer
                transcript={episode.transcript}
                episodeTitle={episode.title}
                episodeId={episode.episode_id}
                podcastName={podcast.name}
                onTextSelected={handleTextSelected}
              />
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && episode.transcript && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EpisodeNotes
                episodeId={episode.episode_id}
                episodeTitle={episode.title}
                podcastName={podcast.name}
                highlightedText={highlightedTextForNote}
                onHighlightUsed={handleHighlightUsed}
              />
            </div>
          )}

        </div>
          </div>

          {/* Sidebar - Recent Episodes */}
          <aside className="hidden lg:block bg-slate-900 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Recent Episodes</h3>
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                  Show All
                </button>
              </div>

              <div className="space-y-2">
                {episodes.slice(0, 5).map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onEpisodeClick(ep)}
                    className={`w-full text-left p-3 rounded-lg transition-all group ${
                      ep.id === episode.id
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex gap-3">
                      {ep.image_url && (
                        <img
                          src={ep.image_url}
                          alt={ep.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium mb-1 line-clamp-2 ${
                          ep.id === episode.id ? 'text-blue-300' : 'text-white group-hover:text-blue-300'
                        }`}>
                          {ep.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {ep.published_at && (
                            <span>{new Date(ep.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          )}
                          {ep.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{Math.floor(ep.duration / 60)}m</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Share Episode
              </h3>
            </div>

            <p className="text-slate-300 text-sm mb-4">
              Copy the link below to share this episode with others:
            </p>

            <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 mb-4">
              <p className="text-slate-300 text-sm break-all font-mono">
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
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
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
