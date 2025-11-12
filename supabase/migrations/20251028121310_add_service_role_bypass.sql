/*
  # Add Service Role Bypass for Admin Operations

  1. Changes
    - Add a policy that allows service_role to bypass RLS
    - This enables admin operations to work properly
    - Keeps authentication requirement for regular users

  2. Security
    - Service role has full access (needed for Edge Functions)
    - Authenticated users can still insert
    - Public users can only read active podcasts
*/

-- Add policy for service_role to bypass all restrictions
CREATE POLICY "Service role has full access"
  ON podcasts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
