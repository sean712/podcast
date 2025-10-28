import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Play, Pause, Clock, Calendar, Hash, Share2, Sparkles } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
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

export default function PodcastSpaceEpisode({ episode, podcast, settings, onBack }: PodcastSpaceEpisodeProps) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);

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
        });
        setLocations(cachedAnalysis.locations);
        setIsLoadingLocations(false);
        setIsLoadingAnalysis(false);
        return;
      }

      const transcriptAnalysis = await analyzeTranscript(episode.transcript);
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
  };

  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

  const primaryColor = settings?.primary_color || '#10b981';
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Episodes</span>
          </button>
        </div>
      </header>

      <main className="pt-20">
        {/* Cinematic Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            {episode.image_url && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 transform scale-110"
                  style={{ backgroundImage: `url(${episode.image_url})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/80 to-slate-950" />
              </>
            )}
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Episode Artwork */}
              {episode.image_url && (
                <div className="flex-shrink-0 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-2xl transform group-hover:scale-110 transition-transform duration-500" />
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="relative w-72 h-72 rounded-2xl object-cover shadow-2xl shadow-black/50 ring-1 ring-white/10 transform group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Play Button Overlay */}
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                        {isPlaying ? (
                          <Pause className="w-10 h-10 text-slate-900" />
                        ) : (
                          <Play className="w-10 h-10 text-slate-900 ml-1" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Episode Info */}
              <div className="flex-1 min-w-0">
                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full text-sm text-slate-300">
                    <Calendar className="w-4 h-4" />
                    {episode.publish_date ? new Date(episode.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </span>
                  {episode.duration && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full text-sm text-slate-300">
                      <Clock className="w-4 h-4" />
                      {Math.floor(episode.duration / 60)} min
                    </span>
                  )}
                  <button className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {/* Episode Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
                  {episode.title}
                </h1>

                {/* Podcast Name */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">{podcast.name}</p>
                    <p className="text-sm text-slate-400">Podcast</p>
                  </div>
                </div>

                {/* Description */}
                {episode.description && (
                  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 max-w-3xl">
                    <p className="text-lg text-slate-200 leading-relaxed">
                      {stripHtml(episode.description)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

          {/* AI Analysis Section */}
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
                <div className="space-y-8">
                  <EpisodeSummary summary={analysis.summary} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <KeyPersonnel personnel={analysis.keyPersonnel} />
                    <Timeline events={analysis.timeline} />
                  </div>
                </div>
              )}
            </>
          )}

          <LocationMap
            locations={locations}
            isLoading={isLoadingLocations}
            error={locationError}
          />

          {episode.transcript && (
            <>
              <TranscriptViewer
                transcript={episode.transcript}
                episodeTitle={episode.title}
                onTextSelected={handleTextSelected}
              />
              <EpisodeNotes
                episodeId={episode.episode_id}
                episodeTitle={episode.title}
                podcastName={podcast.name}
                highlightedText={highlightedTextForNote}
                onHighlightUsed={handleHighlightUsed}
              />
            </>
          )}
        </div>
      </main>

      {episode.transcript && (
        <ChatWidget
          transcript={episode.transcript}
          episodeTitle={episode.title}
          onSendMessage={handleChatMessage}
        />
      )}
    </div>
  );
}
