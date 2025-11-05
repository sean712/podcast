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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Timeline</h3>
          <p className="text-sm text-slate-400">{events.length} key moments</p>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-blue-500/30"></div>

        <div className="space-y-3">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = event.details || (event.quotes && event.quotes.length > 0);

            return (
              <div key={index} className="relative pl-14">
                {/* Timeline dot */}
                <div className="absolute left-0 w-10 h-10 bg-blue-500/10 border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-400 font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Event card - Clickable */}
                <button
                  onClick={() => hasDetails && toggleEvent(index)}
                  className={`w-full text-left bg-slate-800/30 border border-slate-700 rounded-lg p-4 transition-all ${
                    hasDetails ? 'hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Date badge */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md mb-2">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">
                          {event.date}
                        </span>
                      </div>

                      {/* Event title */}
                      <h4 className="font-semibold text-white text-base mb-2">
                        {event.event}
                      </h4>

                      {/* Significance - always visible but compact */}
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {event.significance}
                      </p>
                    </div>

                    {/* Expand/Collapse icon */}
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

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Details */}
                      {event.details && (
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {event.details}
                          </p>
                        </div>
                      )}

                      {/* Quotes */}
                      {event.quotes && event.quotes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Quote className="w-3.5 h-3.5" />
                            <span>Related quotes</span>
                          </div>
                          {event.quotes.map((quote, qIndex) => (
                            <div key={qIndex} className="relative pl-3 border-l-2 border-blue-500/30 bg-slate-900/50 rounded-r-lg p-3">
                              <p className="text-xs text-slate-400 italic leading-relaxed">
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
