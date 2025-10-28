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
    <div className="relative group">
      {/* Animated gradient background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl blur-md opacity-50" />
              <div className="relative p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <StickyNote className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Your Notes</h3>
              <p className="text-sm text-slate-400">{notes.length} notes saved</p>
            </div>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg shadow-yellow-500/30 text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          )}
        </div>

        {highlightedText && isCreating && (
          <div className="mb-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-lg">
            <p className="text-sm text-amber-300 mb-2 font-semibold">Highlighted text:</p>
            <p className="text-sm text-slate-200 italic">"{highlightedText}"</p>
          </div>
        )}

        {isCreating && (
          <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Write your note here..."
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600/50 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none text-sm text-white placeholder-slate-500 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateNote}
                disabled={!newNoteText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/30 text-sm font-bold"
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
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium mb-1">No notes yet</p>
            <p className="text-slate-500 text-sm">Create your first note to remember important details!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note.id}
                className="p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
              >
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600/50 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none text-sm text-white resize-none mb-3"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editingText.trim()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all text-sm font-bold"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {note.highlighted_text && (
                      <div className="mb-3 p-3 bg-amber-500/10 border-l-4 border-amber-400 rounded">
                        <p className="text-xs text-amber-300 italic">"{note.highlighted_text}"</p>
                      </div>
                    )}
                    <p className="text-sm text-slate-200 whitespace-pre-wrap mb-4">{note.note_text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
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
                          className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
                          aria-label="Edit note"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
    </div>
  );
}
