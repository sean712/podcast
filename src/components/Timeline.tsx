import { Clock, Calendar } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="relative group">
      {/* Animated gradient background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-md opacity-50" />
            <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Timeline</h3>
            <p className="text-sm text-slate-400">{events.length} key moments</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line with gradient */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-500"></div>

          <div className="space-y-8">
            {events.map((event, index) => (
              <div key={index} className="relative pl-16 group/item">
                {/* Timeline dot */}
                <div className="absolute left-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-slate-800 shadow-lg shadow-emerald-500/30 group-hover/item:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>

                {/* Event card */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group-hover/item:translate-x-1">
                  {/* Date badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">
                      {event.date}
                    </span>
                  </div>

                  {/* Event title */}
                  <h4 className="font-bold text-white text-lg mb-2">
                    {event.event}
                  </h4>

                  {/* Significance */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {event.significance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
