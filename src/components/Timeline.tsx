import { useState } from 'react';
import { Calendar, Quote, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';

interface TimelineProps {
  events: TimelineEvent[];
  theme?: 'light' | 'dark';
}

export default function Timeline({ events, theme = 'light' }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  if (events.length === 0) return null;

  const toggleEvent = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index);
  };

  const isDark = theme === 'dark';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative">
        <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 -ml-px hidden md:block ${isDark ? 'bg-teal-500' : 'bg-teal-600'}`}></div>

        <div className="space-y-12">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = !!(event.significance || event.details || (event.quotes && event.quotes.length > 0));
            const isLeft = index % 2 === 0;
            const detailsInner = (
              <>
                {event.details && (
                  <div className="flex gap-2">
                    <Info className={`w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5`} />
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {event.details}
                    </p>
                  </div>
                )}

                {event.quotes && event.quotes.length > 0 && (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Quote className="w-3.5 h-3.5" />
                      <span>Related quotes</span>
                    </div>
                    {event.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className={`relative pl-3 border-l-2 border-teal-600 rounded-r-lg p-3 ${isDark ? 'bg-teal-900/30' : 'bg-teal-50'}`}>
                        <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          "{quote}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );

            return (
              <div
                key={index}
                className={`relative flex items-center ${
                  isLeft ? 'md:justify-start' : 'md:justify-end'
                } justify-start`}
              >
                <div
                  className={`w-full md:w-6/12 ${
                    isLeft ? 'md:pr-12' : 'md:pl-12 md:ml-auto'
                  } pl-12 md:pl-0`}
                >
                  <button
                    onClick={() => hasDetails && toggleEvent(index)}
                    className={`w-full text-left rounded-xl p-5 transition-all shadow-md hover:shadow-lg border-2 ${
                      isDark ? 'bg-slate-900/60 border-slate-700 hover:border-teal-500' : 'bg-white border-slate-200 hover:border-teal-500'
                    } ${hasDetails ? 'cursor-pointer' : 'cursor-default'} ${isExpanded ? 'border-teal-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-600 rounded-lg mb-3 ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
                          <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-teal-300' : 'text-teal-700'}`} />
                          <span className={`text-sm font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                            {event.date}
                          </span>
                        </div>

                        <h4 className={`font-bold text-lg mb-2 leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {event.event}
                        </h4>

                        {isExpanded && event.significance && (
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {event.significance}
                          </p>
                        )}
                      </div>

                      {hasDetails && (
                        <div className="flex-shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && hasDetails && (
                      <div className={`mt-4 pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 md:hidden ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                        {detailsInner}
                      </div>
                    )}
                  </button>
                </div>

                <div className={`absolute left-4 md:left-1/2 w-10 h-10 bg-teal-600 border-4 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-10 md:-ml-5 ${isDark ? 'border-slate-900' : 'border-white'}`}>
                  {index + 1}
                </div>

                <div
                  className={`hidden md:block absolute top-5 w-8 h-0.5 bg-teal-600 ${
                    isLeft ? 'left-1/2 ml-5' : 'right-1/2 mr-5'
                  }`}
                ></div>

                {isExpanded && hasDetails && (
                  <div
                    className={`hidden md:block absolute top-0 z-20 ${
                      isLeft ? 'left-1/2 ml-8' : 'right-1/2 mr-8'
                    }`}
                  >
                    <div
                      className={`w-[min(32rem,calc(50%-3rem))] rounded-xl p-5 border-2 shadow-xl ${
                        isDark ? 'bg-slate-900/80 border-slate-700/70' : 'bg-white/95 border-slate-200'
                      }`}
                    >
                      {detailsInner}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
