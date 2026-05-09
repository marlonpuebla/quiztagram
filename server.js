import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password_hash } = req.body
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2',
      [username, password_hash]
    )
    if (!rows[0]) return res.status(401).json({ error: 'invalid' })
    res.json({ user: rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'db' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password_hash, invite_code } = req.body
    const { rows: codes } = await pool.query(
      "SELECT * FROM invite_codes WHERE code = $1 AND used = false",
      [invite_code.toUpperCase()]
    )
    if (!codes[0]) return res.status(400).json({ error: 'invite' })
    await pool.query('UPDATE invite_codes SET used = true WHERE id = $1', [codes[0].id])
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, session_count, perfect_streak, upload_count,
       liked_count, overall_accuracy, total_correct, total_answered, achievements, profile_private)
       VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 0, '{}', false) RETURNING *`,
      [username, password_hash]
    )
    res.json({ user: rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'username_taken' })
    res.status(500).json({ error: 'db' })
  }
})

// ── Users ─────────────────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, session_count, overall_accuracy FROM users')
  res.json(rows)
})

app.get('/api/users/public', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, display_name, show_to_mutual_only, session_count, overall_accuracy, achievements FROM users WHERE profile_private = false ORDER BY overall_accuracy DESC'
  )
  res.json(rows)
})

app.get('/api/users/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  res.json(rows[0] || null)
})

app.put('/api/users/:id', async (req, res) => {
  try {
    const updates = req.body
    const entries = Object.entries(updates)
    if (!entries.length) return res.json(null)
    // Username uniqueness check
    if (updates.username) {
      const { rows: existing } = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [updates.username, req.params.id]
      )
      if (existing.length > 0) return res.status(400).json({ error: 'username_taken' })
    }
    const textArrayCols = ['achievements', 'classes']
    const jsonbCols     = ['class_schedule']
    const setClauses = entries.map(([k], i) => {
      if (textArrayCols.includes(k)) return `${k} = $${i + 1}::text[]`
      if (jsonbCols.includes(k))     return `${k} = $${i + 1}::jsonb`
      return `${k} = $${i + 1}`
    }).join(', ')
    const values = [...entries.map(([k, v]) => jsonbCols.includes(k) ? JSON.stringify(v) : v), req.params.id]
    const { rows } = await pool.query(
      `UPDATE users SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
      values
    )
    res.json(rows[0] || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/academic/suggestions', async (req, res) => {
  try {
    const [{ rows: cols }, { rows: progs }] = await Promise.all([
      pool.query("SELECT DISTINCT college FROM users WHERE college IS NOT NULL AND college <> '' ORDER BY college LIMIT 60"),
      pool.query("SELECT DISTINCT program FROM users WHERE program IS NOT NULL AND program <> '' ORDER BY program LIMIT 60"),
    ])
    res.json({ colleges: cols.map(r => r.college), programs: progs.map(r => r.program) })
  } catch { res.json({ colleges: [], programs: [] }) }
})

// ── Invites ───────────────────────────────────────────────────────────────────

app.get('/api/invites', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM invite_codes WHERE created_by = $1 ORDER BY created_at DESC',
    [req.query.username]
  )
  res.json(rows)
})

app.post('/api/invites', async (req, res) => {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  const { rows } = await pool.query(
    'INSERT INTO invite_codes (code, used, created_by) VALUES ($1, false, $2) RETURNING *',
    [code, req.body.created_by]
  )
  res.json(rows[0])
})

// ── Tests ─────────────────────────────────────────────────────────────────────

app.get('/api/tests', async (req, res) => {
  const metaComplete = `(college IS NOT NULL AND program IS NOT NULL AND semester IS NOT NULL)`
  if (req.query.userId) {
    const { rows } = await pool.query(
      'SELECT * FROM tests WHERE created_by_id = $1 ORDER BY created_at DESC',
      [req.query.userId]
    )
    return res.json(rows)
  }
  if (req.query.search) {
    const term = `%${req.query.search}%`
    const { rows } = await pool.query(
      `SELECT * FROM tests WHERE hidden = false AND (
        LOWER(name) LIKE LOWER($1) OR LOWER(created_by) LIKE LOWER($1) OR
        LOWER(COALESCE(college,'')) LIKE LOWER($1) OR
        LOWER(COALESCE(program,'')) LIKE LOWER($1) OR
        LOWER(COALESCE(semester,'')) LIKE LOWER($1)
      ) ORDER BY ${metaComplete} DESC, created_at DESC`,
      [term]
    )
    return res.json(rows)
  }
  const { rows } = await pool.query(
    `SELECT * FROM tests WHERE hidden = false ORDER BY ${metaComplete} DESC, created_at DESC`
  )
  res.json(rows)
})

