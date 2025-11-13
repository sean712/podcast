/*
  # Add references column to episode_analyses table

  1. Changes
    - Add `references` jsonb column to store extracted references (books, films, companies, products, etc.)
    - The column stores an array of reference objects with type, name, context, and quote
  
  2. Notes
    - Column is nullable to maintain compatibility with existing rows
    - Default value is an empty array for new rows
    - Using double quotes because 'references' is a reserved keyword
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episode_analyses' AND column_name = 'references'
  ) THEN
    ALTER TABLE episode_analyses ADD COLUMN "references" jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;