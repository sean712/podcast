import { Play, Volume2 } from 'lucide-react';

interface DemoAudioPlayerStaticProps {
  episodeTitle: string;
  podcastName: string;
  duration: number;
}

export default function DemoAudioPlayerStatic({ episodeTitle, podcastName, duration }: DemoAudioPlayerStaticProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const demoProgress = 35;

  return (
    <div className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            disabled
            className="w-12 h-12 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 cursor-not-allowed"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{episodeTitle}</p>
                <p className="text-xs text-slate-400 truncate">{podcastName}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                <div className="w-2 h-2 bg-slate-500 rounded-full" />
                <span className="text-xs text-slate-400 font-medium">Demo Mode</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 tabular-nums">
                {formatTime((duration * demoProgress) / 100)}
              </span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-not-allowed">
                <div
                  className="h-full bg-cyan-500/50 rounded-full"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-slate-400" />
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-not-allowed">
              <div className="h-full bg-slate-600 rounded-full" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
