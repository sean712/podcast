/*
  # Add visible_tabs configuration to podcast_settings table

  1. Changes
    - Add `visible_tabs` jsonb column to control which tabs are visible for each podcast
    - Default includes all tabs: overview, people, timeline, map, references, transcript, notes
  
  2. Notes
    - Column is nullable to maintain compatibility with existing rows
    - Default shows all tabs when null (backward compatible)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcast_settings' AND column_name = 'visible_tabs'
  ) THEN
    ALTER TABLE podcast_settings ADD COLUMN visible_tabs jsonb DEFAULT '["overview", "people", "timeline", "map", "references", "transcript", "notes"]'::jsonb;
  END IF;
END $$;