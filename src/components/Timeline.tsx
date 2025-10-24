import { Clock } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 rounded-xl shadow-sm border border-teal-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Clock className="w-5 h-5 text-teal-600" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">Timeline of Events</h3>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 to-emerald-200"></div>
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative pl-10">
              <div className="absolute left-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border-4 border-white shadow-md">
                {index + 1}
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-slate-100">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-semibold text-teal-600">
                    {event.date}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {event.event}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {event.significance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
