-- ============================================================
-- NursePrep — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password_hash text not null,
  created_at timestamptz default now(),
  session_count int default 0,
  perfect_streak int default 0,
  upload_count int default 0,
  liked_count int default 0,
  is_top_liked boolean default false,
  overall_accuracy int default 0,
  total_correct int default 0,
  total_answered int default 0,
  achievements text[] default '{}',
  profile_private boolean default false
);

-- ── Invite Codes ─────────────────────────────────────────────
create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  used boolean default false,
  created_by text not null,
  created_at timestamptz default now()
);

-- Seed first invite code
insert into invite_codes (code, used, created_by)
values ('NURSE2026', false, 'system')
on conflict (code) do nothing;

-- ── Tests ────────────────────────────────────────────────────
create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  questions jsonb not null default '[]',
  created_by text not null,
  created_by_id uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  thumbs_up int default 0,
  thumbs_down int default 0,
  hidden boolean default false,
  flagged boolean default false,
  reviewed boolean default false,
  reviewed_by text,
  reporters uuid[] default '{}',
  user_ratings jsonb default '{}'
);

-- ── Sessions ─────────────────────────────────────────────────
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  username text not null,
  test_id uuid references tests(id) on delete set null,
  test_name text,
  score int default 0,
  total int default 0,
  accuracy int default 0,
  attempts jsonb default '{}',
  confidence_map jsonb default '[]',
  is_public boolean default false,
  created_at timestamptz default now()
);

-- ── Comments ─────────────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  username text not null,
  text text not null,
  created_at timestamptz default now()
);

-- ── Wrong Answers Map ────────────────────────────────────────
create table if not exists wrong_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id text not null,
  wrong_count int default 0,
  unique(user_id, question_id)
);

-- ── Quiz Resume ──────────────────────────────────────────────
create table if not exists quiz_resume (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  test_id uuid references tests(id) on delete cascade,
  queue jsonb not null,
  current_index int default 0,
  stats jsonb not null,
  updated_at timestamptz default now(),
  unique(user_id, test_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table users enable row level security;
alter table invite_codes enable row level security;
alter table tests enable row level security;
alter table sessions enable row level security;
alter table comments enable row level security;
alter table wrong_answers enable row level security;
alter table quiz_resume enable row level security;

-- Users: anyone can read public profiles, users manage their own
create policy "Public profiles readable" on users for select using (not profile_private or id = auth.uid());
create policy "Users update own profile" on users for update using (id = auth.uid());
create policy "Anyone can insert user" on users for insert with check (true);

-- Invite codes: anyone can read/update (to mark used)
create policy "Anyone can read invite codes" on invite_codes for select using (true);
create policy "Anyone can update invite codes" on invite_codes for update using (true);
create policy "Anyone can insert invite codes" on invite_codes for insert with check (true);

-- Tests: visible if not hidden
create policy "Read visible tests" on tests for select using (not hidden or created_by_id = auth.uid());
create policy "Anyone can insert test" on tests for insert with check (true);
create policy "Owner or reviewer can update test" on tests for update using (true);
create policy "Owner can delete test" on tests for delete using (created_by_id = auth.uid());

-- Sessions: users see own, public sessions visible to all
create policy "Users see own sessions" on sessions for select using (user_id = auth.uid() or is_public = true);
create policy "Users insert own sessions" on sessions for insert with check (true);

-- Comments: all readable, authenticated insert
create policy "Comments readable" on comments for select using (true);
create policy "Anyone can comment" on comments for insert with check (true);

-- Wrong answers: own only
create policy "Own wrong answers" on wrong_answers for all using (user_id = auth.uid());
create policy "Insert wrong answers" on wrong_answers for insert with check (true);

-- Quiz resume: own only
create policy "Own quiz resume" on quiz_resume for all using (user_id = auth.uid());
create policy "Insert quiz resume" on quiz_resume for insert with check (true);
