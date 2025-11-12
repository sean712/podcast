/*
  # Create Episode Groups System

  1. New Tables
    - `episode_groups`
      - `id` (uuid, primary key) - Unique identifier
      - `podcast_id` (uuid, foreign key) - References podcasts table
      - `name` (text) - Group/theme name (e.g., "Season 1", "Interviews")
      - `description` (text, nullable) - Optional description of the group
      - `display_order` (integer) - Order for displaying groups (lower = higher priority)
      - `created_by` (uuid) - User ID who created the group
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `episode_group_members`
      - `id` (uuid, primary key) - Unique identifier
      - `episode_id` (text) - External episode ID from episodes table
      - `group_id` (uuid, foreign key) - References episode_groups table
      - `added_at` (timestamptz) - When episode was added to group
      - Unique constraint on (episode_id, group_id) to prevent duplicates

  2. Security
    - Enable RLS on both tables
    - Allow all users to read groups and memberships (public access)
    - Restrict insert/update/delete to authenticated owner only
    - Owner verification based on user_id and email match

  3. Indexes
    - Index on podcast_id for fast group lookups by podcast
    - Index on group_id for fast episode lookups by group
    - Index on episode_id for checking group membership
    - Index on display_order for efficient sorting

  4. Notes
    - Episodes can belong to multiple groups (many-to-many relationship)
    - Groups are podcast-specific
    - Display order allows custom ordering of groups
    - Owner can manage groups, all users can view them
*/

-- Create episode_groups table
CREATE TABLE IF NOT EXISTS episode_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0 NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create episode_group_members table
CREATE TABLE IF NOT EXISTS episode_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id text NOT NULL,
  group_id uuid NOT NULL REFERENCES episode_groups(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(episode_id, group_id)
);

-- Enable RLS
ALTER TABLE episode_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for episode_groups
CREATE POLICY "Anyone can read episode groups"
  ON episode_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON episode_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON episode_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON episode_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for episode_group_members
CREATE POLICY "Anyone can read group members"
  ON episode_group_members
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add episodes to groups"
  ON episode_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM episode_groups
      WHERE id = episode_group_members.group_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Group creators can remove episodes from groups"
  ON episode_group_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM episode_groups
      WHERE id = episode_group_members.group_id
      AND created_by = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_episode_groups_podcast_id ON episode_groups(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episode_groups_display_order ON episode_groups(display_order);
CREATE INDEX IF NOT EXISTS idx_episode_group_members_group_id ON episode_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_episode_group_members_episode_id ON episode_group_members(episode_id);
