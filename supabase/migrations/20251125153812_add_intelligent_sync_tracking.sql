/*
  # Add Intelligent Sync Tracking System

  1. Changes to podcasts table
    - Add `next_check_at` (timestamptz) - When to check this podcast next for new episodes
    - Add `check_frequency_hours` (integer) - How often to check in hours (default 24)
    - Add `consecutive_empty_checks` (integer) - Track podcasts with no new episodes for adaptive scheduling
    - Add index on `next_check_at` for efficient cron queries

  2. New Tables
    - `episode_sync_logs` - Track sync job execution for monitoring and debugging
      - `id` (uuid, primary key)
      - `job_type` (text) - Type of sync: 'daily', 'manual', 'backfill'
      - `started_at` (timestamptz) - When sync started
      - `completed_at` (timestamptz) - When sync completed
      - `status` (text) - 'running', 'completed', 'failed', 'partial'
      - `podcasts_checked` (integer) - Number of podcasts checked
      - `podcasts_with_new_episodes` (integer) - Podcasts that had new content
      - `episodes_synced` (integer) - Total episodes synced
      - `episodes_failed` (integer) - Episodes that failed to sync
      - `api_calls_made` (integer) - Approximate API calls used
      - `error_message` (text) - Error details if failed
      - `details` (jsonb) - Additional metadata
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on episode_sync_logs
    - Only service role can write logs
    - Authenticated users can read logs for monitoring

  4. Configuration
    - Add default config values to app_config table
*/

-- Add tracking columns to podcasts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcasts' AND column_name = 'next_check_at'
  ) THEN
    ALTER TABLE podcasts ADD COLUMN next_check_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcasts' AND column_name = 'check_frequency_hours'
  ) THEN
    ALTER TABLE podcasts ADD COLUMN check_frequency_hours integer DEFAULT 24 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcasts' AND column_name = 'consecutive_empty_checks'
  ) THEN
    ALTER TABLE podcasts ADD COLUMN consecutive_empty_checks integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_podcasts_next_check_at ON podcasts(next_check_at) WHERE status = 'active' AND is_paused = false;

-- Create episode_sync_logs table
CREATE TABLE IF NOT EXISTS episode_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  podcasts_checked integer DEFAULT 0,
  podcasts_with_new_episodes integer DEFAULT 0,
  episodes_synced integer DEFAULT 0,
  episodes_failed integer DEFAULT 0,
  api_calls_made integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

-- Enable RLS on episode_sync_logs
ALTER TABLE episode_sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (logs are written by edge functions)
CREATE POLICY "Service role full access to sync logs"
  ON episode_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read logs for monitoring
CREATE POLICY "Authenticated users can view sync logs"
  ON episode_sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for recent logs queries
CREATE INDEX IF NOT EXISTS idx_episode_sync_logs_created_at ON episode_sync_logs(created_at DESC);

-- Add configuration entries for daily sync
INSERT INTO app_config (key, value, description, created_at, updated_at)
VALUES
  ('DAILY_SYNC_ENABLED', 'true', 'Enable/disable automated daily episode sync', now(), now()),
  ('DAILY_SYNC_HOUR_UTC', '2', 'Hour (0-23) to run daily sync in UTC', now(), now()),
  ('BATCH_PROBE_ENABLED', 'true', 'Use batch probe API for efficient checking', now(), now()),
  ('MAX_PODCASTS_PER_SYNC', '500', 'Maximum podcasts to process per sync run', now(), now()),
  ('ADAPTIVE_FREQUENCY_ENABLED', 'true', 'Adjust check frequency based on podcast activity', now(), now())
ON CONFLICT (key) DO NOTHING;

-- Add comment explaining the system
COMMENT ON COLUMN podcasts.next_check_at IS 'Timestamp when this podcast should next be checked for new episodes';
COMMENT ON COLUMN podcasts.check_frequency_hours IS 'How often to check this podcast for new episodes (in hours)';
COMMENT ON COLUMN podcasts.consecutive_empty_checks IS 'Number of consecutive checks with no new episodes (used for adaptive scheduling)';
COMMENT ON TABLE episode_sync_logs IS 'Logs of automated and manual episode sync operations for monitoring';
