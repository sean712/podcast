import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Clock, Share2, Sparkles, ExternalLink, User, Play, Quote, ChevronDown, ChevronUp, MapPin, FileText } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
import KeyMoments from './KeyMoments';
import Timeline from './Timeline';
import TranscriptViewer from './TranscriptViewer';
import EpisodeNotes from './EpisodeNotes';
import References from './References';
import AudioPlayer from './AudioPlayer';
import PodcastFooter from './PodcastFooter';
import CreatorCallToAction from './CreatorCallToAction';
import { getCachedAnalysis, saveCachedAnalysis } from '../services/episodeAnalysisCache';
import { analyzeTranscript, OpenAIServiceError, type TranscriptAnalysis, type KeyPerson } from '../services/openaiService';
import { geocodeLocations, type GeocodedLocation } from '../services/geocodingService';
import { stripHtml, decodeHtmlEntities } from '../utils/textUtils';
import type { StoredEpisode, PodcastSpace, PodcastSettings } from '../types/multiTenant';
import { useAudio } from '../contexts/AudioContext';
import { parseTimestamp, formatTimestamp } from '../utils/timestampUtils';

interface PodcastSpaceEpisodeProps {
  episode: StoredEpisode;
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  episodes: StoredEpisode[];
  onBack: () => void;
  onEpisodeClick: (episode: StoredEpisode) => void;
  isFeaturedMode?: boolean;
}

