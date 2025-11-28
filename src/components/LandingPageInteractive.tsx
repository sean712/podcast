import { useState, useEffect } from 'react';
import { Radio, Map, Clock, Users as UsersIcon, List, BookOpen, FileText, StickyNote, Tag, Sparkles, X } from 'lucide-react';
import LocationMap from './LocationMap';
import EpisodeSummary from './EpisodeSummary';
import KeyMoments from './KeyMoments';
import KeyPersonnel from './KeyPersonnel';
import Timeline from './Timeline';
import TranscriptViewer from './TranscriptViewer';
import EpisodeNotes from './EpisodeNotes';
import References from './References';
import DemoAudioPlayerStatic from './DemoAudioPlayerStatic';
import PodcastFooter from './PodcastFooter';
import { demoPodcast, demoEpisode, demoLocations, demoAnalysis, demoSettings } from '../data/demoEpisodeData';

interface LandingPageInteractiveProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

type TabType = 'map' | 'timeline' | 'people' | 'moments' | 'references' | 'overview' | 'transcript' | 'notes';

export default function LandingPageInteractive({ onGetStarted, onSignIn }: LandingPageInteractiveProps) {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set(['map']));
  const [showEngagementBanner, setShowEngagementBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    document.title = 'Augmented Pods - Interactive Episode Pages for Podcasts';
  }, []);

  useEffect(() => {
    if (visitedTabs.size >= 2 && !bannerDismissed) {
      setTimeout(() => {
        setShowEngagementBanner(true);
      }, 1000);
    }
  }, [visitedTabs, bannerDismissed]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  };

  const tabs = [
    { id: 'map' as TabType, label: 'Map', icon: Map, color: 'cyan' },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Clock, color: 'blue' },
    { id: 'people' as TabType, label: 'People', icon: UsersIcon, color: 'purple' },
    { id: 'moments' as TabType, label: 'Moments', icon: List, color: 'orange' },
    { id: 'references' as TabType, label: 'References', icon: Tag, color: 'green' },
    { id: 'overview' as TabType, label: 'Overview', icon: FileText, color: 'indigo' },
    { id: 'transcript' as TabType, label: 'Transcript', icon: BookOpen, color: 'slate' },
    { id: 'notes' as TabType, label: 'Notes', icon: StickyNote, color: 'amber' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Interactive Location Map</h3>
                <p className="text-slate-400">Automatically extracted locations with satellite imagery</p>
              </div>
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <span className="text-xs font-medium text-cyan-400">Auto-Generated</span>
              </div>
            </div>
            <LocationMap locations={demoLocations} theme="dark" currentEpisodeId={demoEpisode.episode_id} />
          </div>
        );
      case 'timeline':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Smart Timeline</h3>
                <p className="text-slate-400">Chronological events automatically extracted from content</p>
              </div>
              <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-xs font-medium text-blue-400">Auto-Generated</span>
              </div>
            </div>
            <Timeline events={demoAnalysis.timeline} theme="dark" currentEpisodeId={demoEpisode.episode_id} />
          </div>
        );
      case 'people':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Key People</h3>
                <p className="text-slate-400">Automatic identification of people mentioned in the episode</p>
              </div>
              <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <span className="text-xs font-medium text-purple-400">Auto-Generated</span>
              </div>
            </div>
            <KeyPersonnel personnel={demoAnalysis.keyPersonnel} theme="dark" currentEpisodeId={demoEpisode.episode_id} />
          </div>
        );
      case 'moments':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Key Moments</h3>
                <p className="text-slate-400">Important highlights automatically discovered in the episode</p>
              </div>
              <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <span className="text-xs font-medium text-orange-400">Auto-Generated</span>
              </div>
            </div>
            <KeyMoments moments={demoAnalysis.keyMoments} theme="dark" />
          </div>
        );
      case 'references':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">References</h3>
                <p className="text-slate-400">Books, films, and resources mentioned in the episode</p>
              </div>
              <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="text-xs font-medium text-green-400">Auto-Generated</span>
              </div>
            </div>
            <References references={demoAnalysis.references} theme="dark" currentEpisodeId={demoEpisode.episode_id} />
          </div>
        );
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Episode Overview</h3>
                <p className="text-slate-400">AI-generated summary of the episode content</p>
              </div>
              <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <span className="text-xs font-medium text-indigo-400">Auto-Generated</span>
              </div>
            </div>
            <EpisodeSummary summary={demoAnalysis.summary} theme="dark" />
          </div>
        );
      case 'transcript':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Full Transcript</h3>
                <p className="text-slate-400">Searchable transcript with highlight and copy features</p>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/60 rounded-2xl p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Searchable Transcripts</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Every episode gets a full, searchable transcript. Listeners can search for specific topics, copy quotes, and highlight important passages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <StickyNote className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Highlight & Save</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Listeners can select any text in the transcript to save it as a personal note. Perfect for capturing insights, quotes, and key takeaways.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Timestamp Navigation</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Click any timestamp in the transcript to jump directly to that moment in the audio. Makes finding specific sections quick and easy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">SEO Benefits</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Transcripts make your content searchable by search engines, helping new listeners discover your podcast through Google searches.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Episode Notes</h3>
                <p className="text-slate-400">Personal note-taking workspace for your listeners</p>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/60 rounded-2xl p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <StickyNote className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Personal Note Taking</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Listeners can create and save personal notes while engaging with your episode content. Great for educational podcasts and evergreen content.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Highlight Text from Transcript</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Users can select any text from the transcript and save it directly to their notes with the original context preserved.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Organized by Episode</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Notes are automatically organized by episode, making it easy for listeners to review their takeaways from your entire catalog.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Increased Engagement</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Note-taking features increase listener engagement and make your content more valuable for long-term reference and learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-7 h-7 text-cyan-500" />
              <span className="text-xl font-bold text-white">Augmented Pods</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onGetStarted}
                className="bg-cyan-500 text-slate-950 px-5 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition-all text-sm"
              >
                Get This For Your Podcast
              </button>
              <button
                onClick={onSignIn}
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24">
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute top-24 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Beautiful interactive content for every episode
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Give your listeners more than just audio. Automated, branded episode content with smart features—no extra work required.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-cyan-500 text-slate-950 px-8 py-4 rounded-lg font-semibold hover:bg-cyan-400 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-lg border border-cyan-400/60"
            >
              Get This For Your Podcast
              <Sparkles className="w-5 h-5" />
            </button>
            <p className="text-sm text-slate-400 mt-4">
              Setup handled by us • Live in 48 hours
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Try It Yourself
              </h2>
              <p className="text-lg text-slate-300">
                Explore an interactive episode page below
              </p>
            </div>
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                      {demoEpisode.title}
                    </h3>
                    <p className="text-lg text-cyan-400 font-medium mb-3">{demoPodcast.name}</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed line-clamp-3">
                  {demoEpisode.description}
                </p>
              </div>
            </div>

            <div className="border-b border-slate-800 mb-6">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="transition-all duration-300">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {showEngagementBanner && !bannerDismissed && (
        <div className="fixed bottom-24 left-0 right-0 z-30 px-4 sm:px-6 lg:px-8 animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl shadow-2xl p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Sparkles className="w-8 h-8 text-white flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg mb-1">Like what you see?</p>
                  <p className="text-cyan-50 text-sm">Get this automatically for every episode of your podcast</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3 bg-white text-cyan-600 rounded-lg font-semibold hover:bg-cyan-50 transition-colors whitespace-nowrap"
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    setShowEngagementBanner(false);
                    setBannerDismissed(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <DemoAudioPlayerStatic
          episodeTitle={demoEpisode.title}
          podcastName={demoPodcast.name}
          duration={demoEpisode.duration}
        />
      </div>

      <PodcastFooter />

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
