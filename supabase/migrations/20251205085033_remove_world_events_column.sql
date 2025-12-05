/*
  # Remove world_events column from episode_analyses table

  1. Changes
    - Remove the `world_events` column from `episode_analyses` table
    - This column stored parallel world events data that is no longer needed
    - The analysis now uses the native podcast description instead of AI-generated overview

  2. Notes
    - This is a safe operation as the column is being removed, not modified
    - Existing cached analyses will continue to work without this field
*/

ALTER TABLE episode_analyses DROP COLUMN IF EXISTS world_events;
