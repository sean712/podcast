import { Zap, Quote } from 'lucide-react';
import type { KeyMoment } from '../services/openaiService';

interface KeyMomentsProps {
  moments: KeyMoment[];
}

export default function KeyMoments({ moments }: KeyMomentsProps) {
  if (moments.length === 0) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Key Moments</h3>
          <p className="text-sm text-slate-400">{moments.length} highlights from this episode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {moments.map((moment, index) => (
          <div
            key={index}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-amber-500/50 hover:bg-slate-900/70 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
                  <span className="text-sm font-bold text-amber-400">{index + 1}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-base mb-2 group-hover:text-amber-300 transition-colors">
                  {moment.title}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  {moment.description}
                </p>

                {moment.quote && (
                  <div className="relative pl-4 border-l-2 border-amber-500/30 bg-slate-800/50 rounded-r-lg p-3 mt-3">
                    <Quote className="w-3 h-3 text-amber-400/50 absolute top-3 left-1" />
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      "{moment.quote}"
                    </p>
                  </div>
                )}

                {moment.timestamp && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
                    {moment.timestamp}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
