/*
  # Create episode notes table

  1. New Tables
    - `episode_notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `user_id` (uuid, foreign key) - References auth.users
      - `episode_id` (text) - The podcast episode ID
      - `episode_title` (text) - Episode title for display
      - `podcast_name` (text) - Podcast name for context
      - `note_text` (text) - The user's note content
      - `highlighted_text` (text, optional) - Text highlighted from transcript
      - `created_at` (timestamptz) - When the note was created
      - `updated_at` (timestamptz) - When the note was last updated

  2. Security
    - Enable RLS on `episode_notes` table
    - Add policy for users to read their own notes
    - Add policy for users to insert their own notes
    - Add policy for users to update their own notes
    - Add policy for users to delete their own notes

  3. Indexes
    - Index on user_id for fast note retrieval
    - Index on episode_id for filtering notes by episode
*/

CREATE TABLE IF NOT EXISTS episode_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  episode_id text NOT NULL,
  episode_title text NOT NULL DEFAULT '',
  podcast_name text NOT NULL DEFAULT '',
  note_text text NOT NULL,
  highlighted_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE episode_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON episode_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON episode_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON episode_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON episode_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_episode_notes_user_id ON episode_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_notes_episode_id ON episode_notes(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_notes_created_at ON episode_notes(created_at DESC);