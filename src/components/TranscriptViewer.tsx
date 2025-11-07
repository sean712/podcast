import { useState, useMemo, useRef } from 'react';
import { BookOpen, Search, X, Check, ChevronDown, ChevronUp, StickyNote, Type, Maximize2, Minimize2, Save } from 'lucide-react';
import { createNote } from '../services/localStorageNotesService';

interface TranscriptViewerProps {
  transcript: string;
  episodeTitle: string;
  episodeId: string;
  podcastName: string;
  onTextSelected?: (text: string) => void;
  onNoteCreated?: () => void;
}

export default function TranscriptViewer({ transcript, episodeTitle, episodeId, podcastName, onTextSelected, onNoteCreated }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedText, setSelectedText] = useState('');
  const [showCreateNoteButton, setShowCreateNoteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const paragraphs = useMemo(() => {
    if (!transcript) return [];

    const hasTimestamps = /\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]/.test(transcript);

    if (hasTimestamps) {
      const segments = transcript.split(/(?=\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\])/);
      return segments
        .filter(s => s.trim())
        .map(segment => {
          const withoutTimestamp = segment.replace(/^\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]\s*/, '');
          const withFormattedSpeaker = withoutTimestamp.replace(/^\[SPEAKER_(\d+)\]\s*/, (match, num) => `Speaker ${num}: `);
          return withFormattedSpeaker.trim();
        })
        .filter(p => p);
    }

    return transcript.split('\n\n').filter(p => p.trim());
  }, [transcript]);

  const highlightedParagraphs = useMemo(() => {
    if (!searchQuery.trim()) return paragraphs;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return paragraphs.map(p => ({
      text: p,
      highlighted: p.replace(regex, '<mark class="bg-yellow-200 text-slate-900 px-1 rounded">$1</mark>')
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
    setShowNoteModal(true);
    setShowCreateNoteButton(false);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    try {
      createNote(
        episodeId,
        episodeTitle,
        podcastName,
        noteText,
        selectedText
      );
      setNoteText('');
      setShowNoteModal(false);
      window.getSelection()?.removeAllRanges();
      if (onNoteCreated) {
        onNoteCreated();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Your browser storage may be full.');
    }
  };

  const handleCancelNote = () => {
    setNoteText('');
    setShowNoteModal(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      checkForSelection();
    }, 800);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;

    setTimeout(() => {
      checkForSelection();
    }, 300);
  };

  const checkForSelection = () => {
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
    }
  };


  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  if (!transcript) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-700 font-medium">No transcript available</p>
        <p className="text-slate-500 text-sm mt-1">This episode doesn't have a transcript yet</p>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-white' : ''}`}>
      <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Full Transcript</h3>
              <p className="text-sm text-slate-600 mt-1">Select text to add notes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm text-slate-900 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setFontSize('small')}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                  fontSize === 'small'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Small text"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFontSize('medium')}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                  fontSize === 'medium'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Medium text"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                  fontSize === 'large'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Large text"
              >
                <Type className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`p-8 overflow-y-auto bg-slate-50 ${
            isFullscreen ? 'max-h-[calc(100vh-250px)]' : 'max-h-[600px]'
          } relative`}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            className={`max-w-4xl mx-auto ${fontSizeClasses[fontSize]}`}
            onMouseUp={handleTextSelection}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {searchQuery.trim() ? (
              highlightedParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="mb-6 text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: p.highlighted || p.text }}
                />
              ))
            ) : (
              paragraphs.map((p, i) => {
                const speakerMatch = p.match(/^(Speaker \d+):\s*/);
                if (speakerMatch) {
                  const speaker = speakerMatch[1];
                  const text = p.substring(speakerMatch[0].length);
                  return (
                    <p key={i} className="mb-6 text-slate-700 leading-relaxed">
                      <span className="font-bold text-emerald-700">{speaker}:</span>{' '}
                      {text}
                    </p>
                  );
                }
                return (
                  <p key={i} className="mb-6 text-slate-700 leading-relaxed">
                    {p}
                  </p>
                );
              })
            )}
          </div>

          {showCreateNoteButton && (
            <div
              className="absolute z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              style={{
                top: `${buttonPosition.top}px`,
                left: `${buttonPosition.left}px`,
              }}
            >
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg transition-colors text-sm font-medium whitespace-nowrap"
              >
                <StickyNote className="w-4 h-4" />
                Add to Notes
              </button>
            </div>
          )}
        </div>
      </div>

      {showNoteModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancelNote}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <StickyNote className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Create Note</h3>
            </div>

            {selectedText && (
              <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                <p className="text-sm text-amber-800 mb-2 font-semibold">Highlighted text:</p>
                <p className="text-sm text-slate-700 italic">"{selectedText}"</p>
              </div>
            )}

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your note here..."
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none text-sm text-slate-900 placeholder-slate-400 resize-none mb-4"
              rows={6}
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelNote}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
