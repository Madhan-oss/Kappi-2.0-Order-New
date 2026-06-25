-- ══════════════════════════════════════════════════════════════
-- Kappi 2.0 Order — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- 1. Create the sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL UNIQUE,        -- one row per day e.g. "2025-01-15"
  members     JSONB NOT NULL DEFAULT '[]', -- full members array
  menu        JSONB NOT NULL DEFAULT '[]', -- full menu array (including custom items)
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index on date for fast lookups
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions (date);

-- 3. Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read sessions (your team reads orders)
CREATE POLICY "Public read" ON sessions
  FOR SELECT USING (true);

-- 5. Allow anyone to insert/update sessions (your team saves orders)
CREATE POLICY "Public insert" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update" ON sessions
  FOR UPDATE USING (true);

-- 6. Enable Realtime so changes broadcast instantly to all browsers
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- ══════════════════════════════════════════════════════════════
-- Done! Your database is ready.
-- ══════════════════════════════════════════════════════════════
