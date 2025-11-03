import { useState, useMemo, useRef } from 'react';
import { BookOpen, Search, X, Check, ChevronDown, ChevronUp, StickyNote, Type, Maximize2, Minimize2, MessageCircle } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: string;
  episodeTitle: string;
  onTextSelected?: (text: string) => void;
  onAskAI?: (text: string) => void;
}

export default function TranscriptViewer({ transcript, episodeTitle, onTextSelected, onAskAI }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedText, setSelectedText] = useState('');
  const [showCreateNoteButton, setShowCreateNoteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
      highlighted: p.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200 px-1 rounded">$1</mark>')
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

  const handleAskAI = () => {
    if (onAskAI && selectedText) {
      onAskAI(selectedText);
    }
    setShowCreateNoteButton(false);
    window.getSelection()?.removeAllRanges();
  };

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  if (!transcript) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
        <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-300 font-medium">No transcript available</p>
        <p className="text-slate-500 text-sm mt-1">This episode doesn't have a transcript yet</p>
      </div>
    );
  }

  return (
    <div className={`relative group ${isFullscreen ? 'fixed inset-0 z-50 p-4' : ''}`}>
      {/* Animated gradient background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg blur-md opacity-50" />
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white">Full Transcript</h3>
              <p className="text-xs text-slate-400">Select text to add notes or ask AI</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-slate-700/50 p-3 bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-800/50 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm text-white placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-600/50 rounded-lg p-1">
              <button
                onClick={() => setFontSize('small')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  fontSize === 'small'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFontSize('medium')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  fontSize === 'medium'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  fontSize === 'large'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-5 h-5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
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

        {/* Transcript Content */}
        <div
          ref={containerRef}
          className={`p-8 overflow-y-auto bg-slate-900/30 ${
            isFullscreen ? 'max-h-[calc(100vh-200px)]' : 'max-h-[600px]'
          } relative`}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            className={`max-w-4xl mx-auto ${fontSizeClasses[fontSize]}`}
            onMouseUp={handleTextSelection}
          >
            {searchQuery.trim() ? (
              highlightedParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="mb-6 text-slate-200 leading-relaxed"
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
                    <p key={i} className="mb-6 text-slate-200 leading-relaxed">
                      <span className="font-bold text-blue-400">{speaker}:</span>{' '}
                      {text}
                    </p>
                  );
                }
                return (
                  <p key={i} className="mb-6 text-slate-200 leading-relaxed">
                    {p}
                  </p>
                );
              })
            )}
          </div>

          {/* Floating Action Buttons */}
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 shadow-2xl shadow-yellow-500/40 transition-all text-sm font-medium whitespace-nowrap"
              >
                <StickyNote className="w-4 h-4" />
                Add to Notes
              </button>
              {onAskAI && (
                <button
                  onClick={handleAskAI}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-2xl shadow-green-500/40 transition-all text-sm font-medium whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask AI
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
