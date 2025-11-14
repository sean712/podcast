
interface EpisodeSummaryProps {
  summary: string;
  theme?: 'light' | 'dark';
}

export default function EpisodeSummary({ summary, theme = 'light' }: EpisodeSummaryProps) {
  if (!summary) return null;

  const isDark = theme === 'dark';

  return (
    <div className={`${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-6 shadow-sm`}>
      <div className="border-l-4 border-emerald-500 pl-4">
        <p className={`text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {summary}
        </p>
      </div>
    </div>
  );
}
