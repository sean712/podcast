/*
  # Add moments tab to visible_tabs default

  1. Changes
    - Update default value for visible_tabs column to include 'moments' option
    - This ensures new podcasts have the Key Moments tab enabled by default

  2. Notes
    - This only affects NEW podcast_settings rows created after this migration
    - Existing rows retain their current visible_tabs values
*/

ALTER TABLE podcast_settings
ALTER COLUMN visible_tabs
SET DEFAULT '["player", "overview", "moments", "people", "timeline", "map", "references", "transcript", "notes"]'::jsonb;
