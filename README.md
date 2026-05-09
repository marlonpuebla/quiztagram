# 🩺 NursePrep — Deployment Guide

## What You Need (all free)
- [GitHub](https://github.com) account
- [Supabase](https://supabase.com) account (free tier)
- [Vercel](https://vercel.com) account (free tier)

---

## Step 1 — Set Up Supabase (your database)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `nurseprep`, choose a strong password, pick a region close to you
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** (left sidebar)
5. Click **New Query**, paste the entire contents of `supabase/schema.sql`, click **Run**
6. Go to **Settings → API**
7. Copy:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon / public** key → long string starting with `eyJ...`

---

## Step 2 — Configure Environment Variables

1. In the project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
   ```
   - Get your Anthropic key at [console.anthropic.com](https://console.anthropic.com)
   - The Anthropic key is optional but enables AI tag validation when adding tests

---

## Step 3 — Test Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the login screen.

Register with invite code: **NURSE2026**

---

## Step 4 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial NursePrep"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nurseprep.git
git push -u origin main
```

> ⚠️ Make sure `.env` is in `.gitignore` (it is by default). Never push your API keys.

---

## Step 5 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects Vite — no config needed
4. Before clicking Deploy, go to **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
   - `VITE_ANTHROPIC_API_KEY` → your Anthropic key (optional)
5. Click **Deploy**
6. In ~1 minute you get a live URL like `nurseprep.vercel.app`

---

## Step 6 — Share with Friends

Send your friends the Vercel URL. They register with invite codes you generate inside the app.

The first invite code is: **NURSE2026** (seeded automatically in the database)

---

## Updating the App Later

Every time you push to GitHub, Vercel auto-redeploys:

```bash
git add .
git commit -m "Update"
git push
```

---

## Project Structure

```
nurseprep/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Build config
├── .env.example            # Env vars template (copy to .env)
├── .gitignore
├── supabase/
│   └── schema.sql          # Run this in Supabase SQL Editor
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # All screens & components
    ├── db.js               # All Supabase queries
    ├── supabase.js         # Supabase client
    ├── i18n.js             # EN/ES translations
    └── styles.js           # All CSS
```

---

## Database Tables

| Table          | Purpose                              |
|----------------|--------------------------------------|
| `users`        | Accounts, stats, achievements        |
| `invite_codes` | One-time registration codes          |
| `tests`        | Test submissions with questions JSON |
| `sessions`     | Quiz session results                 |
| `comments`     | Comments on tests                    |
| `wrong_answers`| Per-user wrong answer tracking       |
| `quiz_resume`  | Saved mid-session progress           |

---

## Features

- ✅ Invite-only registration (username + password, SHA-256 hashed)
- ✅ Math captcha on registration
- ✅ Multiple tests, any user can submit
- ✅ AI content validation + auto-tagging when adding tests
- ✅ Quiz mode: MC + fill-in-the-blank, confidence check, wrong answers loop back
- ✅ Resume mid-session or start again
- ✅ Remedial mode: personal weakest OR community hardest
- ✅ Question filtering: difficulty, topic, wrong history
- ✅ 👍/👎 ratings + comments on tests
- ✅ Report system → 3 reports = flagged → Top 10 reviewers can correct
- ✅ Profile & result privacy controls
- ✅ Shareable result links (public sessions only)
- ✅ Leaderboard (accuracy %) with reviewer badges
- ✅ Score history per user
- ✅ Achievements with animated toast popups
- ✅ Full English / Spanish real-time switching
- ✅ Dark / Light mode
- ✅ Mobile-first responsive design
- ✅ Hide or permanently delete own submissions
- ✅ Submission dashboard with feedback stats

---

## Troubleshooting

**"Missing Supabase env vars"** — Make sure `.env` exists and has the correct keys, then restart `npm run dev`.

**Login fails immediately** — Check Supabase is running and the schema was applied correctly in the SQL Editor.

**AI validation not working** — Check your `VITE_ANTHROPIC_API_KEY` is set. This is optional — tests still upload without it.

**Invite code NURSE2026 invalid** — The seed only runs once. Check the `invite_codes` table in Supabase → Table Editor to confirm it was inserted.