app.get('/api/tests/:id/stats', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT accuracy FROM sessions WHERE test_id = $1', [req.params.id]
  )
  if (!rows.length) return res.json({ totalTaken: 0, avgScore: 0 })
  const avg = Math.round(rows.reduce((a, s) => a + s.accuracy, 0) / rows.length)
  res.json({ totalTaken: rows.length, avgScore: avg })
})

app.get('/api/tests/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tests WHERE id = $1', [req.params.id])
  res.json(rows[0] || null)
})

app.post('/api/tests', async (req, res) => {
  try {
    const { name, questions, created_by, created_by_id, thumbs_up, thumbs_down, hidden, college, program, semester, professor } = req.body
    const { rows } = await pool.query(
      `INSERT INTO tests (name, questions, created_by, created_by_id, thumbs_up, thumbs_down, hidden, college, program, semester, professor)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, JSON.stringify(questions), created_by, created_by_id, thumbs_up || 0, thumbs_down || 0, hidden || false,
       college || null, program || null, semester || null, professor || null]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/tests/:id', async (req, res) => {
  try {
    const updates = req.body
    const entries = Object.entries(updates)
    if (!entries.length) return res.json(null)
    const jsonb = ['questions', 'user_ratings']
    const setClauses = entries.map(([k], i) =>
      jsonb.includes(k) ? `${k} = $${i + 1}::jsonb` : `${k} = $${i + 1}`
    ).join(', ')
    const values = entries.map(([k, v]) => jsonb.includes(k) ? JSON.stringify(v) : v)
    values.push(req.params.id)
    const { rows } = await pool.query(
      `UPDATE tests SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
      values
    )
    res.json(rows[0] || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/tests/:id', async (req, res) => {
  await pool.query('DELETE FROM tests WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// ── Sessions ──────────────────────────────────────────────────────────────────

app.get('/api/sessions', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC',
    [req.query.userId]
  )
  res.json(rows)
})

app.get('/api/sessions/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [req.params.id])
  res.json(rows[0] || null)
})

app.post('/api/sessions', async (req, res) => {
  try {
    const { user_id, username, test_id, test_name, score, total, accuracy, attempts, confidence_map, is_public } = req.body
    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, username, test_id, test_name, score, total, accuracy, attempts, confidence_map, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10) RETURNING *`,
      [user_id, username, test_id, test_name, score, total, accuracy, JSON.stringify(attempts), JSON.stringify(confidence_map), is_public]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Comments ──────────────────────────────────────────────────────────────────

app.get('/api/comments', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE test_id = $1 ORDER BY created_at ASC',
    [req.query.testId]
  )
  res.json(rows)
})

app.post('/api/comments', async (req, res) => {
  const { test_id, user_id, username, text } = req.body
  const { rows } = await pool.query(
    'INSERT INTO comments (test_id, user_id, username, text) VALUES ($1, $2, $3, $4) RETURNING *',
    [test_id, user_id, username, text]
  )
  try {
    const { rows: testRows } = await pool.query('SELECT created_by_id, name FROM tests WHERE id = $1', [test_id])
    if (testRows[0] && testRows[0].created_by_id && testRows[0].created_by_id !== user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, actor_id, actor_username, data, read)
         VALUES ($1, 'new_comment', $2, $3, $4::jsonb, false)`,
        [testRows[0].created_by_id, user_id, username, JSON.stringify({ test_id, test_name: testRows[0].name })]
      )
    }
  } catch {}
  res.json(rows[0])
})

// ── Wrong Answers ─────────────────────────────────────────────────────────────

app.get('/api/wrong-answers/:userId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT question_id, wrong_count FROM wrong_answers WHERE user_id = $1',
    [req.params.userId]
  )
  const map = {}
  rows.forEach(r => { map[r.question_id] = r.wrong_count })
  res.json(map)
})

app.post('/api/wrong-answers', async (req, res) => {
  const { user_id, question_id } = req.body
  await pool.query(
    `INSERT INTO wrong_answers (user_id, question_id, wrong_count) VALUES ($1, $2, 1)
     ON CONFLICT (user_id, question_id) DO UPDATE SET wrong_count = wrong_answers.wrong_count + 1`,
    [user_id, question_id]
  )
  res.json({ ok: true })
})

// ── Quiz Resume ───────────────────────────────────────────────────────────────

app.get('/api/quiz-resume/:userId/:testId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM quiz_resume WHERE user_id = $1 AND test_id = $2',
    [req.params.userId, req.params.testId]
  )
  res.json(rows[0] || null)
})

