import { Book, Film, Building2, Package, FileText, Globe, Tag } from 'lucide-react';
import type { Reference } from '../services/openaiService';

interface ReferencesProps {
  references: Reference[];
}

// Icon mapping remains the same.
const typeIcons = {
  book: Book,
  film: Film,
  company: Building2,
  product: Package,
  article: FileText,
  website: Globe,
  other: Tag,
};

// A new color palette specifically designed for the dark theme.
const darkTypeColors = {
  book: { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-500/30' },
  film: { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-500/30' },
  company: { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-500/30' },
  product: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/30' },
  article: { bg: 'bg-cyan-900/40', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  website: { bg: 'bg-indigo-900/40', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  other: { bg: 'bg-slate-700/40', text: 'text-slate-300', border: 'border-slate-500/30' },
};

// Label mapping remains the same.
const typeLabels = {
  book: 'Book',
  film: 'Film/TV',
  company: 'Company',
  product: 'Product',
  article: 'Article',
  website: 'Website',
  other: 'Other',
};

export default function References({ references }: ReferencesProps) {
  // Grouping logic is unchanged.
  const groupedReferences = references.reduce((acc, ref) => {
    const typeKey = ref.type in typeIcons ? ref.type : 'other';
    if (!acc[typeKey]) {
      acc[typeKey] = [];
    }
    acc[typeKey].push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  // "No References" state, restyled for the dark theme.
  if (references.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl shadow-lg border border-slate-800 p-12 text-center">
        <Tag className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-500">No references found in this episode</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedReferences).map(([type, refs]) => {
        const Icon = typeIcons[type as keyof typeof typeIcons];
        const colors = darkTypeColors[type as keyof typeof darkTypeColors];
        const label = typeLabels[type as keyof typeof typeLabels];

        return (
          // Main container for each reference type section.
          <div key={type} className="bg-slate-900/50 rounded-xl shadow-lg border border-slate-800">
            {/* Section Header */}
            <div className="border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{label}</h3>
                  <p className="text-sm text-slate-400">{refs.length} reference{refs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            {/* Grid of reference cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {refs.map((ref, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg p-4 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800/80 transition-all">
                    <h4 className="font-semibold text-slate-200 mb-2">{ref.name}</h4>
                    {ref.context && (
                      <p className="text-sm text-slate-400 mb-2">{ref.context}</p>
                    )}
                    {ref.quote && (
                      <blockquote className="text-xs text-slate-400 italic border-l-2 border-slate-600 pl-3 mt-2">
                        "{ref.quote}"
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}