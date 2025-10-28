import { Users, User } from 'lucide-react';
import type { KeyPerson } from '../services/openaiService';

interface KeyPersonnelProps {
  personnel: KeyPerson[];
}

export default function KeyPersonnel({ personnel }: KeyPersonnelProps) {
  if (personnel.length === 0) return null;

  return (
    <div className="relative group">
      {/* Animated gradient background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-md opacity-50" />
            <div className="relative p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Key Personnel</h3>
            <p className="text-sm text-slate-400">{personnel.length} people mentioned</p>
          </div>
        </div>

        {/* Personnel Cards */}
        <div className="space-y-4">
          {personnel.map((person, index) => (
            <div
              key={index}
              className="group/card relative bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

              <div className="relative flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-2">
                    <h4 className="font-bold text-white text-lg">{person.name}</h4>
                    <span className="text-slate-500">•</span>
                    <span className="text-sm font-medium text-purple-400">{person.role}</span>
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
    </div>
  );
}
