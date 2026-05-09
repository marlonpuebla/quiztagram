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
      'SELECT * FROM users WHERE username = $1 AND password_hash = $2',
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
    'SELECT id, username, session_count, overall_accuracy, achievements FROM users WHERE profile_private = false ORDER BY overall_accuracy DESC'
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
    const setClauses = entries.map(([k], i) =>
      k === 'achievements' ? `${k} = $${i + 1}::text[]` : `${k} = $${i + 1}`
    ).join(', ')
    const values = [...entries.map(([, v]) => v), req.params.id]
    const { rows } = await pool.query(
      `UPDATE users SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
      values
    )
    res.json(rows[0] || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
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
  if (req.query.userId) {
    const { rows } = await pool.query(
      'SELECT * FROM tests WHERE created_by_id = $1 ORDER BY created_at DESC',
      [req.query.userId]
    )
    return res.json(rows)
  }
  const { rows } = await pool.query(
    'SELECT * FROM tests WHERE hidden = false ORDER BY created_at DESC'
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
    const { name, questions, created_by, created_by_id, thumbs_up, thumbs_down, hidden } = req.body
    const { rows } = await pool.query(
      `INSERT INTO tests (name, questions, created_by, created_by_id, thumbs_up, thumbs_down, hidden)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7) RETURNING *`,
      [name, JSON.stringify(questions), created_by, created_by_id, thumbs_up || 0, thumbs_down || 0, hidden || false]
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

// ── Serve frontend ────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`NursePrep listening on port ${PORT}`))
