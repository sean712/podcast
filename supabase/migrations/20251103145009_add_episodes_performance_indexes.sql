/*
  # Add Performance Indexes for Episodes Table

  1. Indexes Added
    - Composite index on (podcast_id, published_at DESC) for episode list queries
    - Index on episode_id for fast lookups
    - Index on slug for episode routing

  2. Performance Impact
    - Speeds up episode list queries by podcast_id
    - Optimizes episode lookups by ID
    - Improves episode routing by slug
    - Reduces query time from seconds to milliseconds
*/

-- Index for fetching episodes by podcast with date ordering
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_published 
  ON episodes(podcast_id, published_at DESC);

-- Index for fast episode lookups by ID
CREATE INDEX IF NOT EXISTS idx_episodes_episode_id 
  ON episodes(episode_id);

-- Index for episode routing by slug
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_slug 
  ON episodes(podcast_id, slug);
