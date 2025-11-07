import { Quote } from 'lucide-react';
import type { KeyMoment } from '../services/openaiService';

interface KeyMomentsProps {
  moments: KeyMoment[];
}

export default function KeyMoments({ moments }: KeyMomentsProps) {
  if (moments.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Key Moments</h3>
        <p className="text-sm text-slate-600">{moments.length} highlights from this episode</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {moments.map((moment, index) => (
          <div
            key={index}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-orange-500 hover:bg-slate-100 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center border border-orange-400">
                  <span className="text-sm font-bold text-orange-700">{index + 1}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-base mb-2 group-hover:text-orange-600 transition-colors">
                  {moment.title}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {moment.description}
                </p>

                {moment.quote && (
                  <div className="relative pl-4 border-l-2 border-orange-400 bg-orange-50 rounded-r-lg p-3 mt-3">
                    <Quote className="w-3 h-3 text-orange-400/50 absolute top-3 left-1" />
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{moment.quote}"
                    </p>
                  </div>
                )}

                {moment.timestamp && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-orange-100 border border-orange-400 rounded text-xs text-orange-700">
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