export default function PodcastSpaceEpisode({ episode, podcast, settings, episodes, onBack, onEpisodeClick, isFeaturedMode = false }: PodcastSpaceEpisodeProps) {
  const { setCurrentEpisode, currentEpisode, seekTo, setIsPlaying } = useAudio();
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);
  const [expandedPerson, setExpandedPerson] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    setCurrentEpisode({
      episodeId: episode.episode_id,
      title: episode.title,
      audioUrl: episode.audio_url,
      imageUrl: episode.image_url,
      podcastName: podcast.name,
    });

    return () => {
      setCurrentEpisode(null);
    };
  }, [episode.episode_id, episode.title, episode.audio_url, episode.image_url, podcast.name, setCurrentEpisode]);

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

        setAnalysis({
          summary: cachedAnalysis.summary,
          keyPersonnel: cachedAnalysis.key_personnel,
          timeline: cachedAnalysis.timeline_events,
          locations: validLocations.map((loc: any) => ({ name: loc.name, context: loc.context, quotes: loc.quotes })),
          keyMoments: cachedAnalysis.key_moments || [],
          references: cachedAnalysis.references || [],
        });
        setLocations(validLocations);
        setIsLoadingLocations(false);
        setIsLoadingAnalysis(false);
        return;
      }

      const transcriptAnalysis = await analyzeTranscript(episode.transcript, episode.episode_id, podcast.id);
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
    document.getElementById('notes-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

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

  const isTabVisible = (tabName: string): boolean => {
    const visibleTabs = settings?.visible_tabs;
    if (!visibleTabs || visibleTabs.length === 0) {
      return true;
    }
    return visibleTabs.includes(tabName);
  };

  const colors = [
    { bg: 'bg-teal-600', border: 'border-teal-600', quoteBorder: 'border-teal-600', quoteBg: 'bg-teal-50' },
    { bg: 'bg-emerald-600', border: 'border-emerald-600', quoteBorder: 'border-emerald-600', quoteBg: 'bg-emerald-50' },
    { bg: 'bg-cyan-600', border: 'border-cyan-600', quoteBorder: 'border-cyan-600', quoteBg: 'bg-cyan-50' },
    { bg: 'bg-sky-600', border: 'border-sky-600', quoteBorder: 'border-sky-600', quoteBg: 'bg-sky-50' },
    { bg: 'bg-violet-600', border: 'border-violet-600', quoteBorder: 'border-violet-600', quoteBg: 'bg-violet-50' },
    { bg: 'bg-fuchsia-600', border: 'border-fuchsia-600', quoteBorder: 'border-fuchsia-600', quoteBg: 'bg-fuchsia-50' },
  ];

  const getColor = (index: number) => colors[index % colors.length];

  const renderPersonCard = (person: KeyPerson, index: number) => {
    const color = getColor(index);
    const isExpanded = expandedPerson === index;

    const handleQuoteClick = (timestamp: number) => {
      if (currentEpisode?.episodeId === episode.episode_id) {
        seekTo(timestamp);
        setIsPlaying(true);
      }
    };

    return (
      <div
        key={index}
        className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all"
      >
        <button
          onClick={() => setExpandedPerson(isExpanded ? null : index)}
          className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-900/80 transition-colors"
        >
          {person.wikipediaPageUrl ? (
            <a
              href={person.wikipediaPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 group"
              onClick={(e) => e.stopPropagation()}
            >
              {person.wikipediaImageUrl ? (
                <img
                  src={person.wikipediaImageUrl}
                  alt={person.name}
                  className={`w-12 h-12 rounded-full object-cover border-2 ${color.border} shadow-md group-hover:scale-105 transition-transform`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center border-2 ${color.border} shadow-md group-hover:scale-105 transition-transform ${person.wikipediaImageUrl ? 'hidden' : 'flex'}`}
              >
                <User className="w-6 h-6 text-white" />
              </div>
            </a>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
              <User className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-100 truncate">{person.name}</h4>
            {!isExpanded && (
              <p className="text-xs text-slate-400 truncate">{person.role}</p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <span className={`text-xs font-medium text-white ${color.bg} px-2 py-1 rounded-md inline-block`}>
                {person.role}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {person.relevance}
            </p>

            {person.quotes && person.quotes.length > 0 && (
              <div className="pt-3 border-t border-slate-700/70 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Quote className="w-3.5 h-3.5" />
                  <span>{person.quotes.length} {person.quotes.length === 1 ? 'quote' : 'quotes'}</span>
                </div>
                {person.quotes.map((quote, qIndex) => {
                  const quoteText = typeof quote === 'string' ? quote : quote.text;
                  const quoteTimestamp = typeof quote === 'object' && quote.timestamp ? quote.timestamp : null;
                  const timestamp = quoteTimestamp ? parseTimestamp(quoteTimestamp) : null;
                  const isPlayable = timestamp !== null && episode.episode_id === currentEpisode?.episodeId;

                  return (
                    <div
                      key={qIndex}
                      onClick={() => isPlayable && timestamp && handleQuoteClick(timestamp)}
                      className={`relative pl-3 border-l-2 ${color.quoteBorder} bg-slate-800/60 rounded-r-lg p-2.5 ${
                        isPlayable ? 'cursor-pointer hover:opacity-80' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs italic text-slate-300 leading-relaxed">
                          "{quoteText}"
                        </p>
                        {isPlayable && (
                          <Play className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" />
                        )}
                      </div>
                      {isPlayable && timestamp !== null && (
                        <div className="text-xs font-medium mt-1.5 text-emerald-500">
                          {formatTimestamp(timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg">
        {/* Branding Bar */}
        <div className="border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {!isFeaturedMode && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
              <span className="text-base font-bold text-white">Augmented Pods</span>
            </div>
          </div>
        </div>

        {/* Episode Info & Player Bar */}
        <div className="border-b border-slate-800/50 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Mobile Layout - Compact */}
            <div className="flex flex-col gap-4 md:hidden">
              {/* Title row with image and buttons */}
              <div className="flex items-center gap-2">
                {episode.image_url && (
                  <img
                    src={episode.image_url}
                    alt={episode.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-2 ring-cyan-400/60"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xs font-bold text-white line-clamp-1">{decodeHtmlEntities(episode.title)}</h1>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-slate-300 truncate">{podcast.name}</p>
                    {podcast.podcast_url && (
                      <a
                        href={podcast.podcast_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {episode.duration && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800/70 border border-slate-700 rounded text-[10px] text-slate-300">
                      <Clock className="w-2.5 h-2.5" />
                      {Math.floor(episode.duration / 60)}m
                    </span>
                  )}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400/60 rounded text-[10px] text-slate-950 font-semibold transition-colors"
                  >
                    <Share2 className="w-2.5 h-2.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {episode.image_url && (
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-cyan-400/60"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-white truncate">{decodeHtmlEntities(episode.title)}</h1>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-slate-300 truncate">{podcast.name}</p>
                      {podcast.podcast_url && (
                        <a
                          href={podcast.podcast_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
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
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Single Player for all layouts */}
            {episode.audio_url && isTabVisible('player') && (
              <div className="mt-4">
                <AudioPlayer
                  audioUrl={episode.audio_url}
                  episodeTitle={episode.title}
                  episodeId={episode.episode_id}
                  podcastName={podcast.name}
                  episodeImage={episode.image_url}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-[140px] md:pt-[160px]">
        {/* Episode Description */}
        {episode.description && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Episode Description
              </h2>
              <div className="text-slate-300 leading-relaxed text-sm">
                <div
                  className={`prose prose-sm prose-invert prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline max-w-none ${!isDescriptionExpanded && stripHtml(episode.description).length > 200 ? 'line-clamp-3' : ''}`}
                  dangerouslySetInnerHTML={{ __html: episode.description }}
                />
                {stripHtml(episode.description).length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {!episode.transcript ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Episode Not Yet Analyzed
                  </h3>
                  <p className="text-slate-300">
                    This episode hasn't been transcribed yet. Check back later for timelines, maps, key moments, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section: Map + Locations Panel */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 relative z-0">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Map - 65% width on desktop */}
                <div className="w-full lg:w-[65%]">
                  <div className="h-[400px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative z-0">
                    <LocationMap
                      locations={locations}
                      isLoading={isLoadingLocations}
                      error={locationError}
                      showSidePanel={false}
                      mapHeight="100%"
                      currentEpisodeId={episode.episode_id}
                      focusOnLocation={selectedLocation}
                    />
                  </div>
                </div>

                {/* Locations Panel - 35% width on desktop, scrollable */}
                <div className="w-full lg:w-[35%]">
                  <div className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="bg-slate-800/60 border-b border-slate-700 px-4 py-3">
                      <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-400" />
                        Locations {locations.length > 0 && `(${locations.length})`}
                      </h2>
                    </div>
                    <div className="overflow-y-auto max-h-[400px] lg:max-h-[555px] p-4 space-y-3">
                      {isLoadingLocations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                          <p className="text-slate-300 text-sm">Finding locations...</p>
                        </div>
                      ) : locationError ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                              <p className="text-red-300 font-semibold">Location Error</p>
                              <p className="text-red-200 text-sm">{locationError}</p>
                            </div>
                          </div>
                        </div>
                      ) : locations.length > 0 ? (
                        locations.map((location, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedLocation(location)}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                              selectedLocation === location
                                ? 'bg-slate-800 border-2 border-orange-400/60'
                                : 'bg-slate-900/60 border-2 border-slate-700 hover:bg-slate-800 hover:border-orange-400/60'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 pt-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm hover:scale-110 transition-transform duration-300">
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm mb-1 text-slate-100">
                                  {location.name}
                                </div>
                                {location.context && (
                                  <div className="text-xs text-slate-300/90 line-clamp-3">
                                    {location.context}
                                  </div>
                                )}
                                {location.quotes && location.quotes.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {location.quotes.map((quote, qIndex) => {
                                      const timestamp = quote.timestamp ? parseTimestamp(quote.timestamp) : null;
                                      const isPlayable = timestamp !== null && episode.episode_id === currentEpisode?.episodeId;

                                      const handleQuoteClick = (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (isPlayable && timestamp !== null) {
                                          seekTo(timestamp);
                                          setIsPlaying(true);
                                        }
                                      };

                                      return (
                                        <div
                                          key={qIndex}
                                          onClick={handleQuoteClick}
                                          className={`text-xs italic text-slate-400 border-l-2 border-orange-500 pl-2 py-1 ${
                                            isPlayable ? 'cursor-pointer hover:text-emerald-400 hover:border-emerald-500' : ''
                                          }`}
                                        >
                                          <div className="flex items-start gap-1.5">
                                            <Quote className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <div>"{quote.text}"</div>
                                              {isPlayable && timestamp !== null && (
                                                <div className="flex items-center gap-1 mt-0.5 text-emerald-400">
                                                  <Play className="w-3 h-3" fill="currentColor" />
                                                  <span>{formatTimestamp(timestamp)}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-8">No locations identified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* People Panel - Horizontal below map */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-slate-800/60 border-b border-slate-700 px-4 py-3">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    People {analysis?.keyPersonnel && `(${analysis.keyPersonnel.length})`}
                  </h2>
                </div>
                <div className="p-4">
                  {isLoadingAnalysis ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-slate-300 text-sm">Identifying key people...</p>
                    </div>
                  ) : analysisError ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-red-300 font-semibold">Analysis Error</p>
                          <p className="text-red-200 text-sm">{analysisError}</p>
                        </div>
                      </div>
                    </div>
                  ) : analysis?.keyPersonnel && analysis.keyPersonnel.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {analysis.keyPersonnel.map((person, index) => renderPersonCard(person, index))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No people identified</p>
                  )}
                </div>
              </div>
            </section>

            {/* Full-Width Sections Below Hero */}
            <div className="bg-slate-950/50">
              {/* Timeline Section */}
              {isTabVisible('timeline') && (
                <section className="border-t border-slate-800/60 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-teal-400" />
                      Timeline
                    </h2>
                    {isLoadingAnalysis ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                        <p className="text-slate-300 text-sm">Building timeline...</p>
                      </div>
                    ) : analysis?.timeline && analysis.timeline.length > 0 ? (
                      <Timeline events={analysis.timeline} theme="dark" currentEpisodeId={episode.episode_id} />
                    ) : (
                      <p className="text-slate-400 text-center py-8">No timeline data available</p>
                    )}
                  </div>
                </section>
              )}

              {/* Key Moments Section */}
              {isTabVisible('moments') && (
                <section className="border-t border-slate-800/60 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-orange-400" />
                      Key Moments
                    </h2>
                    {isLoadingAnalysis ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                        <p className="text-slate-300 text-sm">Finding key moments...</p>
                      </div>
                    ) : analysis?.keyMoments && analysis.keyMoments.length > 0 ? (
                      <KeyMoments moments={analysis.keyMoments} theme="dark" currentEpisodeId={episode.episode_id} />
                    ) : (
                      <p className="text-slate-400 text-center py-8">No key moments available</p>
                    )}
                  </div>
                </section>
              )}

              {/* References Section */}
              {isTabVisible('references') && (
                <section className="border-t border-slate-800/60 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                      <ExternalLink className="w-6 h-6 text-cyan-400" />
                      References {analysis?.references && `(${analysis.references.length})`}
                    </h2>
                    {isLoadingAnalysis ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        <p className="text-slate-300 text-sm">Finding references...</p>
                      </div>
                    ) : analysis?.references && analysis.references.length > 0 ? (
                      <References references={analysis.references} theme="dark" currentEpisodeId={episode.episode_id} />
                    ) : (
                      <p className="text-slate-400 text-center py-8">No references available</p>
                    )}
                  </div>
                </section>
              )}

              {/* Transcript Section */}
              {isTabVisible('transcript') && (
                <section className="border-t border-slate-800/60 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white mb-8">Transcript</h2>
                    <TranscriptViewer
                      transcript={episode.transcript}
                      episodeTitle={episode.title}
                      episodeId={episode.episode_id}
                      podcastName={podcast.name}
                      onTextSelected={handleTextSelected}
                      theme="dark"
                    />
                  </div>
                </section>
              )}

              {/* Notes Section */}
              {isTabVisible('notes') && (
                <section id="notes-section" className="border-t border-slate-800/60 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white mb-8">Notes</h2>
                    <EpisodeNotes
                      episodeId={episode.episode_id}
                      episodeTitle={episode.title}
                      podcastName={podcast.name}
                      highlightedText={highlightedTextForNote}
                      onHighlightUsed={handleHighlightUsed}
                      theme="dark"
                    />
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        {/* More Episodes or CTA */}
        {!podcast.is_client ? (
          <div className="bg-slate-950 border-t border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <CreatorCallToAction />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border-t border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">More Episodes</h3>
                <button
                  onClick={onBack}
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {episodes.slice(0, 12).map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onEpisodeClick(ep)}
                    className={`text-left p-2 rounded-lg transition-all border ${
                      ep.id === episode.id
                        ? 'bg-slate-800 border-cyan-400/60'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
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
                      ep.id === episode.id ? 'text-cyan-300' : 'text-slate-100'
                    }`}>
                      {decodeHtmlEntities(ep.title)}
                    </h4>
                    <div className="text-[10px] text-slate-400">
                      {ep.duration > 0 && (
                        <span>{Math.floor(ep.duration / 60)}m</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <PodcastFooter />

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
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
