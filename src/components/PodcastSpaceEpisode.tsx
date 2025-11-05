import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Play, Pause, Clock, Calendar, Hash, Share2, Sparkles, FileText, Users as UsersIcon, Map, BookOpen, StickyNote, MessageCircle } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
import KeyMoments from './KeyMoments';
import KeyPersonnel from './KeyPersonnel';
import Timeline from './Timeline';
import TranscriptViewer from './TranscriptViewer';
import ChatWidget from './ChatWidget';
import EpisodeNotes from './EpisodeNotes';
import { getCachedAnalysis, saveCachedAnalysis } from '../services/episodeAnalysisCache';
import { analyzeTranscript, chatWithTranscript, OpenAIServiceError, type TranscriptAnalysis } from '../services/openaiService';
import { geocodeLocations, type GeocodedLocation } from '../services/geocodingService';
import { stripHtml } from '../utils/textUtils';
import { useAuth } from '../contexts/AuthContext';
import type { StoredEpisode, PodcastSpace, PodcastSettings } from '../types/multiTenant';

interface PodcastSpaceEpisodeProps {
  episode: StoredEpisode;
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  onBack: () => void;
}

type TabType = 'overview' | 'insights' | 'map' | 'transcript' | 'notes' | 'chat';

export default function PodcastSpaceEpisode({ episode, podcast, settings, onBack }: PodcastSpaceEpisodeProps) {
  const { user } = useAuth();
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
        geocoded = await geocodeLocations(transcriptAnalysis.locations.slice(0, 10));
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

  const handleChatMessage = async (message: string): Promise<string> => {
    if (!episode.transcript) {
      throw new Error('No transcript available');
    }

    return await chatWithTranscript(episode.transcript, episode.title, message);
  };

  const handleTextSelected = (text: string) => {
    setHighlightedTextForNote(text);
    // Switch to notes tab so user can see and save the note
    setActiveTab('notes');
  };

  const handleAskAI = (text: string) => {
    // Switch to chat tab and populate the input with the quoted text
    setActiveTab('chat');
    // The chat will need access to this text - we'll pass it via a new state
    setHighlightedTextForNote(`"${text}"`);
    // Clear it after a brief moment so it doesn't persist
    setTimeout(() => {
      setHighlightedTextForNote(undefined);
    }, 100);
  };

  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

  const primaryColor = settings?.primary_color || '#10b981';
  const [isPlaying, setIsPlaying] = useState(false);

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
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[73px]">

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
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                People & Timeline
              </button>
              {locations.length > 0 && (
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                    activeTab === 'map'
                      ? 'border-blue-500 text-white bg-slate-800/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Locations ({locations.length})
                </button>
              )}
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
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                      activeTab === 'chat'
                        ? 'border-blue-500 text-white bg-slate-800/50'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    AI Chat
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
                    <p className="text-slate-300 text-lg font-medium">AI is analyzing this episode...</p>
                    <p className="text-slate-500 text-sm">Extracting insights, locations, and key moments</p>
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

          {/* Insights Tab - People & Timeline side by side */}
          {activeTab === 'insights' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {analysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <KeyPersonnel personnel={analysis.keyPersonnel} />
                  <Timeline events={analysis.timeline} />
                </div>
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
                  <p className="text-slate-300">No insights available yet</p>
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
                onTextSelected={handleTextSelected}
                onAskAI={handleAskAI}
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

          {/* Chat Tab */}
          {activeTab === 'chat' && episode.transcript && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-800 border-b border-slate-700 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">AI Assistant</h3>
                      <p className="text-xs text-slate-400">Ask me anything about this episode</p>
                    </div>
                  </div>
                </div>
                <div className="h-[600px]">
                  <ChatWidget
                    transcript={episode.transcript}
                    episodeTitle={episode.title}
                    onSendMessage={handleChatMessage}
                    embedded={true}
                    initialInput={activeTab === 'chat' ? highlightedTextForNote : undefined}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
