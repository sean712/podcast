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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-teal-600 -ml-px hidden md:block"></div>

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
                <div
                  className={`w-full md:w-5/12 ${
                    isLeft ? 'md:pr-12' : 'md:pl-12 md:ml-auto'
                  } pl-12 md:pl-0`}
                >
                  <button
                    onClick={() => hasDetails && toggleEvent(index)}
                    className={`w-full text-left bg-white border-2 border-slate-200 rounded-xl p-5 transition-all shadow-md hover:shadow-lg ${
                      hasDetails ? 'hover:border-teal-500 cursor-pointer' : 'cursor-default'
                    } ${isExpanded ? 'border-teal-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 border border-teal-600 rounded-lg mb-3">
                          <Calendar className="w-3.5 h-3.5 text-teal-700" />
                          <span className="text-sm font-semibold text-teal-700">
                            {event.date}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg mb-2 leading-tight">
                          {event.event}
                        </h4>

                        <p className="text-sm text-slate-700 leading-relaxed">
                          {event.significance}
                        </p>
                      </div>

                      {hasDetails && (
                        <div className="flex-shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && hasDetails && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {event.details && (
                          <div className="flex gap-2">
                            <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {event.details}
                            </p>
                          </div>
                        )}

                        {event.quotes && event.quotes.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <Quote className="w-3.5 h-3.5" />
                              <span>Related quotes</span>
                            </div>
                            {event.quotes.map((quote, qIndex) => (
                              <div key={qIndex} className="relative pl-3 border-l-2 border-teal-600 bg-teal-50 rounded-r-lg p-3">
                                <p className="text-xs text-slate-600 italic leading-relaxed">
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

                <div className="absolute left-4 md:left-1/2 w-10 h-10 bg-teal-600 border-4 border-white rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-10 md:-ml-5">
                  {index + 1}
                </div>

                <div
                  className={`hidden md:block absolute top-5 w-8 h-0.5 bg-teal-600 ${
                    isLeft ? 'left-1/2 ml-5' : 'right-1/2 mr-5'
                  }`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
