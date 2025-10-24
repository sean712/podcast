import { Users } from 'lucide-react';
import type { KeyPerson } from '../services/openaiService';

interface KeyPersonnelProps {
  personnel: KeyPerson[];
}

export default function KeyPersonnel({ personnel }: KeyPersonnelProps) {
  if (personnel.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 rounded-xl shadow-sm border border-cyan-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <Users className="w-5 h-5 text-cyan-600" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">Key Personnel</h3>
      </div>
      <div className="space-y-4">
        {personnel.map((person, index) => (
          <div
            key={index}
            className="border-l-4 border-cyan-400 pl-4 py-2 bg-white/50 rounded-r-lg"
          >
            <div className="flex items-baseline gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{person.name}</h4>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm font-medium text-cyan-600">{person.role}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {person.relevance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
