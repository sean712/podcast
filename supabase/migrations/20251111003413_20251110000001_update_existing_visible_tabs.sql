/*
  # Update existing podcast_settings to include moments tab

  1. Changes
    - Update all existing podcast_settings rows to include 'moments' in visible_tabs
    - This ensures the Key Moments tab appears for existing podcasts

  2. Notes
    - Sets all existing podcast settings to the new default tab list
*/

UPDATE podcast_settings
SET visible_tabs = '["player", "overview", "moments", "people", "timeline", "map", "references", "transcript", "notes"]'::jsonb
WHERE visible_tabs IS NOT NULL;
