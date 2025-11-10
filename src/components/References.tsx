import { Book, Film, Building2, Package, FileText, Globe, Tag } from 'lucide-react';
import type { Reference } from '../services/openaiService';

interface ReferencesProps {
  references: Reference[];
}

const typeIcons = {
  book: Book,
  film: Film,
  company: Building2,
  product: Package,
  article: FileText,
  website: Globe,
  other: Tag,
};

const typeColors = {
  book: 'bg-blue-50 text-blue-700 border-blue-200',
  film: 'bg-purple-50 text-purple-700 border-purple-200',
  company: 'bg-green-50 text-green-700 border-green-200',
  product: 'bg-orange-50 text-orange-700 border-orange-200',
  article: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  website: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};

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
  const groupedReferences = references.reduce((acc, ref) => {
    if (!acc[ref.type]) {
      acc[ref.type] = [];
    }
    acc[ref.type].push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  if (references.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No references found in this episode</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedReferences).map(([type, refs]) => {
        const Icon = typeIcons[type as keyof typeof typeIcons];
        const colorClass = typeColors[type as keyof typeof typeColors];
        const label = typeLabels[type as keyof typeof typeLabels];

        return (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass} border`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-500">{refs.length} reference{refs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {refs.map((ref, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                    <h4 className="font-semibold text-gray-900 mb-2">{ref.name}</h4>
                    {ref.context && (
                      <p className="text-sm text-gray-600 mb-2">{ref.context}</p>
                    )}
                    {ref.quote && (
                      <blockquote className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 mt-2">
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
