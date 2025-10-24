/*
  # Create episode analyses cache table

  1. New Tables
    - `episode_analyses`
      - `id` (uuid, primary key) - Unique identifier
      - `episode_id` (text, unique) - External episode ID from Podscan API
      - `episode_title` (text) - Episode title for reference
      - `podcast_name` (text) - Podcast name for reference
      - `summary` (text) - AI-generated summary of the episode
      - `key_personnel` (jsonb) - Array of key people mentioned
      - `timeline_events` (jsonb) - Array of timeline events
      - `locations` (jsonb) - Array of geocoded locations
      - `analysis_version` (text) - Version identifier for analysis format (allows future re-analysis if needed)
      - `created_at` (timestamptz) - When the analysis was created
      - `updated_at` (timestamptz) - When the analysis was last updated
  
  2. Security
    - Enable RLS on `episode_analyses` table
    - Add policy allowing all authenticated users to read cached analyses
    - Add policy allowing all authenticated users to insert new analyses
    - This is a shared cache - any user can read any analysis
  
  3. Indexes
    - Add unique index on episode_id for fast lookups
    - Add index on created_at for cleanup/maintenance queries
  
  4. Notes
    - This table acts as a shared cache across all users
    - First user to analyze an episode creates the cache entry
    - Subsequent users read from the cache instead of re-analyzing
    - analysis_version allows future schema changes without losing old data
*/

CREATE TABLE IF NOT EXISTS episode_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id text UNIQUE NOT NULL,
  episode_title text NOT NULL,
  podcast_name text NOT NULL,
  summary text NOT NULL,
  key_personnel jsonb DEFAULT '[]'::jsonb,
  timeline_events jsonb DEFAULT '[]'::jsonb,
  locations jsonb DEFAULT '[]'::jsonb,
  analysis_version text DEFAULT 'v1' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE episode_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached analyses"
  ON episode_analyses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create cached analyses"
  ON episode_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_episode_analyses_episode_id ON episode_analyses(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_analyses_created_at ON episode_analyses(created_at);
