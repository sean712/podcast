/*
  # Fix Episode Analyses RLS Policies for Anonymous Users

  ## Summary
  Update Row Level Security policies on the episode_analyses table to allow anonymous (unauthenticated) users to read and write cached episode analyses. This fixes an issue where AI analysis was re-running on every page load for unauthenticated users because they couldn't access the shared cache.

  ## Problem
  - The episode_analyses table had policies restricted to `authenticated` role only
  - Unauthenticated users could view podcast episodes but couldn't read/write to the analysis cache
  - This caused the AI to re-analyze transcripts on every load, wasting resources and time
  - Some data appeared to load (people, timeline) but not others (overview, locations) due to inconsistent cache access

  ## Changes
  1. Drop existing restrictive RLS policies on episode_analyses
  2. Create new SELECT policy allowing both `anon` and `authenticated` roles
  3. Create new INSERT policy allowing both `anon` and `authenticated` roles
  4. Keep the cache globally accessible as intended - any user benefits from cached analyses

  ## Security Considerations
  - The episode_analyses table is designed as a shared public cache
  - No sensitive user data is stored in this table
  - All analyses are based on publicly accessible podcast transcripts
  - Allowing anonymous access aligns with the app's design (public podcast viewing)

  ## Expected Outcome
  - First user (authenticated or not) to view an episode triggers AI analysis
  - Analysis is saved to database successfully
  - All subsequent users (on any device/browser) load instantly from cache
  - No duplicate analysis runs, saving time and API costs
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read cached analyses" ON episode_analyses;
DROP POLICY IF EXISTS "Anyone can create cached analyses" ON episode_analyses;

-- Create new SELECT policy for both anonymous and authenticated users
CREATE POLICY "Public can read cached analyses"
  ON episode_analyses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create new INSERT policy for both anonymous and authenticated users
CREATE POLICY "Public can create cached analyses"
  ON episode_analyses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies needed
-- Cache entries are immutable once created (only new versions via analysis_version column)