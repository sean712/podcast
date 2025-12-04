/*
  # Add Featured Episodes Columns
  
  1. Changes
    - Add `is_featured` column to `episode_analyses` table
      - Boolean type, defaults to false
      - Indicates if an episode is featured
    - Add `featured_at` column to `episode_analyses` table
      - Timestamp type, nullable
      - Tracks when an episode was featured
      - Used for ordering featured episodes (most recently featured first)
  
  2. Indexes
    - Add index on `is_featured` and `featured_at` for efficient querying
  
  3. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add featured columns to episode_analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episode_analyses' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE episode_analyses ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episode_analyses' AND column_name = 'featured_at'
  ) THEN
    ALTER TABLE episode_analyses ADD COLUMN featured_at timestamptz;
  END IF;
END $$;

-- Add index for efficient querying of featured episodes
CREATE INDEX IF NOT EXISTS idx_episode_analyses_featured 
ON episode_analyses(is_featured, featured_at DESC) 
WHERE is_featured = true;