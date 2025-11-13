export interface LocalNote {
  id: string;
  episodeId: string;
  episodeTitle: string;
  podcastName: string;
  noteText: string;
  highlightedText?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = 'augmented_pods_notes_';

function getStorageKey(episodeId: string): string {
  return `${STORAGE_KEY_PREFIX}${episodeId}`;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getNotesByEpisode(episodeId: string): LocalNote[] {
  try {
    const key = getStorageKey(episodeId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const notes = JSON.parse(stored) as LocalNote[];
    return notes.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error loading notes from localStorage:', error);
    return [];
  }
}

export function createNote(
  episodeId: string,
  episodeTitle: string,
  podcastName: string,
  noteText: string,
  highlightedText?: string
): LocalNote {
  try {
    const now = new Date().toISOString();
    const newNote: LocalNote = {
      id: generateId(),
      episodeId,
      episodeTitle,
      podcastName,
      noteText,
      highlightedText,
      createdAt: now,
      updatedAt: now,
    };

    const existingNotes = getNotesByEpisode(episodeId);
    const updatedNotes = [newNote, ...existingNotes];

    const key = getStorageKey(episodeId);
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    return newNote;
  } catch (error) {
    console.error('Error creating note in localStorage:', error);
    throw new Error('Failed to create note. Your browser storage may be full.');
  }
}

export function updateNote(episodeId: string, noteId: string, noteText: string): LocalNote {
  try {
    const notes = getNotesByEpisode(episodeId);
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    const updatedNote: LocalNote = {
      ...notes[noteIndex],
      noteText,
      updatedAt: new Date().toISOString(),
    };

    notes[noteIndex] = updatedNote;

    const key = getStorageKey(episodeId);
    localStorage.setItem(key, JSON.stringify(notes));

    return updatedNote;
  } catch (error) {
    console.error('Error updating note in localStorage:', error);
    throw new Error('Failed to update note');
  }
}

export function deleteNote(episodeId: string, noteId: string): void {
  try {
    const notes = getNotesByEpisode(episodeId);
    const filteredNotes = notes.filter(n => n.id !== noteId);

    const key = getStorageKey(episodeId);

    if (filteredNotes.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(filteredNotes));
    }
  } catch (error) {
    console.error('Error deleting note from localStorage:', error);
    throw new Error('Failed to delete note');
  }
}

export function getAllNotes(): LocalNote[] {
  try {
    const allNotes: LocalNote[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const notes = JSON.parse(stored) as LocalNote[];
          allNotes.push(...notes);
        }
      }
    }

    return allNotes.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error loading all notes from localStorage:', error);
    return [];
  }
}

export function exportNotesAsJSON(): string {
  const allNotes = getAllNotes();
  return JSON.stringify(allNotes, null, 2);
}

export function exportNotesAsText(): string {
  const allNotes = getAllNotes();
  let text = 'Augmented Pods - My Notes\n';
  text += '='.repeat(50) + '\n\n';

  allNotes.forEach(note => {
    text += `Podcast: ${note.podcastName}\n`;
    text += `Episode: ${note.episodeTitle}\n`;
    text += `Date: ${new Date(note.createdAt).toLocaleString()}\n`;
    if (note.highlightedText) {
      text += `Highlighted: "${note.highlightedText}"\n`;
    }
    text += `\n${note.noteText}\n`;
    text += '-'.repeat(50) + '\n\n';
  });

  return text;
}

export function importNotes(jsonString: string): number {
  try {
    const notes = JSON.parse(jsonString) as LocalNote[];
    let importedCount = 0;

    notes.forEach(note => {
      const existingNotes = getNotesByEpisode(note.episodeId);
      const noteExists = existingNotes.some(n => n.id === note.id);

      if (!noteExists) {
        existingNotes.push(note);
        const key = getStorageKey(note.episodeId);
        localStorage.setItem(key, JSON.stringify(existingNotes));
        importedCount++;
      }
    });

    return importedCount;
  } catch (error) {
    console.error('Error importing notes:', error);
    throw new Error('Failed to import notes. Invalid file format.');
  }
}

export function clearAllNotes(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing notes from localStorage:', error);
    throw new Error('Failed to clear notes');
  }
}
