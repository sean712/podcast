import { useState } from 'react';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import type { KeyMoment } from '../services/openaiService';

interface KeyMomentsProps {
  moments: KeyMoment[];
  theme?: 'light' | 'dark';
}

export default function KeyMoments({ moments, theme = 'light' }: KeyMomentsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (moments.length === 0) return null;

  return (
    <div className={`${theme === 'dark' ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-6 shadow-sm`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {moments.map((moment, index) => (
          <div
            key={index}
            className={`${theme === 'dark'
              ? 'bg-slate-900/60 border-slate-700 hover:border-orange-500 hover:bg-slate-900/80'
              : 'bg-slate-50 border-slate-200 hover:border-orange-500 hover:bg-slate-100'
            } rounded-lg p-4 transition-all group`}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={`${theme === 'dark' ? 'bg-orange-500/20 border-orange-400' : 'bg-orange-100 border-orange-400'} w-8 h-8 rounded-full flex items-center justify-center border`}>
                  <span className={`${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'} text-sm font-bold`}>{index + 1}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'} font-semibold text-base mb-2 group-hover:text-orange-500 transition-colors`}>
                  {moment.title}
                  </h4>
                  <span className="mt-0.5">
                    {expandedIndex === index ? (
                      <ChevronUp className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} w-5 h-5`} />
                    ) : (
                      <ChevronDown className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} w-5 h-5`} />
                    )}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {moment.description}
                </p>

                {expandedIndex === index && (
                  <>
                    {moment.quote && (
                      <div className={`${theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50'} relative pl-4 border-l-2 border-orange-400 rounded-r-lg p-3 mt-3`}>
                        <Quote className={`w-3 h-3 ${theme === 'dark' ? 'text-orange-400/70' : 'text-orange-400/50'} absolute top-3 left-1`} />
                        <p className={`text-xs italic leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          "{moment.quote}"
                        </p>
                      </div>
                    )}

                    {moment.timestamp && (
                      <div className={`mt-2 inline-flex items-center px-2 py-1 rounded text-xs border ${theme === 'dark'
                        ? 'bg-orange-500/15 border-orange-400 text-orange-300'
                        : 'bg-orange-100 border-orange-400 text-orange-700'
                      }`}>
                        {moment.timestamp}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
