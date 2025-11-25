/*
  # Enable Daily Episode Sync Cron Job

  1. Extensions
    - Enable pg_cron extension for scheduled jobs
    - Enable pg_net extension for HTTP requests

  2. Scheduled Job
    - Create cron job to run daily-sync edge function
    - Runs every day at 2 AM UTC
    - Uses service role key for authentication

  3. Notes
    - The cron job calls the daily-sync edge function
    - The function handles all sync logic and logging
    - Adjust schedule by updating the cron.schedule call
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing job if it exists (for idempotency)
SELECT cron.unschedule('daily-episode-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-episode-sync'
);

-- Schedule daily episode sync job
-- Runs at 2 AM UTC every day
SELECT cron.schedule(
  'daily-episode-sync',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://bebtnzxfifmjxlvdjgzh.supabase.co/functions/v1/daily-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) AS request_id;
  $$
);

-- Add a comment explaining the job
COMMENT ON EXTENSION pg_cron IS 'Enables scheduled jobs for automated episode syncing';

-- Create a view to easily check cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'daily-episode-sync';

COMMENT ON VIEW cron_job_status IS 'View to check the status of the daily episode sync cron job';
