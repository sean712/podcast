import { Sparkles } from 'lucide-react';

interface EpisodeSummaryProps {
  summary: string;
}

export default function EpisodeSummary({ summary }: EpisodeSummaryProps) {
  if (!summary) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Episode Summary</h3>
          <p className="text-sm text-slate-400">AI-powered insights</p>
        </div>
      </div>

      {/* Summary text */}
      <div className="border-l-2 border-blue-500 pl-4">
        <p className="text-base text-slate-200 leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}
