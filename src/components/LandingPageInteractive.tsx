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
  const [showModal, setShowModal] = useState(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showModal && visitedTabs.size >= 3) {
        setShowModal(true);
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [visitedTabs, showModal]);

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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Full Transcript</h3>
                <p className="text-slate-400">Searchable transcript with highlight and copy features</p>
              </div>
            </div>
            <TranscriptViewer
              transcript={demoEpisode.transcript || ''}
              episodeTitle={demoEpisode.title}
              episodeId={demoEpisode.episode_id}
              podcastName={demoPodcast.name}
              onTextSelected={() => {}}
              theme="dark"
            />
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Episode Notes</h3>
                <p className="text-slate-400">Save highlights and personal notes while listening</p>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/60 rounded-2xl p-12 text-center">
              <StickyNote className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-6">Sign in to save notes and highlights from episodes</p>
              <button
                onClick={onSignIn}
                className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
              >
                Sign In to Save Notes
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-7 h-7 text-cyan-500" />
              <span className="text-xl font-bold text-white">Augmented Pods</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Interactive Demo</span>
              </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              <img
                src={demoEpisode.image_url}
                alt={demoEpisode.title}
                className="w-32 h-32 rounded-xl shadow-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                      {demoEpisode.title}
                    </h1>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to bring your podcast to life?</h2>
              <p className="text-slate-400">
                Get beautiful, interactive episode pages like this one—automatically generated for every episode
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <p className="text-slate-300">All features auto-generated from your transcript</p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <p className="text-slate-300">Done-for-you setup and ongoing sync</p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <p className="text-slate-300">Live in 48 hours</p>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="w-full px-6 py-3 bg-cyan-500 text-slate-950 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
            >
              Get This For Your Podcast
            </button>
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
