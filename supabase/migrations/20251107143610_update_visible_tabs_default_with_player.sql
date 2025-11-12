/*
  # Update visible_tabs default to include player

  1. Changes
    - Update default value for visible_tabs to include 'player' option
    - This allows controlling whether the audio player is shown
  
  2. Notes
    - Existing rows with null will still show all tabs including player
    - New rows will have player enabled by default
*/

ALTER TABLE podcast_settings 
ALTER COLUMN visible_tabs 
SET DEFAULT '["player", "overview", "people", "timeline", "map", "references", "transcript", "notes"]'::jsonb;