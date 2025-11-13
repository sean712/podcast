import { useState } from 'react';
import { Calendar, Quote, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  if (events.length === 0) return null;

  const toggleEvent = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative">
        {/* The central timeline axis, restyled for the dark theme. */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 -ml-px hidden md:block" aria-hidden="true"></div>

        <div className="space-y-12">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = event.details || (event.quotes && event.quotes.length > 0);
            const isLeft = index % 2 === 0;

            return (
              <div
                key={index}
                className={`relative flex items-center ${
                  isLeft ? 'md:justify-start' : 'md:justify-end'
                } justify-start`}
              >
                {/* Timeline Card Container */}
                <div
                  className={`w-full md:w-5/12 ${
                    isLeft ? 'md:pr-12' : 'md:pl-12 md:ml-auto'
                  } pl-12 md:pl-0`}
                >
                  <button
                    onClick={() => hasDetails && toggleEvent(index)}
                    className={`w-full text-left bg-slate-900/50 border border-slate-800 rounded-xl p-5 transition-all shadow-lg ${
                      hasDetails ? 'hover:border-cyan-500 cursor-pointer' : 'cursor-default'
                    } ${isExpanded ? 'border-cyan-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Date Tag */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-cyan-500/30 rounded-lg mb-3">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-sm font-semibold text-cyan-300">
                            {event.date}
                          </span>
                        </div>

                        {/* Event Title and Significance */}
                        <h4 className="font-bold text-slate-100 text-lg mb-2 leading-tight">
                          {event.event}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {event.significance}
                        </p>
                      </div>

                      {/* Chevron Icon for toggling */}
                      {hasDetails && (
                        <div className="flex-shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Collapsible Details Section */}
                    {isExpanded && hasDetails && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {event.details && (
                          <div className="flex gap-2.5">
                            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {event.details}
                            </p>
                          </div>
                        )}

                        {event.quotes && event.quotes.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                              <Quote className="w-3.5 h-3.5" />
                              <span>Related quotes</span>
                            </div>
                            {event.quotes.map((quote, qIndex) => (
                              <div key={qIndex} className="relative pl-3 border-l-2 border-cyan-500 bg-slate-800/70 rounded-r-lg p-3">
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                  "{quote}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>

                {/* Timeline Number Marker */}
                <div className="absolute left-4 md:left-1/2 w-10 h-10 bg-cyan-500 border-4 border-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-10 md:-ml-5">
                  {index + 1}
                </div>

                {/* Horizontal connector from axis to card (desktop only) */}
                <div
                  className={`hidden md:block absolute top-5 w-8 h-0.5 bg-slate-700 ${
                    isLeft ? 'left-1/2 ml-5' : 'right-1/2 mr-5'
                  }`}
                  aria-hidden="true"
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}