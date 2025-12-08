/*
  # Add is_featured to episodes table

  1. Changes
    - Add `is_featured` column to `episodes` table
      - Boolean type, defaults to false
      - Indicates if an episode should be shown on protected podcast pages
    - Add `featured_at` column to `episodes` table
      - Timestamp type, nullable
      - Tracks when an episode was marked as featured
  
  2. Indexes
    - Add index on `podcast_id` and `is_featured` for efficient querying
  
  3. Purpose
    - Featured episodes are shown to non-client podcast visitors
    - Allows podcast creators to showcase specific episodes
*/

-- Add featured columns to episodes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episodes' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE episodes ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episodes' AND column_name = 'featured_at'
  ) THEN
    ALTER TABLE episodes ADD COLUMN featured_at timestamptz;
  END IF;
END $$;

-- Add index for efficient querying of featured episodes by podcast
CREATE INDEX IF NOT EXISTS idx_episodes_featured 
ON episodes(podcast_id, is_featured, featured_at DESC) 
WHERE is_featured = true;
