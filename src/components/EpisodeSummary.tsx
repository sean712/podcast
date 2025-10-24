import { FileText } from 'lucide-react';

interface EpisodeSummaryProps {
  summary: string;
}

export default function EpisodeSummary({ summary }: EpisodeSummaryProps) {
  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <FileText className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">TL;DR Summary</h3>
      </div>
      <p className="text-slate-700 leading-relaxed text-base">{summary}</p>
    </div>
  );
}
