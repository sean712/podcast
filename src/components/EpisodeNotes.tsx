import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, StickyNote } from 'lucide-react';
import { getNotesByEpisode, createNote, updateNote, deleteNote, type EpisodeNote } from '../services/episodeNotesService';
import { useAuth } from '../contexts/AuthContext';

interface EpisodeNotesProps {
  episodeId: string;
  episodeTitle: string;
  podcastName: string;
  highlightedText?: string;
  onHighlightUsed?: () => void;
}

export default function EpisodeNotes({
  episodeId,
  episodeTitle,
  podcastName,
  highlightedText,
  onHighlightUsed
}: EpisodeNotesProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<EpisodeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [episodeId, user]);

  useEffect(() => {
    if (highlightedText) {
      setIsCreating(true);
    }
  }, [highlightedText]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const data = await getNotesByEpisode(episodeId);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return;

    try {
      const note = await createNote(
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
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingText.trim()) return;

    try {
      const updatedNote = await updateNote(noteId, editingText);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      setEditingNoteId(null);
      setEditingText('');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (note: EpisodeNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.note_text);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <StickyNote className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Notes</h3>
          <span className="text-sm text-gray-500">({notes.length})</span>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        )}
      </div>

      {highlightedText && isCreating && (
        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
          <p className="text-sm text-gray-700 mb-1 font-medium">Highlighted text:</p>
          <p className="text-sm text-gray-600 italic">"{highlightedText}"</p>
        </div>
      )}

      {isCreating && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write your note here..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateNote}
              disabled={!newNoteText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20 text-sm font-medium"
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
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notes yet. Create your first note to remember important details!
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              {editingNoteId === note.id ? (
                <>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm resize-none mb-3"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editingText.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {note.highlighted_text && (
                    <div className="mb-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded shadow-sm">
                      <p className="text-xs text-gray-600 italic">"{note.highlighted_text}"</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{note.note_text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        aria-label="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
