/*
  # Add Wikipedia Information Toggle to Podcast Settings

  1. Changes
    - Adds `enable_wikipedia_info` column to `podcast_settings` table
    - Boolean field to control Wikipedia enrichment for key personnel
    - Defaults to `true` for backward compatibility
    
  2. Purpose
    - Allows admins to enable/disable Wikipedia enrichment per podcast
    - Reduces API costs for podcasts that don't need biographical data
    - Provides granular control over external API usage
*/

-- Add enable_wikipedia_info column to podcast_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcast_settings' AND column_name = 'enable_wikipedia_info'
  ) THEN
    ALTER TABLE podcast_settings 
    ADD COLUMN enable_wikipedia_info boolean DEFAULT true;
  END IF;
END $$;
