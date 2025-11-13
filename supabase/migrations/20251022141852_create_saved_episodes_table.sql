/*
  # Create saved episodes table

  1. New Tables
    - `saved_episodes`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Foreign key to auth.users
      - `episode_id` (text) - External episode ID from Podscan API
      - `episode_title` (text) - Episode title
      - `episode_description` (text, nullable) - Episode description
      - `episode_image_url` (text, nullable) - Episode image URL
      - `episode_duration` (integer, nullable) - Duration in seconds
      - `podcast_id` (text) - Podcast ID for reference
      - `podcast_name` (text) - Podcast name for reference
      - `posted_at` (text, nullable) - When episode was posted
      - `saved_at` (timestamptz) - When user saved this episode
      - `created_at` (timestamptz) - When record was created
  
  2. Security
    - Enable RLS on `saved_episodes` table
    - Add policy for users to read their own saved episodes
    - Add policy for users to insert their own saved episodes
    - Add policy for users to delete their own saved episodes
  
  3. Indexes
    - Add unique index on (user_id, episode_id) to prevent duplicates
    - Add index on user_id for fast user lookups
    - Add index on saved_at for sorting
  
  4. Notes
    - Users can only see and manage their own saved episodes
    - Duplicate saves prevented by unique constraint
*/

CREATE TABLE IF NOT EXISTS saved_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  episode_id text NOT NULL,
  episode_title text NOT NULL,
  episode_description text,
  episode_image_url text,
  episode_duration integer,
  podcast_id text NOT NULL,
  podcast_name text NOT NULL,
  posted_at text,
  saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved episodes"
  ON saved_episodes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved episodes"
  ON saved_episodes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved episodes"
  ON saved_episodes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_episodes_user_episode ON saved_episodes(user_id, episode_id);
CREATE INDEX IF NOT EXISTS idx_saved_episodes_user_id ON saved_episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_episodes_saved_at ON saved_episodes(saved_at DESC);
