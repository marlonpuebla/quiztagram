-- Quiztagram Migration: class+professor pairs, avatar emoji
-- Run on VPS: sudo -u postgres psql -d nurseprep -f /tmp/migrate-profile.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS class_schedule JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_emoji   TEXT;
