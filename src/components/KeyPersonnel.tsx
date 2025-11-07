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

  const colors = [
    { bg: 'bg-teal-600', border: 'border-teal-600', quoteBorder: 'border-teal-600', quoteBg: 'bg-teal-50' },
    { bg: 'bg-emerald-600', border: 'border-emerald-600', quoteBorder: 'border-emerald-600', quoteBg: 'bg-emerald-50' },
    { bg: 'bg-cyan-600', border: 'border-cyan-600', quoteBorder: 'border-cyan-600', quoteBg: 'bg-cyan-50' },
    { bg: 'bg-sky-600', border: 'border-sky-600', quoteBorder: 'border-sky-600', quoteBg: 'bg-sky-50' },
    { bg: 'bg-violet-600', border: 'border-violet-600', quoteBorder: 'border-violet-600', quoteBg: 'bg-violet-50' },
    { bg: 'bg-fuchsia-600', border: 'border-fuchsia-600', quoteBorder: 'border-fuchsia-600', quoteBg: 'bg-fuchsia-50' },
  ];

  const getColor = (index: number) => colors[index % colors.length];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">Key People</h3>
        <p className="text-sm text-slate-600">{personnel.length} people mentioned</p>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personnel.map((person, index) => {
          const color = getColor(index);
          return (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              {/* Name and Role */}
              <div className="mb-3">
                <h4 className="font-semibold text-slate-900 text-base mb-2">{person.name}</h4>
                <span className={`text-xs font-medium text-white ${color.bg} px-2 py-1 rounded-md inline-block`}>
                  {person.role}
                </span>
              </div>

            {/* Relevance */}
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              {person.relevance}
            </p>

            {/* Quotes Section - Collapsible */}
            {person.quotes && person.quotes.length > 0 && (
              <div className="border-t border-slate-200 pt-3">
                <button
                  onClick={() => togglePerson(index)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5" />
                    {person.quotes.length} {person.quotes.length === 1 ? 'quote' : 'quotes'}
                  </span>
                  {expandedPerson === index ? (
                    <ChevronUp className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                  )}
                </button>

                {expandedPerson === index && (
                  <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {person.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className={`relative pl-3 border-l-2 ${color.quoteBorder} ${color.quoteBg} rounded-r-lg p-2`}>
                        <p className="text-xs text-slate-600 italic leading-relaxed">
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
