import { Book, Film, Building2, Package, FileText, Globe, Tag, Play } from 'lucide-react';
import type { Reference } from '../services/openaiService';
import { useAudio } from '../contexts/AudioContext';
import { parseTimestamp, formatTimestamp } from '../utils/timestampUtils';

interface ReferencesProps {
  references: Reference[];
  theme?: 'light' | 'dark';
  currentEpisodeId?: string;
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

export default function References({ references, theme = 'light', currentEpisodeId }: ReferencesProps) {
  const { currentEpisode, seekTo, setIsPlaying } = useAudio();
  const groupedReferences = references.reduce((acc, ref) => {
    if (!acc[ref.type]) {
      acc[ref.type] = [];
    }
    acc[ref.type].push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  if (references.length === 0) {
    return (
      <div className={`${theme === 'dark' ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-12 text-center`}>
        <Tag className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-300'}`} />
        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>No references found in this episode</p>
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
          <div key={type} className={`${theme === 'dark' ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border`}>
            <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'} border-b px-6 py-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700 text-slate-200' : colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{label}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{refs.length} reference{refs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {refs.map((ref, index) => {
                  const timestamp = ref.timestamp ? parseTimestamp(ref.timestamp) : null;
                  const isPlayable = timestamp !== null && currentEpisodeId === currentEpisode?.episodeId;

                  console.log('Reference item:', {
                    name: ref.name,
                    hasTimestamp: !!ref.timestamp,
                    rawTimestamp: ref.timestamp,
                    parsedTimestamp: timestamp,
                    currentEpisodeId,
                    audioEpisodeId: currentEpisode?.episodeId,
                    isPlayable
                  });

                  const handleClick = () => {
                    console.log('Reference clicked:', { ref, timestamp, isPlayable });
                    if (isPlayable && timestamp !== null) {
                      console.log('Seeking to:', timestamp);
                      seekTo(timestamp);
                      setIsPlaying(true);
                    }
                  };

                  return (
                    <div
                      key={index}
                      onClick={handleClick}
                      className={`rounded-xl p-5 transition-all border ${
                        isPlayable ? 'cursor-pointer' : ''
                      } ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className={`font-semibold text-base mb-2.5 leading-snug ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{ref.name}</h4>
                        {isPlayable && (
                          <div className={`flex-shrink-0 p-1.5 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Play className="w-4 h-4" fill="currentColor" />
                          </div>
                        )}
                      </div>
                      {ref.context && (
                        <p className={`text-sm mb-3 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{ref.context}</p>
                      )}
                      {ref.quote && (
                        <blockquote className={`text-sm italic border-l-2 pl-3.5 mt-3 leading-relaxed ${theme === 'dark' ? 'text-slate-400 border-slate-600' : 'text-gray-500 border-gray-300'}`}>
                          "{ref.quote}"
                        </blockquote>
                      )}
                      {isPlayable && timestamp !== null && (
                        <div className={`text-xs font-medium mt-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatTimestamp(timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
