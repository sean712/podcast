import { useState } from 'react';
import { Calendar, Quote, ChevronDown, ChevronUp, Info, Play, Globe, Eye, EyeOff } from 'lucide-react';
import type { TimelineEvent } from '../services/openaiService';
import { useAudio } from '../contexts/AudioContext';
import { parseTimestamp, formatTimestamp } from '../utils/timestampUtils';

interface TimelineProps {
  events: TimelineEvent[];
  theme?: 'light' | 'dark';
  currentEpisodeId?: string;
  worldEvents?: Array<{ date: string; event: string; category: string }>;
}

export default function Timeline({ events, theme = 'light', currentEpisodeId, worldEvents = [] }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [showWorldEvents, setShowWorldEvents] = useState(false);
  const { currentEpisode, seekTo, setIsPlaying } = useAudio();

  if (events.length === 0) return null;

  const toggleEvent = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index);
  };

  const isDark = theme === 'dark';

  const getWorldEventsForDate = (date: string) => {
    return worldEvents.filter(we => we.date === date);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {worldEvents.length > 0 && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowWorldEvents(!showWorldEvents)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            {showWorldEvents ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showWorldEvents ? 'Hide' : 'Show'} Parallel World Events
            </span>
            <Globe className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="relative">
        <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 -ml-px hidden md:block ${isDark ? 'bg-teal-500' : 'bg-teal-600'}`}></div>

        <div className="space-y-12">
          {events.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const hasDetails = !!(event.significance || event.details || (event.quotes && event.quotes.length > 0));
            const isLeft = index % 2 === 0;
            const relatedWorldEvents = showWorldEvents ? getWorldEventsForDate(event.date) : [];

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
                      <div className={`mt-4 pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
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
                                    <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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

                {relatedWorldEvents.length > 0 && (
                  <>
                    <div
                      className={`hidden md:block w-full md:w-6/12 ${
                        isLeft ? 'md:pl-12 md:mr-auto' : 'md:pr-12'
                      }`}
                    >
                      <div className={`rounded-xl p-4 transition-all border ${isDark ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            World Events
                          </span>
                        </div>
                        <div className="space-y-2">
                          {relatedWorldEvents.map((worldEvent, weIndex) => (
                            <div key={weIndex} className="flex items-start gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                              <div>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {worldEvent.event}
                                </p>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                  {worldEvent.category}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`hidden md:block absolute top-5 w-8 h-0.5 border-t-2 border-dotted ${isDark ? 'border-slate-600' : 'border-slate-400'} ${
                        isLeft ? 'right-1/2 mr-5' : 'left-1/2 ml-5'
                      }`}
                    ></div>

                    <div className={`hidden md:block absolute ${
                      isLeft ? 'right-1/2 mr-1' : 'left-1/2 ml-1'
                    } top-5 w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700 border-2 border-slate-600' : 'bg-slate-200 border-2 border-slate-300'}`}>
                      <Globe className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
