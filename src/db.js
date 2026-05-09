const call = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json()
  return data
}

// ── Auth / Users ──────────────────────────────────────────────────────────────

export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + 'nurseprep_salt_2026'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function loginUser(username, password) {
  const hash = await hashPassword(password)
  const data = await call('POST', '/api/auth/login', { username, password_hash: hash })
  if (!data || data.error) return { error: data?.error || 'invalid' }
  return { user: data.user }
}

export async function registerUser(username, password, inviteCode) {
  const hash = await hashPassword(password)
  const data = await call('POST', '/api/auth/register', { username, password_hash: hash, invite_code: inviteCode })
  if (!data || data.error) return { error: data.error }
  return { user: data.user }
}

export async function updateUser(userId, updates) {
  return call('PUT', `/api/users/${userId}`, updates)
}

// ── Invite Codes ──────────────────────────────────────────────────────────────

export async function generateInviteCode(createdBy) {
  return call('POST', '/api/invites', { created_by: createdBy })
}

export async function getUserInviteCodes(username) {
  const data = await call('GET', `/api/invites?username=${encodeURIComponent(username)}`)
  return data || []
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function getTests(search = '') {
  const url = search ? `/api/tests?search=${encodeURIComponent(search)}` : '/api/tests'
  const data = await call('GET', url)
  return data || []
}

export async function getTestById(id) {
  return call('GET', `/api/tests/${id}`)
}

export async function insertTest(test) {
  return call('POST', '/api/tests', test)
}

export async function updateTest(id, updates) {
  return call('PUT', `/api/tests/${id}`, updates)
}

export async function deleteTest(id) {
  await call('DELETE', `/api/tests/${id}`)
}

export async function getUserTests(userId) {
  const data = await call('GET', `/api/tests?userId=${userId}`)
  return data || []
}

export async function getTestStats(testId) {
  const data = await call('GET', `/api/tests/${testId}/stats`)
  return data || { totalTaken: 0, avgScore: 0 }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function insertSession(session) {
  return call('POST', '/api/sessions', session)
}

export async function getUserSessions(userId) {
  const data = await call('GET', `/api/sessions?userId=${userId}`)
  return data || []
}

export async function getSessionById(id) {
  return call('GET', `/api/sessions/${id}`)
}

// ── Users (public) ────────────────────────────────────────────────────────────

export async function getPublicUsers() {
  const data = await call('GET', '/api/users/public')
  return data || []
}

export async function getAllUsers() {
  const data = await call('GET', '/api/users')
  return data || []
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(testId) {
  const data = await call('GET', `/api/comments?testId=${testId}`)
  return data || []
}

export async function insertComment(comment) {
  return call('POST', '/api/comments', comment)
}

// ── Wrong Answers ─────────────────────────────────────────────────────────────

export async function getWrongAnswers(userId) {
  const data = await call('GET', `/api/wrong-answers/${userId}`)
  return data || {}
}

export async function incrementWrongAnswer(userId, questionId) {
  await call('POST', '/api/wrong-answers', { user_id: userId, question_id: questionId })
}

// ── Quiz Resume ───────────────────────────────────────────────────────────────

export async function saveQuizResume(userId, testId, queue, currentIndex, stats) {
  await call('PUT', '/api/quiz-resume', { user_id: userId, test_id: testId, queue, current_index: currentIndex, stats })
}

export async function getQuizResume(userId, testId) {
  return call('GET', `/api/quiz-resume/${userId}/${testId}`)
}

export async function deleteQuizResume(userId, testId) {
  await call('DELETE', `/api/quiz-resume/${userId}/${testId}`)
}

// ── Follows ───────────────────────────────────────────────────────────────────

export async function followUser(followerId, followerUsername, followingId) {
  return call('POST', '/api/follows', { follower_id: followerId, follower_username: followerUsername, following_id: followingId })
}

export async function unfollowUser(followerId, followingId) {
  return call('DELETE', `/api/follows/${followerId}/${followingId}`)
}

export async function checkFollow(followerId, followingId) {
  const data = await call('GET', `/api/follows/check?followerId=${followerId}&followingId=${followingId}`)
  return data?.following || false
}

export async function getFollowers(userId) {
  const data = await call('GET', `/api/users/${userId}/followers`)
  return data || []
}

export async function getFollowing(userId) {
  const data = await call('GET', `/api/users/${userId}/following`)
  return data || []
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(userId) {
  const data = await call('GET', `/api/notifications?userId=${userId}`)
  return data || []
}

export async function getUnreadNotificationCount(userId) {
  const data = await call('GET', `/api/notifications/unread-count?userId=${userId}`)
  return data?.count || 0
}

export async function markNotificationsRead(userId) {
  return call('PUT', '/api/notifications/read', { userId })
}

export async function createNotification(notif) {
  return call('POST', '/api/notifications', notif)
}

// ── Verifications ─────────────────────────────────────────────────────────────

export async function getTestVerifications(testId) {
  const data = await call('GET', `/api/tests/${testId}/verifications`)
  return data || []
}

export async function upsertVerification(verification) {
  return call('POST', '/api/verifications', verification)
}
