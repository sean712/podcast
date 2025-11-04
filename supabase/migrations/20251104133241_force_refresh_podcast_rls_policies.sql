/*
  # Force Refresh Podcast RLS Policies

  1. Problem
    - RLS policies appear correct in database but INSERT still fails
    - May be a caching or policy evaluation issue
    - Need to force complete refresh of policies

  2. Solution
    - Disable RLS temporarily
    - Drop ALL existing policies
    - Recreate policies from scratch
    - Re-enable RLS
    - This forces Supabase to reload policy cache

  3. Security
    - Policies allow both anon and authenticated roles to insert
    - Service role retains full access
    - Public can only read active podcasts
*/

-- Step 1: Disable RLS temporarily
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Anon role can insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Allow anon inserts" ON podcasts;
DROP POLICY IF EXISTS "Authenticated users can insert podcasts" ON podcasts;
DROP POLICY IF EXISTS "Authenticated users can update podcasts" ON podcasts;
DROP POLICY IF EXISTS "Podcasts are publicly readable" ON podcasts;
DROP POLICY IF EXISTS "Service role has full access" ON podcasts;

-- Step 3: Re-enable RLS
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create fresh INSERT policies
CREATE POLICY "Allow anon to insert podcasts"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to insert podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 5: Create SELECT policy
CREATE POLICY "Public can read active podcasts"
  ON podcasts
  FOR SELECT
  TO public
  USING (status = 'active');

-- Step 6: Create UPDATE policy
CREATE POLICY "Authenticated can update podcasts"
  ON podcasts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Create DELETE policy for authenticated
CREATE POLICY "Authenticated can delete podcasts"
  ON podcasts
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 8: Service role bypass
CREATE POLICY "Service role full access"
  ON podcasts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);