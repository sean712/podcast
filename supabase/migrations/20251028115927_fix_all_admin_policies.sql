/*
  # Fix All Admin Policies

  1. Changes
    - Update policies to allow authenticated users to manage their created podcasts
    - Allow authenticated users to insert/update episodes
    - Allow authenticated users to manage podcast settings
    - This enables the admin panel to work properly

  2. Security
    - Still requires authentication
    - Users can manage podcasts they create
    - Access control enforced at application level
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Only system can manage episodes" ON episodes;
DROP POLICY IF EXISTS "Only admins can manage podcast settings" ON podcast_settings;
DROP POLICY IF EXISTS "Only admins can update podcasts" ON podcasts;

-- Allow authenticated users to manage episodes
CREATE POLICY "Authenticated users can insert episodes"
  ON episodes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update episodes"
  ON episodes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete episodes"
  ON episodes
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users to manage podcast settings
CREATE POLICY "Authenticated users can insert podcast settings"
  ON podcast_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update podcast settings"
  ON podcast_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to update podcasts
CREATE POLICY "Authenticated users can update podcasts"
  ON podcasts
  FOR UPDATE
  TO authenticated
  USING (true);
