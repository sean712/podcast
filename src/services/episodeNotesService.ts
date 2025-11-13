import { supabase } from '../lib/supabase';

export interface EpisodeNote {
  id: string;
  user_id: string;
  episode_id: string;
  episode_title: string;
  podcast_name: string;
  note_text: string;
  highlighted_text?: string;
  created_at: string;
  updated_at: string;
}

export async function getNotesByEpisode(episodeId: string): Promise<EpisodeNote[]> {
  const { data, error } = await supabase
    .from('episode_notes')
    .select('*')
    .eq('episode_id', episodeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data || [];
}

export async function createNote(
  episodeId: string,
  episodeTitle: string,
  podcastName: string,
  noteText: string,
  highlightedText?: string
): Promise<EpisodeNote> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create notes');
  }

  const { data, error } = await supabase
    .from('episode_notes')
    .insert({
      user_id: user.id,
      episode_id: episodeId,
      episode_title: episodeTitle,
      podcast_name: podcastName,
      note_text: noteText,
      highlighted_text: highlightedText,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create note');
  }

  return data;
}

export async function updateNote(noteId: string, noteText: string): Promise<EpisodeNote> {
  const { data, error } = await supabase
    .from('episode_notes')
    .update({
      note_text: noteText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to update note');
  }

  return data;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('episode_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}
