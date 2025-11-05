import { Clock, Calendar, Quote } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Timeline</h3>
          <p className="text-sm text-slate-400">{events.length} key moments</p>
        </div>
      </div>

      {/* Timeline - Scrollable Container */}
      <div className="relative max-h-[600px] overflow-y-auto pr-2">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-blue-500/30"></div>

        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="relative pl-14">
              {/* Timeline dot */}
              <div className="absolute left-0 w-10 h-10 bg-blue-500/10 border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-400 font-semibold text-sm">
                {index + 1}
              </div>

              {/* Event card */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 hover:bg-slate-900/70 transition-colors">
                {/* Date badge */}
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md mb-2">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">
                    {event.date}
                    </span>
                  </div>

                {/* Event title */}
                <h4 className="font-semibold text-white text-base mb-1">
                  {event.event}
                </h4>

                {/* Significance */}
                <p className="text-sm text-slate-300 leading-relaxed mb-2">
                  {event.significance}
                </p>

                {/* Details */}
                {event.details && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-3 mt-2">
                    {event.details}
                  </p>
                )}

                {/* Quotes */}
                {event.quotes && event.quotes.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {event.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className="relative pl-4 border-l-2 border-blue-500/30 bg-slate-800/50 rounded-r-lg p-2">
                        <Quote className="w-3 h-3 text-blue-400/50 absolute top-2 left-1" />
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                          "{quote}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
