import { Users, User } from 'lucide-react';
import type { KeyPerson } from '../services/openaiService';

interface KeyPersonnelProps {
  personnel: KeyPerson[];
}

export default function KeyPersonnel({ personnel }: KeyPersonnelProps) {
  if (personnel.length === 0) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Key Personnel</h3>
          <p className="text-sm text-slate-400">{personnel.length} people mentioned</p>
        </div>
      </div>

      {/* Personnel Cards - Scrollable */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {personnel.map((person, index) => (
          <div
            key={index}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 hover:bg-slate-900/70 transition-colors"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <h4 className="font-semibold text-white text-base">{person.name}</h4>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-medium text-slate-400">{person.role}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {person.relevance}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
