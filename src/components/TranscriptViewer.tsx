import { useState, useMemo, useRef } from 'react';
import { Search, X, StickyNote, Save } from 'lucide-react';
import { createNote } from '../services/localStorageNotesService';

interface TranscriptViewerProps {
  transcript: string;
  episodeTitle: string;
  episodeId: string;
  podcastName: string;
  onTextSelected?: (text: string) => void;
  onNoteCreated?: () => void;
}

interface TranscriptSegment {
  timestamp?: string;
  speaker?: string;
  text: string;
}

export default function TranscriptViewer({ transcript, episodeTitle, episodeId, podcastName, onTextSelected, onNoteCreated }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showCreateNoteButton, setShowCreateNoteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showSpeakers, setShowSpeakers] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const segments = useMemo(() => {
    if (!transcript) return [];

    const hasTimestamps = /\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]/.test(transcript);

    if (hasTimestamps) {
      const segmentList = transcript.split(/(?=\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\])/);
      return segmentList
        .filter(s => s.trim())
        .map(segment => {
          const timestampMatch = segment.match(/^\[(\d{2}:\d{2}:\d{2})\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]\s*/);
          let text = segment;
          let timestamp: string | undefined;
          let speaker: string | undefined;

          if (timestampMatch) {
            timestamp = timestampMatch[1];
            text = segment.substring(timestampMatch[0].length);
          }

          const speakerMatch = text.match(/^\[SPEAKER_(\d+)\]\s*/);
          if (speakerMatch) {
            speaker = `Speaker ${speakerMatch[1]}`;
            text = text.substring(speakerMatch[0].length);
          }

          return {
            timestamp,
            speaker,
            text: text.trim()
          };
        })
        .filter(s => s.text);
    }

    const paragraphs = transcript.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => {
      const speakerMatch = p.match(/^(Speaker \d+):\s*/);
      if (speakerMatch) {
        return {
          speaker: speakerMatch[1],
          text: p.substring(speakerMatch[0].length).trim()
        };
      }
      return { text: p.trim() };
    });
  }, [transcript]);

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return segments
      .filter(segment => regex.test(segment.text))
      .map(segment => ({
        ...segment,
        highlightedText: segment.text.replace(
          regex,
          '<mark class="bg-yellow-300 text-slate-900 px-0.5 rounded">$&</mark>'
        )
      }));
  }, [segments, searchQuery]);

  const displaySegments = searchQuery.trim() ? filteredSegments : segments;

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


  if (!transcript) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <p className="text-slate-700 font-medium">No transcript available</p>
        <p className="text-slate-500 text-sm mt-1">This episode doesn't have a transcript yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm text-slate-900 placeholder-slate-400"
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
          </div>

          <div className="flex items-center justify-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show speakers</span>
              <button
                onClick={() => setShowSpeakers(!showSpeakers)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showSpeakers ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showSpeakers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show timestamps</span>
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showTimestamps ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTimestamps ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div
          ref={containerRef}
          className="p-8 overflow-y-auto bg-slate-50 max-h-[600px] relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            className="max-w-4xl mx-auto text-base"
            onMouseUp={handleTextSelection}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {displaySegments.map((segment, i) => (
              <div key={i} className="mb-6">
                <div className="flex items-start gap-3">
                  {showTimestamps && segment.timestamp && (
                    <span className="text-slate-500 text-xs font-mono mt-1 flex-shrink-0 w-20">
                      {segment.timestamp}
                    </span>
                  )}
                  <div className="flex-1">
                    {showSpeakers && segment.speaker && (
                      <span className="text-slate-600 font-semibold text-sm bg-slate-200 px-2 py-0.5 rounded mr-2">
                        {segment.speaker}
                      </span>
                    )}
                    <span
                      className="text-slate-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: 'highlightedText' in segment ? segment.highlightedText : segment.text
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
