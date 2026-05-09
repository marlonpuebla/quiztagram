-- NursePrep — PostgreSQL Schema
-- Run once: psql -U postgres -d nurseprep -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  session_count    INT DEFAULT 0,
  perfect_streak   INT DEFAULT 0,
  upload_count     INT DEFAULT 0,
  liked_count      INT DEFAULT 0,
  is_top_liked     BOOLEAN DEFAULT false,
  overall_accuracy INT DEFAULT 0,
  total_correct    INT DEFAULT 0,
  total_answered   INT DEFAULT 0,
  achievements     TEXT[] DEFAULT '{}',
  profile_private  BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO invite_codes (code, used, created_by)
VALUES ('NURSE2026', false, 'system')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  questions     JSONB NOT NULL DEFAULT '[]',
  created_by    TEXT NOT NULL,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  thumbs_up     INT DEFAULT 0,
  thumbs_down   INT DEFAULT 0,
  user_ratings  JSONB DEFAULT '{}',
  hidden        BOOLEAN DEFAULT false,
  flagged       BOOLEAN DEFAULT false,
  reviewed      BOOLEAN DEFAULT false,
  reviewed_by   TEXT,
  reporters     UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  username       TEXT NOT NULL,
  test_id        UUID REFERENCES tests(id) ON DELETE SET NULL,
  test_name      TEXT,
  score          INT DEFAULT 0,
  total          INT DEFAULT 0,
  accuracy       INT DEFAULT 0,
  attempts       JSONB DEFAULT '{}',
  confidence_map JSONB DEFAULT '[]',
  is_public      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id    UUID REFERENCES tests(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wrong_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  wrong_count INT DEFAULT 1,
  UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS quiz_resume (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  test_id       UUID REFERENCES tests(id) ON DELETE CASCADE,
  queue         JSONB NOT NULL,
  current_index INT DEFAULT 0,
  stats         JSONB NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, test_id)
);
