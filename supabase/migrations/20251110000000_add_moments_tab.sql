/*
  # Add moments tab to visible_tabs

  1. Changes
    - Update default value for visible_tabs to include 'moments' option
    - This separates Key Moments from the Overview tab

  2. Notes
    - Existing rows with null will show all tabs including moments
    - New rows will have moments enabled by default
*/

ALTER TABLE podcast_settings
ALTER COLUMN visible_tabs
SET DEFAULT '["player", "overview", "moments", "people", "timeline", "map", "references", "transcript", "notes"]'::jsonb;
