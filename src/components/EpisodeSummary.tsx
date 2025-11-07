
interface EpisodeSummaryProps {
  summary: string;
}

export default function EpisodeSummary({ summary }: EpisodeSummaryProps) {
  if (!summary) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Episode Summary</h3>
        <p className="text-sm text-slate-600">AI-powered insights</p>
      </div>

      {/* Summary text */}
      <div className="border-l-4 border-emerald-600 pl-4">
        <p className="text-base text-slate-700 leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}
