/*
  # Create saved podcasts table

  1. New Tables
    - `saved_podcasts`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key to auth.users) - User who saved the podcast
      - `podcast_id` (text) - External podcast ID from Podscan API
      - `podcast_title` (text) - Podcast title for display
      - `podcast_author` (text) - Podcast author/creator
      - `podcast_image` (text) - Podcast cover image URL
      - `saved_at` (timestamptz) - When the podcast was saved
      - `created_at` (timestamptz) - Record creation timestamp
  
  2. Security
    - Enable RLS on `saved_podcasts` table
    - Add policy for authenticated users to read their own saved podcasts
    - Add policy for authenticated users to insert their own saved podcasts
    - Add policy for authenticated users to delete their own saved podcasts
  
  3. Indexes
    - Add index on user_id for faster queries
    - Add unique constraint on (user_id, podcast_id) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS saved_podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id text NOT NULL,
  podcast_title text NOT NULL,
  podcast_author text,
  podcast_image text,
  saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, podcast_id)
);

ALTER TABLE saved_podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved podcasts"
  ON saved_podcasts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save podcasts"
  ON saved_podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave own podcasts"
  ON saved_podcasts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_podcasts_user_id ON saved_podcasts(user_id);
