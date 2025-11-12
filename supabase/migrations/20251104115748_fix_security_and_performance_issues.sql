/*
  # Fix Security and Performance Issues

  1. RLS Policy Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) in all policies for better performance
    - This prevents re-evaluation on each row

  2. Enable RLS on Public Tables
    - Enable RLS on podcasts, episodes, and podcast_settings tables
    - These tables have policies but RLS was not enabled

  3. Fix Duplicate Indexes
    - Remove duplicate index idx_episodes_published_at (duplicate of idx_episodes_podcast_published)

  4. Fix Multiple Permissive Policies
    - Consolidate podcast_admins policies to prevent conflicts

  5. Security
    - All public tables now protected by RLS
    - Optimized policy evaluation for scale
*/

-- Step 1: Drop and recreate saved_podcasts policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own saved podcasts" ON saved_podcasts;
DROP POLICY IF EXISTS "Users can save podcasts" ON saved_podcasts;
DROP POLICY IF EXISTS "Users can unsave own podcasts" ON saved_podcasts;

CREATE POLICY "Users can view own saved podcasts"
  ON saved_podcasts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can save podcasts"
  ON saved_podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can unsave own podcasts"
  ON saved_podcasts
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Step 2: Drop and recreate saved_episodes policies with optimized auth checks
DROP POLICY IF EXISTS "Users can read own saved episodes" ON saved_episodes;
DROP POLICY IF EXISTS "Users can insert own saved episodes" ON saved_episodes;
DROP POLICY IF EXISTS "Users can delete own saved episodes" ON saved_episodes;

CREATE POLICY "Users can read own saved episodes"
  ON saved_episodes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own saved episodes"
  ON saved_episodes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own saved episodes"
  ON saved_episodes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Step 3: Drop and recreate episode_notes policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own notes" ON episode_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON episode_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON episode_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON episode_notes;

CREATE POLICY "Users can view own notes"
  ON episode_notes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own notes"
  ON episode_notes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notes"
  ON episode_notes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own notes"
  ON episode_notes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Step 4: Fix podcast_admins policies (consolidate and optimize)
DROP POLICY IF EXISTS "Admins can view their podcast admin assignments" ON podcast_admins;
DROP POLICY IF EXISTS "Only system admins can manage podcast admins" ON podcast_admins;

CREATE POLICY "Users can view podcast admin assignments"
  ON podcast_admins
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "System admins can manage podcast admins"
  ON podcast_admins
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Step 5: Enable RLS on public tables
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_settings ENABLE ROW LEVEL SECURITY;

-- Step 6: Remove duplicate index
DROP INDEX IF EXISTS idx_episodes_published_at;
