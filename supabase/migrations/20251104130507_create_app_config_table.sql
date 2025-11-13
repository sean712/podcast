/*
  # Create Application Configuration Table

  1. New Tables
    - `app_config`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Configuration key name
      - `value` (text) - Configuration value (encrypted at application level)
      - `description` (text) - Description of what this config does
      - `created_at` (timestamptz) - When the config was created
      - `updated_at` (timestamptz) - When the config was last updated

  2. Security
    - Enable RLS on `app_config` table
    - Only service role can read/write (no policies needed for regular users)
    - This ensures API keys are only accessible to Edge Functions with service role

  3. Initial Configuration
    - Insert placeholder entries for required API keys
*/

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (locks down the table by default)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (Edge Functions can access)
CREATE POLICY "Service role can manage app config"
  ON app_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert placeholder configuration entries
INSERT INTO app_config (key, value, description)
VALUES 
  ('OPENAI_API_KEY', NULL, 'OpenAI API key for AI analysis features'),
  ('PODSCAN_API_KEY', NULL, 'Podscan API key for podcast data access'),
  ('PODSCAN_API_URL', 'https://podscan.fm/api/v1', 'Podscan API base URL')
ON CONFLICT (key) DO NOTHING;

-- Create function to update config timestamp
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS app_config_updated_at ON app_config;
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();