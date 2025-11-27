/*
  # Add podcast_url column to podcasts table

  1. Changes
    - Add `podcast_url` column to `podcasts` table to store the podcast's website URL from Podscan API
  
  2. Notes
    - This field is nullable as existing podcasts may not have this data yet
    - Will be populated during future syncs when podcast data is fetched from Podscan
*/

ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS podcast_url text;