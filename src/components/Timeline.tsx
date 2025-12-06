import { useState } from 'react';
import { Calendar, Quote, ChevronDown, ChevronUp, Info, Play } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';
import { useAudio } from '../contexts/AudioContext';
import { parseTimestamp, formatTimestamp } from '../utils/timestampUtils';

interface TimelineProps {
  events: TimelineEvent[];
  theme?: 'light' | 'dark';
  currentEpisodeId?: string;
}

export default function Timeline({ events, theme = 'light', currentEpisodeId }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const { currentEpisode, seekTo, setIsPlaying } = useAudio();

  if (events.length === 0) return null;

  const toggleEvent = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index);
  };

  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Timeline container with center line */}
      <div className="relative">
        {/* Center line */}
        <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

        {/* Events */}
        <div className="space-y-8">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = !!(event.significance || event.details || (event.quotes && event.quotes.length > 0));
            const isLeft = index % 2 === 0;

            return (
              <div
                key={index}
                className={`relative flex items-start gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Event card - takes up 47% of the width */}
                <div className="w-[47%]">
                  <div
                    className={`relative rounded-xl p-5 transition-all shadow-md hover:shadow-lg border-2 ${
                      isDark ? 'bg-slate-900/60 border-slate-700 hover:border-teal-500' : 'bg-white border-slate-200 hover:border-teal-500'
                    } ${isExpanded ? 'border-teal-500' : ''} ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => hasDetails && toggleEvent(index)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-600 rounded-lg ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
                        <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-teal-300' : 'text-teal-700'}`} />
                        <span className={`text-sm font-semibold select-text ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                          {event.date}
                        </span>
                      </div>

                      {hasDetails && (
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                          )}
                        </div>
                      )}
                    </div>

                    <h4 className={`font-bold text-base mb-2 leading-tight select-text ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {event.event}
                    </h4>

                    {event.significance && (
                      <p className={`text-sm leading-relaxed select-text ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {event.significance}
                      </p>
                    )}

                    {isExpanded && hasDetails && (
                      <div className={`mt-4 pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                        {event.details && (
                          <div className="flex gap-2">
                            <Info className={`w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5`} />
                            <p className={`text-sm leading-relaxed select-text ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                            {event.quotes.map((quote, qIndex) => {
                              const quoteText = typeof quote === 'string' ? quote : quote.text;
                              const quoteTimestamp = typeof quote === 'object' && quote.timestamp ? quote.timestamp : null;
                              const timestamp = quoteTimestamp ? parseTimestamp(quoteTimestamp) : null;
                              const isPlayable = timestamp !== null && currentEpisodeId === currentEpisode?.episodeId;

                              const handleQuoteClick = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isPlayable && timestamp !== null) {
                                  seekTo(timestamp);
                                  setIsPlaying(true);
                                }
                              };

                              return (
                                <div
                                  key={qIndex}
                                  onClick={handleQuoteClick}
                                  className={`relative pl-3 border-l-2 border-teal-600 rounded-r-lg p-3 ${isDark ? 'bg-teal-900/30' : 'bg-teal-50'} ${
                                    isPlayable ? 'cursor-pointer hover:opacity-80' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-xs italic leading-relaxed select-text ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                      "{quoteText}"
                                    </p>
                                    {isPlayable && (
                                      <div className="flex-shrink-0">
                                        <Play className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" />
                                      </div>
                                    )}
                                  </div>
                                  {isPlayable && timestamp !== null && (
                                    <div className="text-xs font-medium mt-1.5 text-emerald-500">
                                      {formatTimestamp(timestamp)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center dot */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-4 h-4 rounded-full border-4 ${
                    isDark ? 'bg-teal-500 border-slate-900' : 'bg-teal-600 border-white'
                  }`} />
                </div>

                {/* Empty space on the other side */}
                <div className="w-[47%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
