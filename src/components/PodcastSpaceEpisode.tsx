import { useState, useEffect } from 'react';
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

export default function PodcastSpaceEpisode({ episode, podcast, settings, episodes, onBack, onEpisodeClick }: PodcastSpaceEpisodeProps) {
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedTextForNote, setHighlightedTextForNote] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Data Fetching and State Logic (Unchanged) ---
  useEffect(() => {
    if (episode.transcript) {
      analyzeAndProcessTranscript();
    } else {
        // Reset state if there's no transcript
        setAnalysis(null);
        setLocations([]);
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
        const validLocations = cachedAnalysis.locations.filter((loc: any) => loc && typeof loc === 'object' && loc.lat !== undefined && loc.lon !== undefined);
        setAnalysis({
          summary: cachedAnalysis.summary,
          keyPersonnel: cachedAnalysis.key_personnel,
          timeline: cachedAnalysis.timeline_events,
          locations: validLocations.map((loc: any) => ({ name: loc.name, context: loc.context })),
          keyMoments: cachedAnalysis.key_moments || [],
          references: cachedAnalysis.references || [],
        });
        setLocations(validLocations);
      } else {
        const transcriptAnalysis = await analyzeTranscript(episode.transcript, episode.episode_id);
        setAnalysis(transcriptAnalysis);
        let geocoded: GeocodedLocation[] = [];
        if (transcriptAnalysis.locations.length > 0) {
          geocoded = await geocodeLocations(transcriptAnalysis.locations.slice(0, 25));
          setLocations(geocoded);
        }
        await saveCachedAnalysis(episode.episode_id, episode.title, podcast.name, transcriptAnalysis, geocoded);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setAnalysisError(errorMessage);
      setLocationError(errorMessage);
    } finally {
      setIsLoadingAnalysis(false);
      setIsLoadingLocations(false);
    }
  };

  const handleTextSelected = (text: string) => {
    setHighlightedTextForNote(text);
    setActiveTab('notes');
  };

  const handleHighlightUsed = () => {
    setHighlightedTextForNote(undefined);
  };

  const isTabVisible = (tabName: string): boolean => {
    const visibleTabs = settings?.visible_tabs;
    if (!visibleTabs || visibleTabs.length === 0) return true;
    return visibleTabs.includes(tabName);
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

  // --- NEW Dark Theme Render Method ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-4">
             <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              {episode.image_url && (
                <img src={episode.image_url} alt={episode.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-slate-100 truncate">{decodeHtmlEntities(episode.title)}</h1>
                <p className="text-xs text-slate-400 truncate">{podcast.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {episode.duration && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {Math.floor(episode.duration / 60)}m
                </span>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-xs text-slate-900 font-bold transition-colors"
                aria-label="Share episode"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* AUDIO PLAYER BAR */}
      {episode.audio_url && isTabVisible('player') && (
        <div className="fixed left-0 right-0 bg-slate-900/80 backdrop-blur-lg z-40 top-[61px] border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <AudioPlayer audioUrl={episode.audio_url} episodeTitle={episode.title} episodeId={episode.episode_id} podcastName={podcast.name} episodeImage={episode.image_url} compact={true} />
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className={`fixed left-0 right-0 bg-slate-900 z-40 ${episode.audio_url && isTabVisible('player') ? 'top-[118px]' : 'top-[61px]'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-800">
            <nav className="flex gap-2 -mb-px overflow-x-auto scrollbar-hide">
              {isTabVisible('map') && (<button onClick={() => setActiveTab('map')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'map' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><Map className="w-4 h-4" /> Locations {locations.length > 0 && `(${locations.length})`}</button>)}
              {isTabVisible('overview') && (<button onClick={() => setActiveTab('overview')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'overview' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><FileText className="w-4 h-4" /> Overview</button>)}
              {isTabVisible('moments') && (<button onClick={() => setActiveTab('moments')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'moments' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><Sparkles className="w-4 h-4" /> Key Moments</button>)}
              {isTabVisible('people') && (<button onClick={() => setActiveTab('people')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'people' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><UsersIcon className="w-4 h-4" /> People</button>)}
              {isTabVisible('timeline') && (<button onClick={() => setActiveTab('timeline')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'timeline' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><Clock className="w-4 h-4" /> Timeline</button>)}
              {isTabVisible('references') && (<button onClick={() => setActiveTab('references')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'references' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><Tag className="w-4 h-4" /> References {analysis?.references && analysis.references.length > 0 && `(${analysis.references.length})`}</button>)}
              {episode.transcript && isTabVisible('transcript') && (<button onClick={() => setActiveTab('transcript')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'transcript' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><BookOpen className="w-4 h-4" /> Transcript</button>)}
              {episode.transcript && isTabVisible('notes') && (<button onClick={() => setActiveTab('notes')} className={`flex items-center gap-1.5 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === 'notes' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}><StickyNote className="w-4 h-4" /> Notes</button>)}
            </nav>
          </div>
        </div>

      <main className={episode.audio_url && isTabVisible('player') ? 'pt-[167px]' : 'pt-[110px]'}>
        {/* TAB CONTENT */}
        <div className={activeTab !== 'map' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" : ""}>
          {!episode.transcript && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8 text-cyan-400" /></div>
                <h3 className="text-2xl font-bold text-slate-100 mb-3">Episode Not Yet Transcribed</h3>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">It looks like this episode hasn't been transcribed yet. Check back later to see timelines, maps, key moments, and much more.</p>
              </div>
            </div>
          )}

          {isLoadingAnalysis && activeTab !== 'map' && (
             <div className="flex flex-col items-center justify-center gap-4 p-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="text-slate-300 text-lg font-medium">Analysing episode transcript...</p>
             </div>
          )}

          {analysisError && activeTab !== 'map' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div><p className="text-red-300 font-semibold mb-1">Analysis Error</p><p className="text-red-300/80">{analysisError}</p></div>
            </div>
          )}

          {episode.transcript && !isLoadingAnalysis && !analysisError && (
            <>
              {activeTab === 'map' && <div className="animate-in fade-in"><LocationMap locations={locations} isLoading={isLoadingLocations} error={locationError} /></div>}
              {activeTab === 'overview' && <div className="animate-in fade-in"><EpisodeSummary summary={analysis?.summary || ''} /></div>}
              {activeTab === 'moments' && <div className="animate-in fade-in"><KeyMoments moments={analysis?.keyMoments || []} /></div>}
              {activeTab === 'people' && <div className="animate-in fade-in"><KeyPersonnel personnel={analysis?.keyPersonnel || []} /></div>}
              {activeTab === 'timeline' && <div className="animate-in fade-in"><Timeline events={analysis?.timeline || []} /></div>}
              {activeTab === 'references' && <div className="animate-in fade-in"><References references={analysis?.references || []} /></div>}
              {activeTab === 'transcript' && <div className="animate-in fade-in"><TranscriptViewer transcript={episode.transcript} onTextSelected={handleTextSelected} /></div>}
              {activeTab === 'notes' && <div className="animate-in fade-in"><EpisodeNotes episodeId={episode.episode_id} episodeTitle={episode.title} podcastName={podcast.name} highlightedText={highlightedTextForNote} onHighlightUsed={handleHighlightUsed} /></div>}
            </>
          )}
        </div>
        
        {/* MORE EPISODES SECTION */}
        <div className="bg-slate-900 border-t border-slate-800 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">More Episodes</h3>
              <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"><List className="w-4 h-4" />View All Episodes</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {episodes.slice(0, 12).map((ep) => (
                <button key={ep.id} onClick={() => onEpisodeClick(ep)} className={`text-left p-2 rounded-lg transition-all group ${ep.id === episode.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'}`}>
                  {ep.image_url && <img src={ep.image_url} alt={ep.title} className="w-full aspect-square rounded object-cover mb-2" />}
                  <h4 className={`text-xs font-medium mb-1 line-clamp-2 ${ep.id === episode.id ? 'text-cyan-300' : 'text-slate-100'}`}>{decodeHtmlEntities(ep.title)}</h4>
                  <div className="text-[10px] text-slate-500">{ep.duration > 0 && <span>{Math.floor(ep.duration / 60)}m</span>}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PodcastFooter />

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4"><Share2 className="w-5 h-5 text-cyan-400" /> Share Episode</h3>
            <p className="text-slate-400 text-sm mb-4">Copy the link below to share this episode:</p>
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 mb-4"><p className="text-slate-300 text-sm break-all font-mono">{shareUrl}</p></div>
            <div className="flex gap-3">
              <button onClick={handleCopyUrl} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-4 py-2.5 rounded-lg font-bold transition-colors">{copySuccess ? 'Copied!' : 'Copy Link'}</button>
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}