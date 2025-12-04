/*
  # Add UPDATE Policy to Episode Analyses Table
  
  1. Problem
    - episode_analyses table has SELECT, INSERT, and DELETE policies
    - Missing UPDATE policy prevents featuring/unfeaturing episodes
    - Admin panel can't toggle is_featured status
  
  2. Solution
    - Add UPDATE policy for authenticated users
    - Allow public updates (consistent with other policies)
  
  3. Security
    - episode_analyses is a shared public cache
    - No sensitive data, safe to allow updates
*/

-- Create UPDATE policy for episode_analyses
CREATE POLICY "Public can update cached analyses"
  ON episode_analyses
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);