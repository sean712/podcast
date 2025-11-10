import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, StickyNote, Download, Upload, AlertCircle, Share2, Check } from 'lucide-react';
import { getNotesByEpisode, createNote, updateNote, deleteNote, exportNotesAsJSON, exportNotesAsText, importNotes, clearAllNotes, type LocalNote } from '../services/localStorageNotesService';

interface EpisodeNotesProps {
  episodeId: string;
  episodeTitle: string;
  podcastName: string;
  highlightedText?: string;
  onHighlightUsed?: () => void;
}

const noteColors = [
  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', hover: 'hover:border-yellow-300', accent: 'border-yellow-400' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', hover: 'hover:border-blue-300', accent: 'border-blue-400' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', hover: 'hover:border-green-300', accent: 'border-green-400' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', hover: 'hover:border-pink-300', accent: 'border-pink-400' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', hover: 'hover:border-purple-300', accent: 'border-purple-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', hover: 'hover:border-orange-300', accent: 'border-orange-400' },
];

export default function EpisodeNotes({
  episodeId,
  episodeTitle,
  podcastName,
  highlightedText,
  onHighlightUsed
}: EpisodeNotesProps) {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const getNoteColor = (index: number) => noteColors[index % noteColors.length];

  useEffect(() => {
    loadNotes();
  }, [episodeId]);

  useEffect(() => {
    if (highlightedText) {
      setIsCreating(true);
    }
  }, [highlightedText]);

  const loadNotes = () => {
    setIsLoading(true);
    try {
      const data = getNotesByEpisode(episodeId);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
    if (!newNoteText.trim()) return;

    try {
      const note = createNote(
        episodeId,
        episodeTitle,
        podcastName,
        newNoteText,
        highlightedText
      );
      setNotes(prev => [note, ...prev]);
      setNewNoteText('');
      setIsCreating(false);
      if (onHighlightUsed) {
        onHighlightUsed();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Your browser storage may be full.');
    }
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editingText.trim()) return;

    try {
      const updatedNote = updateNote(episodeId, noteId, editingText);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      setEditingNoteId(null);
      setEditingText('');
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note.');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      deleteNote(episodeId, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note.');
    }
  };

  const startEditing = (note: LocalNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.noteText);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleExportJSON = () => {
    try {
      const json = exportNotesAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `augmented-pods-notes-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export notes:', error);
      alert('Failed to export notes.');
    }
  };

  const handleExportText = () => {
    try {
      const text = exportNotesAsText();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `augmented-pods-notes-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export notes:', error);
      alert('Failed to export notes.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const count = importNotes(content);
          alert(`Successfully imported ${count} note(s)`);
          loadNotes();
        } catch (error) {
          console.error('Failed to import notes:', error);
          alert('Failed to import notes. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearAll = () => {
    if (!confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) return;

    try {
      clearAllNotes();
      setNotes([]);
      alert('All notes have been deleted.');
    } catch (error) {
      console.error('Failed to clear notes:', error);
      alert('Failed to clear notes.');
    }
  };

  const handleShareNote = async (note: LocalNote) => {
    const shareText = formatNoteForSharing(note);

    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedNoteId(note.id);
        setTimeout(() => setCopiedNoteId(null), 2000);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share note:', error);
        alert('Failed to share note.');
      }
    }
  };

  const formatNoteForSharing = (note: LocalNote): string => {
    let text = `📝 ${note.podcastName} - ${note.episodeTitle}\n\n`;

    if (note.highlightedText) {
      text += `"${note.highlightedText}"\n\n`;
    }

    text += `💭 ${note.noteText}`;

    return text;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-900 font-medium mb-1">Notes are stored locally in your browser</p>
          <p className="text-blue-700 text-xs">Your notes won't sync across devices. Use export to back them up.</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export & Import"
            >
              <Download className="w-5 h-5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-10">
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 rounded-t-lg"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </button>
                <button
                  onClick={handleExportText}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as Text
                </button>
                <button
                  onClick={handleImport}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Notes
                </button>
                <div className="border-t border-slate-200" />
                <button
                  onClick={handleClearAll}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {highlightedText && isCreating && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
          <p className="text-sm text-amber-800 mb-2 font-semibold">Highlighted text:</p>
          <p className="text-sm text-slate-700 italic">"{highlightedText}"</p>
        </div>
      )}

      {isCreating && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write your note here..."
            className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none text-sm text-slate-900 placeholder-slate-400 resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateNote}
              disabled={!newNoteText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Note
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNoteText('');
                if (onHighlightUsed) {
                  onHighlightUsed();
                }
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-600">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <StickyNote className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-700 font-medium mb-1">No notes yet</p>
          <p className="text-slate-500 text-sm">Create your first note to remember important details!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, index) => {
            const color = getNoteColor(index);
            return (
              <div
                key={note.id}
                className={`bg-white border ${color.border} rounded-xl p-5 ${color.hover} transition-all shadow-sm hover:shadow-md`}
              >
              {editingNoteId === note.id ? (
                <>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none text-sm text-slate-900 resize-none mb-3"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editingText.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {note.highlightedText && (
                    <div className={`mb-3 p-3 ${color.bg} border-l-4 ${color.accent} rounded`}>
                      <p className="text-xs text-slate-700 italic">"{note.highlightedText}"</p>
                    </div>
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4 leading-relaxed">{note.noteText}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShareNote(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        aria-label="Share note"
                        title="Share or copy to clipboard"
                      >
                        {copiedNoteId === note.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        aria-label="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
