/*
  # Temporarily Disable RLS for Podcasts Table

  1. Purpose
    - Verify that RLS is the root cause of the 403 Forbidden error
    - This is a diagnostic step only
    - Will re-enable with proper policies after testing

  2. Changes
    - Disable RLS on podcasts table
    - This allows all operations without policy checks

  3. SECURITY WARNING
    - This is NOT safe for production
    - Only for debugging the RLS issue
    - Must re-enable RLS after identifying the problem
*/

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;