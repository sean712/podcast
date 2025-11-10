import { useState } from 'react';
import { Clock, Calendar, Quote, ChevronDown, ChevronUp, Info } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-teal-600"></div>

        <div className="space-y-3">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = event.details || (event.quotes && event.quotes.length > 0);

            return (
              <div key={index} className="relative pl-14">
                {/* Timeline dot */}
                <div className="absolute left-0 w-10 h-10 bg-teal-600 border-2 border-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Event card - Clickable */}
                <button
                  onClick={() => hasDetails && toggleEvent(index)}
                  className={`w-full text-left bg-white border border-slate-200 rounded-lg p-4 transition-all shadow-sm ${
                    hasDetails ? 'hover:border-slate-300 hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Date badge */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-100 border border-teal-600 rounded-md mb-2">
                        <Calendar className="w-3 h-3 text-teal-700" />
                        <span className="text-xs font-medium text-teal-700">
                          {event.date}
                        </span>
                      </div>

                      {/* Event title */}
                      <h4 className="font-semibold text-slate-900 text-base mb-2">
                        {event.event}
                      </h4>

                      {/* Significance - always visible but compact */}
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {event.significance}
                      </p>
                    </div>

                    {/* Expand/Collapse icon */}
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

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Details */}
                      {event.details && (
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {event.details}
                          </p>
                        </div>
                      )}

                      {/* Quotes */}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
