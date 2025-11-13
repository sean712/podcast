/*
  # Fix Authenticated Insert Policy for Podcasts

  1. Problem
    - Current INSERT policy uses `TO authenticated` but the JavaScript client uses anon key with JWT
    - Need to allow anon role with valid JWT to insert

  2. Solution
    - Drop the restrictive authenticated-only policy
    - Create a new policy that checks for auth.uid() (works with anon key + JWT)
    - This allows authenticated users through the JavaScript client to insert

  3. Security
    - Still requires authentication (auth.uid() must exist)
    - Only authenticated users can insert
    - Service role still has full access
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert podcasts" ON podcasts;

-- Create a new policy that works with anon key + JWT
CREATE POLICY "Authenticated users can insert podcasts"
  ON podcasts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
