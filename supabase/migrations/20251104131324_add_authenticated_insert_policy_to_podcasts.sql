/*
  # Add INSERT policy for authenticated users on podcasts table

  1. Changes
    - Add INSERT policy for authenticated users to create podcasts
    - This allows logged-in users in the admin panel to create podcast spaces

  2. Security
    - Only authenticated users can insert
    - All authenticated users can create podcasts (admin panel access is controlled at the application level)
*/

-- Drop the old anon insert policy if it exists (we don't want anonymous users creating podcasts)
DROP POLICY IF EXISTS "Allow anon inserts" ON podcasts;

-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);