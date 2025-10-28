import { Sparkles } from 'lucide-react';

interface EpisodeSummaryProps {
  summary: string;
}

export default function EpisodeSummary({ summary }: EpisodeSummaryProps) {
  if (!summary) return null;

  return (
    <div className="relative group">
      {/* Animated gradient background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl blur-md opacity-50" />
            <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Episode Summary</h3>
            <p className="text-sm text-slate-400">AI-powered insights</p>
          </div>
        </div>

        {/* Summary text with magazine-style typography */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <p className="text-lg text-slate-200 leading-relaxed pl-4 font-light">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
