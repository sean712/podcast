import { useState, useMemo, useRef } from 'react';
import { Copy, Search, X, Check, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: string;
  episodeTitle: string;
  onTextSelected?: (text: string) => void;
}

export default function TranscriptViewer({ transcript, episodeTitle, onTextSelected }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showCreateNoteButton, setShowCreateNoteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const paragraphs = useMemo(() => {
    if (!transcript) return [];
    return transcript.split('\n\n').filter(p => p.trim());
  }, [transcript]);

  const highlightedParagraphs = useMemo(() => {
    if (!searchQuery.trim()) return paragraphs;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return paragraphs.map(p => ({
      text: p,
      highlighted: p.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
    }));
  }, [paragraphs, searchQuery]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      const container = containerRef.current;

      if (rect && container) {
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        const relativeTop = rect.bottom - containerRect.top + scrollTop + 8;
        const relativeLeft = Math.max(
          10,
          Math.min(
            rect.left - containerRect.left + (rect.width / 2) - 75,
            containerRect.width - 160
          )
        );

        setButtonPosition({
          top: relativeTop,
          left: relativeLeft
        });
        setShowCreateNoteButton(true);
      }
    } else {
      setShowCreateNoteButton(false);
    }
  };

  const handleCreateNote = () => {
    if (onTextSelected && selectedText) {
      onTextSelected(selectedText);
    }
    setShowCreateNoteButton(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!transcript) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-500">
        No transcript available for this episode
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-xl"
      >
        <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Transcript</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in transcript..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div ref={containerRef} className="p-6 max-h-[600px] overflow-y-auto border-t border-slate-200 relative bg-white/50">
            <div className="prose prose-sm max-w-none" onMouseUp={handleTextSelection}>
              {searchQuery.trim() ? (
                highlightedParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className="mb-4 text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: p.highlighted || p.text }}
                  />
                ))
              ) : (
                paragraphs.map((p, i) => (
                  <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                    {p}
                  </p>
                ))
              )}
            </div>
            {showCreateNoteButton && (
              <button
                onClick={handleCreateNote}
                className="absolute z-50 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 transition-all text-sm font-medium whitespace-nowrap"
                style={{
                  top: `${buttonPosition.top}px`,
                  left: `${buttonPosition.left}px`,
                }}
              >
                <StickyNote className="w-4 h-4" />
                Add to Notes
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
