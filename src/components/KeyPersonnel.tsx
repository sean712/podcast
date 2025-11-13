import { useState } from 'react';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import type { KeyPerson } from '../services/openaiService';

interface KeyPersonnelProps {
  personnel: KeyPerson[];
}

export default function KeyPersonnel({ personnel }: KeyPersonnelProps) {
  const [expandedPerson, setExpandedPerson] = useState<number | null>(null);

  if (personnel.length === 0) return null;

  const togglePerson = (index: number) => {
    setExpandedPerson(expandedPerson === index ? null : index);
  };

  // A new color palette specifically designed for the dark theme.
  const darkColors = [
    { bg: 'bg-teal-500', quoteBorder: 'border-teal-500', quoteBg: 'bg-teal-900/40', quoteText: 'text-teal-200' },
    { bg: 'bg-emerald-500', quoteBorder: 'border-emerald-500', quoteBg: 'bg-emerald-900/40', quoteText: 'text-emerald-200' },
    { bg: 'bg-cyan-500', quoteBorder: 'border-cyan-500', quoteBg: 'bg-cyan-900/40', quoteText: 'text-cyan-200' },
    { bg: 'bg-sky-500', quoteBorder: 'border-sky-500', quoteBg: 'bg-sky-900/40', quoteText: 'text-sky-200' },
    { bg: 'bg-violet-500', quoteBorder: 'border-violet-500', quoteBg: 'bg-violet-900/40', quoteText: 'text-violet-200' },
    { bg: 'bg-fuchsia-500', quoteBorder: 'border-fuchsia-500', quoteBg: 'bg-fuchsia-900/40', quoteText: 'text-fuchsia-200' },
  ];

  const getColor = (index: number) => darkColors[index % darkColors.length];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personnel.map((person, index) => {
          const color = getColor(index);
          return (
            // Card styling updated for the dark theme.
            <div
              key={index}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-800/60 transition-all shadow-lg"
            >
              {/* Name and Role with updated text colors. */}
              <div className="mb-3">
                <h4 className="font-semibold text-slate-100 text-base mb-2">{person.name}</h4>
                <span className={`text-xs font-bold text-slate-950 ${color.bg} px-2 py-1 rounded-md inline-block`}>
                  {person.role}
                </span>
              </div>

            {/* Relevance text color updated for readability. */}
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              {person.relevance}
            </p>

            {/* Quotes Section - Collapsible, restyled for dark theme. */}
            {person.quotes && person.quotes.length > 0 && (
              <div className="border-t border-slate-700/60 pt-3">
                <button
                  onClick={() => togglePerson(index)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className="text-xs font-medium text-slate-400 group-hover:text-white flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5" />
                    {person.quotes.length} {person.quotes.length === 1 ? 'quote' : 'quotes'}
                  </span>
                  {expandedPerson === index ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  )}
                </button>

                {expandedPerson === index && (
                  <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {person.quotes.map((quote, qIndex) => (
                      // Quote block using the new dark color palette.
                      <div key={qIndex} className={`relative pl-3 border-l-2 ${color.quoteBorder} ${color.quoteBg} rounded-r-lg p-2`}>
                        <p className={`text-xs ${color.quoteText} italic leading-relaxed`}>
                          "{quote}"
                        </p>
                      </div>
                    ))}
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