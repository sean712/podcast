import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Episodes
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex gap-6">
            {episode.image_url && (
              <img
                src={episode.image_url}
                alt={episode.title}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{episode.title}</h2>
              <p className="text-gray-600 mb-3">{podcast.name}</p>
              {episode.description && (
                <p className="text-gray-700 leading-relaxed line-clamp-3">
                  {stripHtml(episode.description)}
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoadingAnalysis ? (
          <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center gap-3 mb-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            <p className="text-gray-600">Analyzing transcript with AI...</p>
          </div>
        ) : (
          <>
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{analysisError}</p>
              </div>
            )}
            {analysis && (
              <>
                <EpisodeSummary summary={analysis.summary} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <KeyPersonnel personnel={analysis.keyPersonnel} />
                  <Timeline events={analysis.timeline} />
                </div>
              </>
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
