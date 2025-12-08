/*
  # Add is_client field to podcasts table

  1. Changes
    - Add `is_client` boolean column to `podcasts` table
    - Default value: false (non-client podcasts are protected by default)
    - This field determines whether podcast home page shows all episodes or only featured ones
  
  2. Purpose
    - Client podcasts (is_client = true): Show full episode list at /{podcastSlug}
    - Non-client podcasts (is_client = false): Show only featured episodes at /{podcastSlug}
    - Protects full catalog from discovery via URL manipulation
*/

-- Add is_client column to podcasts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcasts' AND column_name = 'is_client'
  ) THEN
    ALTER TABLE podcasts ADD COLUMN is_client boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for faster queries filtering by client status
CREATE INDEX IF NOT EXISTS idx_podcasts_is_client ON podcasts(is_client) WHERE is_client = true;