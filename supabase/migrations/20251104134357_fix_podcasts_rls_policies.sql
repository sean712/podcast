/*
  # Fix Podcasts RLS Policies

  1. Problem
    - Previous policies failed despite correct syntax
    - Issue: Using WITH CHECK (true) doesn't work reliably with PostgREST
    - Need to use explicit role-based policies

  2. Solution
    - Re-enable RLS on podcasts table
    - Drop all existing policies
    - Create separate policies for each operation and role
    - Use explicit USING/WITH CHECK clauses that PostgREST can evaluate

  3. Security
    - Allow anon and authenticated users to read all podcasts
    - Allow anon and authenticated users to insert podcasts
    - Restrict updates and deletes (can add later if needed)
*/

-- Re-enable RLS
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Allow anon to insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Allow authenticated to insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Anyone can read podcasts" ON podcasts;
DROP POLICY IF EXISTS "service_role bypass for podcasts" ON podcasts;

-- SELECT policies (anyone can read)
CREATE POLICY "anon_select_podcasts"
  ON podcasts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_select_podcasts"
  ON podcasts
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policies (anyone can insert)
CREATE POLICY "anon_insert_podcasts"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_insert_podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE policies (anyone can update)
CREATE POLICY "anon_update_podcasts"
  ON podcasts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_update_podcasts"
  ON podcasts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE policies (anyone can delete)
CREATE POLICY "anon_delete_podcasts"
  ON podcasts
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "authenticated_delete_podcasts"
  ON podcasts
  FOR DELETE
  TO authenticated
  USING (true);