app.put('/api/quiz-resume', async (req, res) => {
  const { user_id, test_id, queue, current_index, stats } = req.body
  await pool.query(
    `INSERT INTO quiz_resume (user_id, test_id, queue, current_index, stats, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, NOW())
     ON CONFLICT (user_id, test_id)
     DO UPDATE SET queue = $3::jsonb, current_index = $4, stats = $5::jsonb, updated_at = NOW()`,
    [user_id, test_id, JSON.stringify(queue), current_index, JSON.stringify(stats)]
  )
  res.json({ ok: true })
})

app.delete('/api/quiz-resume/:userId/:testId', async (req, res) => {
  await pool.query(
    'DELETE FROM quiz_resume WHERE user_id = $1 AND test_id = $2',
    [req.params.userId, req.params.testId]
  )
  res.json({ ok: true })
})

// ── Follows ───────────────────────────────────────────────────────────────────

app.post('/api/follows', async (req, res) => {
  try {
    const { follower_id, follower_username, following_id } = req.body
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [follower_id, following_id]
    )
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id, actor_username, data, read)
       VALUES ($1, 'new_follower', $2, $3, '{}', false)`,
      [following_id, follower_id, follower_username]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/follows/:followerId/:followingId', async (req, res) => {
  await pool.query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [req.params.followerId, req.params.followingId]
  )
  res.json({ ok: true })
})

app.get('/api/follows/check', async (req, res) => {
  const { followerId, followingId } = req.query
  const { rows } = await pool.query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  )
  res.json({ following: rows.length > 0 })
})

app.get('/api/users/:id/followers', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.session_count, u.overall_accuracy
     FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = $1`,
    [req.params.id]
  )
  res.json(rows)
})

