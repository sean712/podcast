/*
  # Add DELETE policy for episode_analyses table

  1. Changes
    - Add DELETE policy to allow authenticated users to delete cached analyses
    - This enables the admin panel's "Delete Analysis" feature to work properly

  2. Security
    - Only authenticated users can delete analyses
    - This is appropriate since analysis deletion is an admin function
*/

-- Add policy for authenticated users to delete cached analyses
CREATE POLICY "Authenticated users can delete cached analyses"
  ON episode_analyses
  FOR DELETE
  TO authenticated
  USING (true);
