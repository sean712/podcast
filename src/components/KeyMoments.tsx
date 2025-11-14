import { Quote } from 'lucide-react';
import type { KeyMoment } from '../services/openaiService';

interface KeyMomentsProps {
  moments: KeyMoment[];
}

export default function KeyMoments({ moments }: KeyMomentsProps) {
  if (moments.length === 0) return null;

  return (
    // Restored the grid layout with a gap between cards.
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {moments.map((moment, index) => (
        <div
          key={index}
          // Each moment is now a distinct card within the grid.
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-orange-500 hover:bg-slate-800/60 transition-all shadow-lg group"
        >
          <div className="flex items-start gap-4">
            {/* Numbering styled to match the map's location markers. */}
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-slate-900">
              <span className="text-sm font-bold text-white">{index + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Title and description with colors appropriate for a dark theme. */}
              <h4 className="font-bold text-base text-slate-100 mb-2 group-hover:text-orange-300 transition-colors">
                {moment.title}
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                {moment.description}
              </p>

              {/* Quote block restyled for the dark theme. */}
              {moment.quote && (
                <div className="relative pl-4 border-l-2 border-orange-500 bg-slate-800/60 rounded-r-lg p-3 mt-4">
                  <Quote className="w-4 h-4 text-orange-500/50 absolute top-3 left-[-9px]" />
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "{moment.quote}"
                  </p>
                </div>
              )}

              {/* Timestamp tag with updated dark theme styling. */}
              {moment.timestamp && (
                <div className="mt-4 inline-flex items-center px-2.5 py-1 bg-slate-700/80 border border-slate-600/70 rounded-full text-xs font-medium text-slate-300">
                  {moment.timestamp}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}