import { supabase } from './supabase'

// ── Auth / Users ──────────────────────────────────────────────────────────────

export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + 'nurseprep_salt_2026'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function loginUser(username, password) {
  const hash = await hashPassword(password)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', hash)
    .single()
  if (error || !data) return { error: 'invalid' }
  return { user: data }
}

export async function registerUser(username, password, inviteCode) {
  // Check invite code
  const { data: code } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', inviteCode.toUpperCase())
    .eq('used', false)
    .single()
  if (!code) return { error: 'invite' }

  // Mark code used
  await supabase.from('invite_codes').update({ used: true }).eq('id', code.id)

  // Create user
  const hash = await hashPassword(password)
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: hash,
      session_count: 0, perfect_streak: 0, upload_count: 0, liked_count: 0,
      overall_accuracy: 0, total_correct: 0, total_answered: 0,
      achievements: [], profile_private: false,
    })
    .select()
    .single()
  if (error) return { error: 'db' }
  return { user }
}

export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) console.error('updateUser:', error)
  return data
}

// ── Invite Codes ──────────────────────────────────────────────────────────────

export async function generateInviteCode(createdBy) {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, used: false, created_by: createdBy })
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function getUserInviteCodes(username) {
  const { data } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('created_by', username)
    .order('created_at', { ascending: false })
  return data || []
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function getTests() {
  const { data } = await supabase
    .from('tests')
    .select('*')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getTestById(id) {
  const { data } = await supabase.from('tests').select('*').eq('id', id).single()
  return data
}

export async function insertTest(test) {
  const { data, error } = await supabase.from('tests').insert(test).select().single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateTest(id, updates) {
  const { data, error } = await supabase.from('tests').update(updates).eq('id', id).select().single()
  if (error) console.error(error)
  return data
}

export async function deleteTest(id) {
  await supabase.from('tests').delete().eq('id', id)
}

export async function getUserTests(userId) {
  const { data } = await supabase
    .from('tests')
    .select('*')
    .eq('created_by_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function insertSession(session) {
  const { data, error } = await supabase.from('sessions').insert(session).select().single()
  if (error) console.error(error)
  return data
}

export async function getUserSessions(userId) {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getSessionById(id) {
  const { data } = await supabase.from('sessions').select('*').eq('id', id).single()
  return data
}

export async function getPublicUsers() {
  const { data } = await supabase
    .from('users')
    .select('id, username, session_count, overall_accuracy, achievements')
    .eq('profile_private', false)
    .order('overall_accuracy', { ascending: false })
  return data || []
}

export async function getAllUsers() {
  const { data } = await supabase.from('users').select('id, username, session_count, overall_accuracy')
  return data || []
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(testId) {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function insertComment(comment) {
  const { data, error } = await supabase.from('comments').insert(comment).select().single()
  if (error) console.error(error)
  return data
}

// ── Wrong Answers ─────────────────────────────────────────────────────────────

export async function getWrongAnswers(userId) {
  const { data } = await supabase
    .from('wrong_answers')
    .select('*')
    .eq('user_id', userId)
  const map = {}
  ;(data || []).forEach(r => { map[r.question_id] = r.wrong_count })
  return map
}

export async function incrementWrongAnswer(userId, questionId) {
  // Upsert
  const { data: existing } = await supabase
    .from('wrong_answers')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single()

  if (existing) {
    await supabase.from('wrong_answers')
      .update({ wrong_count: existing.wrong_count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase.from('wrong_answers')
      .insert({ user_id: userId, question_id: questionId, wrong_count: 1 })
  }
}

// ── Quiz Resume ───────────────────────────────────────────────────────────────

export async function saveQuizResume(userId, testId, queue, currentIndex, stats) {
  const { data: existing } = await supabase
    .from('quiz_resume')
    .select('id')
    .eq('user_id', userId)
    .eq('test_id', testId)
    .single()

  if (existing) {
    await supabase.from('quiz_resume')
      .update({ queue, current_index: currentIndex, stats, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('quiz_resume')
      .insert({ user_id: userId, test_id: testId, queue, current_index: currentIndex, stats })
  }
}

export async function getQuizResume(userId, testId) {
  const { data } = await supabase
    .from('quiz_resume')
    .select('*')
    .eq('user_id', userId)
    .eq('test_id', testId)
    .single()
  return data
}

export async function deleteQuizResume(userId, testId) {
  await supabase.from('quiz_resume')
    .delete()
    .eq('user_id', userId)
    .eq('test_id', testId)
}

// ── Test Sessions Stats (for submissions) ────────────────────────────────────

export async function getTestStats(testId) {
  const { data } = await supabase
    .from('sessions')
    .select('accuracy')
    .eq('test_id', testId)
  if (!data || data.length === 0) return { totalTaken: 0, avgScore: 0 }
  const avg = Math.round(data.reduce((a, s) => a + s.accuracy, 0) / data.length)
  return { totalTaken: data.length, avgScore: avg }
}
