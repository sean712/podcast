/*
  # Add podcast visibility and admin controls

  1. Changes
    - Add `is_paused` boolean column to podcasts table
    - Podcasts can be paused (hidden from public view) without deletion
    - This allows admins to hide podcasts temporarily (e.g., payment issues)
  
  2. Notes
    - Paused podcasts won't appear in public listings
    - Status field remains for general state management
    - is_paused provides explicit visibility control
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcasts' AND column_name = 'is_paused'
  ) THEN
    ALTER TABLE podcasts ADD COLUMN is_paused boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for faster queries on paused status
CREATE INDEX IF NOT EXISTS idx_podcasts_is_paused ON podcasts(is_paused);
