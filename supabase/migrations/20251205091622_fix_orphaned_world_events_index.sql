/*
  # Fix orphaned world_events index
  
  1. Issue
    - Previous migration dropped `world_events` column but left the GIN index
    - This created an orphaned index referencing a non-existent column
    - Database queries are failing due to the invalid index
    
  2. Changes
    - Drop the `idx_episode_analyses_world_events` index if it exists
    - This fixes the database integrity issue
    
  3. Notes
    - This corrects the incomplete migration from 20251205085033
    - After this, database queries should work normally again
*/

DROP INDEX IF EXISTS idx_episode_analyses_world_events;
