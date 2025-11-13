/*
  # Add key moments to episode analyses

  1. Changes
    - Add `key_moments` JSONB column to episode_analyses table
    - This will store important/interesting/surprising moments from episodes
    - Each moment includes timestamp, description, and quotes
  
  2. Notes
    - Key moments help users quickly understand the highlights
    - Format: [{"title": "...", "description": "...", "quote": "...", "timestamp": "..."}]
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episode_analyses' AND column_name = 'key_moments'
  ) THEN
    ALTER TABLE episode_analyses ADD COLUMN key_moments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
