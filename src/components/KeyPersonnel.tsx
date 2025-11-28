import { useState } from 'react';
import { Quote, ChevronDown, ChevronUp, Play } from 'lucide-react';
import type { KeyPerson } from '../services/openaiService';
import { useAudio } from '../contexts/AudioContext';
import { parseTimestamp, formatTimestamp } from '../utils/timestampUtils';

interface KeyPersonnelProps {
  personnel: KeyPerson[];
  theme?: 'light' | 'dark';
  currentEpisodeId?: string;
}

export default function KeyPersonnel({ personnel, theme = 'light', currentEpisodeId }: KeyPersonnelProps) {
  const [expandedPerson, setExpandedPerson] = useState<number | null>(null);
  const { currentEpisode, seekTo, setIsPlaying } = useAudio();

  if (personnel.length === 0) return null;

  const togglePerson = (index: number) => {
    setExpandedPerson(expandedPerson === index ? null : index);
  };

  const colors = [
    { bg: 'bg-teal-600', border: 'border-teal-600', quoteBorder: 'border-teal-600', quoteBg: 'bg-teal-50' },
    { bg: 'bg-emerald-600', border: 'border-emerald-600', quoteBorder: 'border-emerald-600', quoteBg: 'bg-emerald-50' },
    { bg: 'bg-cyan-600', border: 'border-cyan-600', quoteBorder: 'border-cyan-600', quoteBg: 'bg-cyan-50' },
    { bg: 'bg-sky-600', border: 'border-sky-600', quoteBorder: 'border-sky-600', quoteBg: 'bg-sky-50' },
    { bg: 'bg-violet-600', border: 'border-violet-600', quoteBorder: 'border-violet-600', quoteBg: 'bg-violet-50' },
    { bg: 'bg-fuchsia-600', border: 'border-fuchsia-600', quoteBorder: 'border-fuchsia-600', quoteBg: 'bg-fuchsia-50' },
  ];

  const getColor = (index: number) => colors[index % colors.length];

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {personnel.map((person, index) => {
          const color = getColor(index);
          return (
            <div
              key={index}
              className={`${isDark
                ? 'bg-slate-900/60 border-slate-700 hover:bg-slate-900/80 hover:border-slate-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              } border rounded-xl p-6 transition-all shadow-sm`}
            >
              {/* Name and Role */}
              <div className="mb-4">
                <h4 className={`font-semibold text-lg mb-2.5 leading-snug select-text ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{person.name}</h4>
                <span className={`text-sm font-medium text-white ${color.bg} px-3 py-1.5 rounded-md inline-block select-text`}>
                  {person.role}
                </span>
              </div>

            {/* Relevance */}
            <p className={`text-sm leading-relaxed mb-3 select-text ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {person.relevance}
            </p>

            {/* Quotes Section - Collapsible */}
            {person.quotes && person.quotes.length > 0 && (
              <div className={`pt-3 ${isDark ? 'border-t border-slate-700/70' : 'border-t border-slate-200'}`}>
                <button
                  onClick={() => togglePerson(index)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    <Quote className="w-3.5 h-3.5" />
                    {person.quotes.length} {person.quotes.length === 1 ? 'quote' : 'quotes'}
                  </span>
                  {expandedPerson === index ? (
                    <ChevronUp className={`w-4 h-4 ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`} />
                  )}
                </button>

                {expandedPerson === index && person.quotes && person.quotes.length > 0 && (
                  <div className="space-y-2.5 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {person.quotes.map((quote, qIndex) => {
                      const quoteText = typeof quote === 'string' ? quote : quote.text;
                      const quoteTimestamp = typeof quote === 'object' && quote.timestamp ? quote.timestamp : null;
                      const timestamp = quoteTimestamp ? parseTimestamp(quoteTimestamp) : null;
                      const isPlayable = timestamp !== null && currentEpisodeId === currentEpisode?.episodeId;

                      const handleQuoteClick = () => {
                        if (isPlayable && timestamp !== null) {
                          seekTo(timestamp);
                          setIsPlaying(true);
                        }
                      };

                      return (
                        <div
                          key={qIndex}
                          onClick={handleQuoteClick}
                          className={`relative pl-4 border-l-2 ${color.quoteBorder} ${isDark ? 'bg-slate-800/60' : color.quoteBg} rounded-r-lg p-3 ${
                            isPlayable ? 'cursor-pointer hover:opacity-80' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm italic leading-relaxed select-text ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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
          );
        })}
      </div>
    </div>
  );
}
