-- Quiztagram Migration: Academic Demographics, Test Metadata, Verifications
-- Run on VPS: psql $DATABASE_URL -f migrate.sql

-- Users: demographics (all optional, professor always private)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_to_mutual_only BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enrolled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS classes TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS professor TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demographics_privacy TEXT DEFAULT 'private';
ALTER TABLE users ADD COLUMN IF NOT EXISTS classes_updated_at TIMESTAMPTZ;

-- Tests: academic metadata for filtering/search
ALTER TABLE tests ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS professor TEXT;

-- Follows (in case not yet created)
CREATE TABLE IF NOT EXISTS follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Notifications (in case not yet created)
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  actor_id       UUID,
  actor_username TEXT,
  data           JSONB DEFAULT '{}',
  read           BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Real-exam verifications
CREATE TABLE IF NOT EXISTS test_verifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id          UUID REFERENCES tests(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  passed           BOOLEAN NOT NULL,
  semester_taken   TEXT,
  profile_complete BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);
