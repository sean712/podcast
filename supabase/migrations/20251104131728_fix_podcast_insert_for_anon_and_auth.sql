/*
  # Fix Podcast Insert for Both Anon and Authenticated Roles

  1. Problem
    - Users authenticate via JWT but connect with anon key
    - Need policy for both anon and authenticated roles
    - Current policy only covers authenticated role

  2. Solution
    - Add INSERT policy for anon role (for API key based access)
    - Keep INSERT policy for authenticated role (for JWT authenticated users)
    - Both policies allow inserts

  3. Security
    - Anon role can insert (with anon key)
    - Authenticated users can insert (with JWT)
    - Both are valid access patterns for the admin panel
*/

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Anon role can insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Allow anon inserts" ON podcasts;
DROP POLICY IF EXISTS "Authenticated users can insert podcasts" ON podcasts;

-- Create INSERT policy for anon role
CREATE POLICY "Anon role can insert podcasts"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create INSERT policy for authenticated role  
CREATE POLICY "Authenticated users can insert podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);