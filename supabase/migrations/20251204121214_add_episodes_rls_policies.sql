/*
  # Add RLS Policies for Episodes Table
  
  1. Problem
    - RLS is enabled on episodes table but no SELECT policies exist
    - This blocks all users (including anonymous) from reading episodes
    - Featured episodes page fails because it cannot query episodes
  
  2. Solution
    - Create SELECT policies for anon and authenticated roles
    - Allow public read access to all episodes
  
  3. Security
    - Episodes are public content, safe to expose to all users
    - Maintains consistency with podcasts table policies
*/

-- Drop any existing policies first
DROP POLICY IF EXISTS "anon_select_episodes" ON episodes;
DROP POLICY IF EXISTS "authenticated_select_episodes" ON episodes;

-- Create SELECT policies for episodes (anyone can read)
CREATE POLICY "anon_select_episodes"
  ON episodes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_select_episodes"
  ON episodes
  FOR SELECT
  TO authenticated
  USING (true);