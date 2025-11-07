import { useState } from 'react';
import { Users, User, Quote, ChevronDown, ChevronUp } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">Key People</h3>
        <p className="text-sm text-slate-600">{personnel.length} people mentioned</p>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personnel.map((person, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            {/* Avatar and Name */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-base mb-1 line-clamp-2">{person.name}</h4>
                <span className="text-xs font-medium text-white bg-blue-600 px-2 py-1 rounded-md inline-block">
                  {person.role}
                </span>
              </div>
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
                      <div key={qIndex} className="relative pl-3 border-l-2 border-blue-600 bg-blue-50 rounded-r-lg p-2">
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
        ))}
      </div>
    </div>
  );
}