app.get('/api/users/:id/following', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.session_count, u.overall_accuracy
     FROM follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = $1`,
    [req.params.id]
  )
  res.json(rows)
})

// ── Notifications ─────────────────────────────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.query.userId]
  )
  res.json(rows)
})

app.get('/api/notifications/unread-count', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
    [req.query.userId]
  )
  res.json({ count: parseInt(rows[0].count) })
})

app.put('/api/notifications/read', async (req, res) => {
  await pool.query(
    'UPDATE notifications SET read = true WHERE user_id = $1',
    [req.body.userId]
  )
  res.json({ ok: true })
})

app.post('/api/notifications', async (req, res) => {
  try {
    const { user_id, type, actor_id, actor_username, data } = req.body
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id, actor_username, data, read)
       VALUES ($1, $2, $3, $4, $5::jsonb, false) RETURNING *`,
      [user_id, type, actor_id, actor_username, JSON.stringify(data || {})]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Password Reset ────────────────────────────────────────────────────────────

const sendResetEmail = async (toEmail, resetUrl) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not set')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:2rem;font-weight:800;background:linear-gradient(45deg,#405DE6,#5851DB,#833AB4,#C13584,#E1306C,#F77737,#FCAF45);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Quiztagram</span>
    </div>
    <div style="background:#1C1C1C;border:1px solid #363636;border-radius:12px;padding:28px;">
      <h2 style="color:#FAFAFA;margin:0 0 10px;font-size:1.05rem;font-weight:700;">Reset your password</h2>
      <p style="color:#8E8E8E;font-size:0.86rem;line-height:1.7;margin:0 0 24px;">
        We received a request to reset your Quiztagram password. Click the button below to set a new one. This link expires in <strong style="color:#FAFAFA;">1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:block;text-align:center;background:#0095F6;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;font-size:0.9rem;">Reset Password</a>
      <p style="color:#8E8E8E;font-size:0.75rem;line-height:1.6;margin:20px 0 0;">
        If you didn't request this, you can safely ignore this email. Your password will not change.
      </p>
      <p style="color:#8E8E8E;font-size:0.72rem;margin:12px 0 0;word-break:break-all;">
        Or copy this link: <span style="color:#0095F6;">${resetUrl}</span>
      </p>
    </div>
    <p style="text-align:center;color:#8E8E8E;font-size:0.68rem;margin-top:20px;line-height:1.6;">
      Quiztagram · Study aid only · Not affiliated with NCLEX, ATI, or Hesi<br>
      <a href="https://quiztagram.com" style="color:#0095F6;text-decoration:none;">quiztagram.com</a>
    </p>
  </div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'noreply@quiztagram.com', to: toEmail, subject: 'Reset your Quiztagram password', html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Resend error ${res.status}`)
  }
}

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body
    if (!username?.trim()) return res.json({ ok: true })
    const { rows } = await pool.query('SELECT id, email FROM users WHERE username = $1 OR email = $1', [username.trim()])
    // Always return ok — never reveal whether username exists or has email
    if (!rows[0]?.email) return res.json({ ok: true })
    const user = rows[0]
    // Invalidate any active tokens for this user
    await pool.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [user.id])
    const { rows: tokenRows } = await pool.query(
      'INSERT INTO password_resets (user_id) VALUES ($1) RETURNING token',
      [user.id]
    )
    const token = tokenRows[0].token
    const resetUrl = `https://quiztagram.com?reset=${token}`
    await sendResetEmail(user.email, resetUrl)
    res.json({ ok: true })
  } catch (err) {
    console.error('forgot-password error:', err.message)
    res.json({ ok: true }) // never expose internals
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password_hash } = req.body
    if (!token || !password_hash) return res.status(400).json({ error: 'missing_fields' })
    const { rows } = await pool.query(
      `SELECT user_id FROM password_resets
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )
    if (!rows[0]) return res.status(400).json({ error: 'invalid_token' })
    const userId = rows[0].user_id
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, userId])
    await pool.query('UPDATE password_resets SET used = true WHERE token = $1', [token])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Verifications ─────────────────────────────────────────────────────────────

app.get('/api/tests/:id/verifications', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tv.id, tv.test_id, tv.user_id, tv.passed, tv.semester_taken, tv.profile_complete, tv.created_at
       FROM test_verifications tv
       WHERE tv.test_id = $1
       ORDER BY tv.profile_complete DESC, tv.created_at DESC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/verifications', async (req, res) => {
  try {
    const { test_id, user_id, passed, semester_taken, profile_complete } = req.body
    const { rows } = await pool.query(
      `INSERT INTO test_verifications (test_id, user_id, passed, semester_taken, profile_complete)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (test_id, user_id)
       DO UPDATE SET passed = $3, semester_taken = $4, profile_complete = $5, created_at = NOW()
       RETURNING *`,
      [test_id, user_id, passed, semester_taken || null, profile_complete || false]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── AI Validate ───────────────────────────────────────────────────────────────

app.post('/api/validate', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 800,
        messages: [{ role: 'user', content: `Validate and tag these nursing exam questions.
1. If NOT legitimate nursing/medical content, return: {"valid":false,"reason":"explanation"}
2. If valid return: {"valid":true,"topics":["tag1","tag2"],"difficulties":{"questionId":"easy|medium|hard"}}
Questions: ${JSON.stringify(req.body.questions)}
Return ONLY JSON.` }],
      }),
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── AI Artifact Import ────────────────────────────────────────────────────────

app.post('/api/tests/import-artifact', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
  const { artifactCode, name, created_by, created_by_id, college, program, semester } = req.body
  if (!artifactCode?.trim()) return res.status(400).json({ error: 'No artifact provided' })
  if (!name?.trim()) return res.status(400).json({ error: 'Test name required' })
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 4000,
        messages: [{ role: 'user', content: `Extract all quiz questions from this AI-generated artifact and convert them to this exact JSON array. Return ONLY the JSON array, no markdown fences, no explanation.

Each item must follow this schema:
{"id":"q1","question":"full question text","type":"multiple_choice","options":["A. ...","B. ...","C. ...","D. ..."],"answer":{"en":"A. exact option text"},"explanation":"why correct","topic":"nursing topic","difficulty":"easy|medium|hard"}

For true/false use type "multiple_choice" with options ["A. True","B. False"].
For open-ended use type "fill" with no options and answer:{"en":"expected answer"}.
The answer.en value must exactly match one of the options strings (case-sensitive).

Artifact:
${artifactCode.slice(0, 18000)}` }],
      }),
    })
    const ai = await response.json()
    const text = ai.content?.find(c => c.type === 'text')?.text || ''
    let questions
    try { questions = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch { return res.status(400).json({ error: 'Could not parse questions from artifact. Make sure you pasted the full artifact code.' }) }
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ error: 'No questions found in artifact.' })
    const { rows } = await pool.query(
      `INSERT INTO tests (name, questions, created_by, created_by_id, thumbs_up, thumbs_down, hidden, college, program, semester, ai_imported)
       VALUES ($1, $2, $3, $4, 0, 0, false, $5, $6, $7, true) RETURNING *`,
      [name.trim(), JSON.stringify(questions), created_by, created_by_id, college || null, program || null, semester || null]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Serve frontend ────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Quiztagram listening on port ${PORT}`))
