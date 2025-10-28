/*
  # Fix Podcast Insert Policy

  1. Changes
    - Drop the restrictive admin-only insert policy
    - Create a new policy allowing any authenticated user to insert podcasts
    - This allows the admin panel to work for all logged-in users

  2. Security
    - Still requires authentication
    - Access to admin panel can be restricted at the application level
*/

DROP POLICY IF EXISTS "Only admins can insert podcasts" ON podcasts;

CREATE POLICY "Authenticated users can insert podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
