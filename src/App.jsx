import { useState, useEffect, useCallback } from 'react'
import { T } from './i18n'
import {
  loginUser, registerUser, updateUser, generateInviteCode, getUserInviteCodes,
  getTests, getTestById, insertTest, updateTest, deleteTest, getUserTests,
  insertSession, getUserSessions, getSessionById, getPublicUsers, getAllUsers,
  getComments, insertComment, getWrongAnswers, incrementWrongAnswer,
  saveQuizResume, getQuizResume, deleteQuizResume, getTestStats
} from './db'
import { STYLES } from './styles'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

const ACHIEVEMENTS_DEF = [
  { id: 'first_test',       icon: '🎓', check: u => (u.session_count  || 0) >= 1  },
  { id: 'ten_tests',        icon: '🔟', check: u => (u.session_count  || 0) >= 10 },
  { id: 'fifty_tests',      icon: '🏅', check: u => (u.session_count  || 0) >= 50 },
  { id: 'perfect_streak_5', icon: '🔥', check: u => (u.perfect_streak || 0) >= 5  },
  { id: 'first_upload',     icon: '📤', check: u => (u.upload_count   || 0) >= 1  },
  { id: 'first_liked',      icon: '❤️', check: u => (u.liked_count    || 0) >= 1  },
  { id: 'top_liked',        icon: '🌟', check: u => !!u.is_top_liked               },
  { id: 'accuracy_90',      icon: '🎯', check: u => (u.overall_accuracy || 0) >= 90},
]

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]         = useState(() => localStorage.getItem('np_lang') || 'en')
  const [theme, setTheme]       = useState(() => localStorage.getItem('np_theme') || 'dark')
  const [user, setUser]         = useState(() => { try { return JSON.parse(localStorage.getItem('np_user')) } catch { return null } })
  const [screen, setScreen]     = useState(user ? 'home' : 'auth')
  const [screenData, setScreenData] = useState(null)
  const [toast, setToast]       = useState(null)
  const [toastOut, setToastOut] = useState(false)
  const t = T[lang]

  const toggleTheme = () => setTheme(th => { const n = th === 'dark' ? 'light' : 'dark'; localStorage.setItem('np_theme', n); return n })
  const toggleLang  = () => setLang(l  => { const n = l  === 'en'   ? 'es'    : 'en';   localStorage.setItem('np_lang',  n); return n })
  const navigate    = (s, data = null) => { setScreen(s); setScreenData(data) }

  const showAchievement = useCallback(achId => {
    setToastOut(false); setToast(achId)
    setTimeout(() => { setToastOut(true); setTimeout(() => setToast(null), 350) }, 3500)
  }, [])

  const checkAchievements = useCallback(async updatedUser => {
    const earned = [...(updatedUser.achievements || [])]
    for (const def of ACHIEVEMENTS_DEF) {
      if (!earned.includes(def.id) && def.check(updatedUser)) {
        earned.push(def.id)
        const saved = await updateUser(updatedUser.id, { achievements: earned })
        if (saved) { setUser(u => { const n = { ...u, achievements: earned }; localStorage.setItem('np_user', JSON.stringify(n)); return n }) }
        showAchievement(def.id)
        await new Promise(r => setTimeout(r, 4200))
      }
    }
    return earned
  }, [showAchievement])

  const login = u => { localStorage.setItem('np_user', JSON.stringify(u)); setUser(u); setScreen('home') }
  const logout = () => { localStorage.removeItem('np_user'); setUser(null); setScreen('auth') }

  const refreshUser = async () => {
    if (!user) return
    const { data } = await import('./supabase').then(m => m.supabase.from('users').select('*').eq('id', user.id).single())
    if (data) { setUser(data); localStorage.setItem('np_user', JSON.stringify(data)) }
    return data
  }

  const doUpdateUser = async updates => {
    const saved = await updateUser(user.id, updates)
    if (saved) { setUser(saved); localStorage.setItem('np_user', JSON.stringify(saved)) }
    return saved || { ...user, ...updates }
  }

  const topBar = (title, back = 'home', extra = null) => (
    <div className="top-bar">
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <button className="back-btn" onClick={() => navigate(back)}>←</button>
        <span className="page-title">{title}</span>
      </div>
      <div className="top-actions">
        {extra}
        <button className="lang-btn" onClick={toggleLang}>{t.switchLang}</button>
        <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
    </div>
  )

  const commonProps = { user, t, lang, theme, toggleTheme, toggleLang, navigate, topBar }

  const screens = {
    auth:        <AuthScreen {...commonProps} onLogin={login} />,
    home:        <HomeScreen {...commonProps} logout={logout} />,
    quiz:        <QuizScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    remedial:    <RemedialScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    leaderboard: <LeaderboardScreen {...commonProps} />,
    history:     <HistoryScreen {...commonProps} />,
    addTest:     <AddTestScreen {...commonProps} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    guide:       <GuideScreen {...commonProps} />,
    invites:     <InvitesScreen {...commonProps} />,
    testDetail:  <TestDetailScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    submissions: <SubmissionsScreen {...commonProps} />,
    profile:     <ProfileScreen {...commonProps} doUpdateUser={doUpdateUser} />,
    results:     <ResultsScreen {...commonProps} data={screenData} />,
    review:      <ReviewScreen {...commonProps} data={screenData} />,
  }

  return (
    <div className={`app ${theme}`}>
      <style>{STYLES}</style>
      {screens[screen] || screens.home}
      {toast && (
        <div className={`achievement-toast${toastOut ? ' out' : ''}`}>
          <span className="toast-icon">{ACHIEVEMENTS_DEF.find(a => a.id === toast)?.icon}</span>
          <div>
            <div className="toast-title">{t.achievementUnlocked}</div>
            <div className="toast-name">{t.achievements[toast]?.title}</div>
            <div className="toast-desc">{t.achievements[toast]?.desc}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CAPTCHA ──────────────────────────────────────────────────────────────────
function Captcha({ t, onPass }) {
  const [a] = useState(() => Math.floor(Math.random() * 9) + 1)
  const [b] = useState(() => Math.floor(Math.random() * 9) + 1)
  const [val, setVal] = useState(''); const [err, setErr] = useState(false)
  const check = () => parseInt(val) === a + b ? onPass() : (setErr(true), setVal(''))
  return (
    <div className="captcha">
      <p className="captcha-label">{t.captchaLabel} <strong>{a} + {b}</strong>?</p>
      <div className="captcha-row">
        <input className={`captcha-input${err ? ' err' : ''}`} value={val}
          onChange={e => { setVal(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && check()} maxLength={3} />
        <button className="btn-primary sm" onClick={check}>✓</button>
      </div>
      {err && <p className="captcha-err">{t.captchaErr}</p>}
    </div>
  )
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ t, lang, theme, toggleTheme, toggleLang, onLogin }) {
  const [mode, setMode]       = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite]   = useState('')
  const [captchaDone, setCaptchaDone] = useState(false)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr('')
    if (!username.trim()) return setErr(t.enterUsername)
    if (!password.trim()) return setErr(t.enterPassword)
    setLoading(true)
    if (mode === 'login') {
      const { user, error } = await loginUser(username.trim(), password.trim())
      if (error) setErr(error === 'invalid' ? t.usernameNotFound : t.wrongPassword)
      else onLogin(user)
    } else {
      if (!invite.trim()) { setErr(t.enterInvite); setLoading(false); return }
      if (!captchaDone)   { setErr(t.completeCaptcha); setLoading(false); return }
      const { user, error } = await registerUser(username.trim(), password.trim(), invite.trim())
      if (error === 'invite') setErr(t.invalidInvite)
      else if (error) setErr('Something went wrong. Try again.')
      else onLogin(user)
    }
    setLoading(false)
  }

  return (
    <div className={`auth-screen ${theme}`}>
      <div className="auth-card">
        <div style={{ position:'absolute', top:'16px', right:'16px', display:'flex', gap:'8px' }}>
          <button className="lang-btn" onClick={toggleLang}>{lang === 'en' ? 'ES' : 'EN'}</button>
          <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
        <div className="auth-logo">
          <div className="logo-icon">🩺</div>
          <h1 className="logo-title">{t.appName}</h1>
          <p className="logo-sub">{t.tagline}</p>
        </div>
        <div className="tab-row">
          <button className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setErr('') }}>{t.signIn}</button>
          <button className={`tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setErr('') }}>{t.register}</button>
        </div>
        <div className="auth-fields">
          <input className="field" placeholder={t.username} value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="off" />
          <input className="field" type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
          {mode === 'register' && <>
            <input className="field" placeholder={t.inviteCode} value={invite} onChange={e => setInvite(e.target.value)} autoCapitalize="characters" />
            {!captchaDone ? <Captcha t={t} onPass={() => setCaptchaDone(true)} /> : <p className="captcha-ok">{t.captchaPassed}</p>}
          </>}
          {err && <p className="field-err">{err}</p>}
          <button className="btn-primary full" onClick={handle} disabled={loading}>
            {loading ? <span className="spinner" /> : mode === 'login' ? t.signIn : t.createAccount}
          </button>
        </div>
        {mode === 'register' && <p className="auth-hint">First invite code: <strong>NURSE2026</strong></p>}
      </div>
    </div>
  )
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ user, t, theme, toggleTheme, toggleLang, navigate, logout }) {
  const [tests, setTests]             = useState([])
  const [selectedTest, setSelectedTest] = useState(null)

  useEffect(() => {
    getTests().then(data => {
      setTests(data)
      if (data.length) setSelectedTest(data[0].id)
    })
  }, [])

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">🩺 {t.appName}</span>
        <div className="top-actions">
          <button className="lang-btn" onClick={toggleLang}>{t.switchLang}</button>
          <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button className="icon-btn" onClick={() => navigate('profile')}>👤</button>
          <button className="icon-btn" onClick={logout}>🚪</button>
        </div>
      </div>

      <div className="home-hero">
        <p className="greeting">{t.hello}, <strong>{user.username}</strong> 👋</p>
        <p className="hero-sub">{t.readyToStudy}</p>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <p>{t.noTests}</p>
          <button className="btn-primary" onClick={() => navigate('addTest')}>+ {t.addTest}</button>
        </div>
      ) : (
        <>
          <div className="section">
            <label className="section-label">{t.selectTest}</label>
            <select className="select" value={selectedTest || ''} onChange={e => setSelectedTest(e.target.value)}>
              {tests.map(tt => <option key={tt.id} value={tt.id}>{tt.name} — {t.testBy} {tt.created_by}</option>)}
            </select>
            {selectedTest && (
              <button className="tool-btn" style={{ marginTop:'8px' }} onClick={() => navigate('testDetail', { testId: selectedTest })}>
                ℹ️ View / Rate / Comment
              </button>
            )}
          </div>
          <div className="action-grid">
            <button className="action-card primary" onClick={() => navigate('quiz', { testId: selectedTest })}>
              <span className="ac-icon">📝</span><span className="ac-label">{t.startQuiz}</span>
            </button>
            <button className="action-card remedial" onClick={() => navigate('remedial', { testId: selectedTest })}>
              <span className="ac-icon">🔁</span><span className="ac-label">{t.remedialMode}</span>
            </button>
            <button className="action-card board" onClick={() => navigate('leaderboard')}>
              <span className="ac-icon">🏆</span><span className="ac-label">{t.leaderboard}</span>
            </button>
            <button className="action-card hist" onClick={() => navigate('history')}>
              <span className="ac-icon">📊</span><span className="ac-label">{t.myHistory}</span>
            </button>
          </div>
        </>
      )}

      <div className="section">
        <label className="section-label">{t.tools}</label>
        <div className="tool-row">
          <button className="tool-btn" onClick={() => navigate('addTest')}>➕ {t.addTest}</button>
          <button className="tool-btn" onClick={() => navigate('guide')}>📸 {t.createGuide}</button>
          <button className="tool-btn" onClick={() => navigate('invites')}>🔗 {t.inviteFriends}</button>
          <button className="tool-btn" onClick={() => navigate('submissions')}>📋 {t.submissions}</button>
        </div>
      </div>
    </div>
  )
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
function QuizScreen({ user, t, lang, data, navigate, doUpdateUser, checkAchievements, topBar }) {
  const [test, setTest]           = useState(null)
  const [queue, setQueue]         = useState([])
  const [current, setCurrent]     = useState(0)
  const [answered, setAnswered]   = useState(null)
  const [selected, setSelected]   = useState(null)
  const [fillVal, setFillVal]     = useState('')
  const [confidence, setConfidence] = useState(null)
  const [stats, setStats]         = useState({ correct: 0, total: 0, attempts: {}, confidenceMap: [] })
  const [done, setDone]           = useState(false)
  const [diffFilter, setDiffFilter]   = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [wrongFilter, setWrongFilter] = useState(false)
  const [topics, setTopics]       = useState([])
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedResume, setSavedResume] = useState(null)
  const [filtersReady, setFiltersReady] = useState(false)

  useEffect(() => {
    if (!data?.testId) return
    getTestById(data.testId).then(found => {
      if (!found) return
      setTest(found)
      setTopics([...new Set(found.questions.map(q => q.topic).filter(Boolean))])
      getQuizResume(user.id, data.testId).then(resume => {
        if (resume) { setSavedResume(resume); setShowResumePrompt(true) }
        else setFiltersReady(true)
      })
    })
  }, [])

  const startNew = async (testObj, dFilter = diffFilter, tFilter = topicFilter, wFilter = wrongFilter) => {
    const t2 = testObj || test
    if (!t2) return
    let qs = [...t2.questions]
    if (dFilter !== 'all') qs = qs.filter(q => q.difficulty === dFilter)
    if (tFilter !== 'all') qs = qs.filter(q => q.topic === tFilter)
    if (wFilter) {
      const wm = await getWrongAnswers(user.id)
      qs = qs.filter(q => (wm[q.id] || 0) > 0).sort((a, b) => (wm[b.id] || 0) - (wm[a.id] || 0))
    }
    if (!qs.length) qs = [...t2.questions]
    const shuffled = shuffle(qs)
    setQueue(shuffled); setCurrent(0); setAnswered(null); setSelected(null)
    setFillVal(''); setConfidence(null)
    setStats({ correct: 0, total: 0, attempts: {}, confidenceMap: [] })
    setDone(false); setShowResumePrompt(false); setFiltersReady(false)
  }

  const resumeSession = () => {
    if (!savedResume) return
    setQueue(savedResume.queue); setCurrent(savedResume.current_index)
    setStats(savedResume.stats); setShowResumePrompt(false)
  }

  const submitAnswer = async () => {
    if (!confidence) return
    const q = queue[current]
    const userAns = (q.type === 'multiple_choice' ? selected : fillVal.trim()).toLowerCase()
    const correctAns = (q.answer?.[lang] || q.answer?.en || '').toLowerCase()
    const isCorrect = userAns === correctAns

    const newAttempts = { ...stats.attempts, [q.id]: (stats.attempts[q.id] || 0) + 1 }
    const newConf     = [...stats.confidenceMap, { confidence, correct: isCorrect }]
    const newStats    = { ...stats, total: stats.total + 1, correct: isCorrect ? stats.correct + 1 : stats.correct, attempts: newAttempts, confidenceMap: newConf }
    setStats(newStats); setAnswered(isCorrect)

    if (!isCorrect) {
      await incrementWrongAnswer(user.id, q.id)
      setTimeout(async () => {
        const newQueue = [...queue.slice(0, current + 1), ...queue.slice(current + 1), q]
        const ni = current + 1
        setQueue(newQueue); setCurrent(ni); setAnswered(null); setSelected(null); setFillVal(''); setConfidence(null)
        await saveQuizResume(user.id, data.testId, newQueue, ni, newStats)
      }, 1800)
    } else {
      await saveQuizResume(user.id, data.testId, queue, current, newStats)
    }
  }

  const nextQuestion = async () => {
    const remaining = queue.slice(current + 1)
    if (remaining.length === 0) { await deleteQuizResume(user.id, data.testId); setDone(true); return }
    setCurrent(c => c + 1); setAnswered(null); setSelected(null); setFillVal(''); setConfidence(null)
  }

  const finishSession = async (isPublic) => {
    const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    const session = await insertSession({
      user_id: user.id, username: user.username,
      test_id: data.testId, test_name: test.name,
      score: stats.correct, total: stats.total, accuracy: acc,
      attempts: stats.attempts, confidence_map: stats.confidenceMap, is_public: isPublic,
    })
    const newCount   = (user.session_count  || 0) + 1
    const newCorrect = (user.total_correct  || 0) + stats.correct
    const newAnswered= (user.total_answered || 0) + stats.total
    const newAcc     = newAnswered > 0 ? Math.round((newCorrect / newAnswered) * 100) : 0
    const newStreak  = acc === 100 ? (user.perfect_streak || 0) + 1 : 0
    const upd = await doUpdateUser({ session_count: newCount, total_correct: newCorrect, total_answered: newAnswered, overall_accuracy: newAcc, perfect_streak: newStreak })
    await checkAchievements(upd)
    navigate('results', { session: { ...session, test_name: test.name }, testId: data.testId })
  }

  if (!test) return <div className="screen">{topBar('Quiz', 'home')}<div className="no-data">Loading…</div></div>

  if (showResumePrompt) return (
    <div className="screen">{topBar(test.name, 'home')}
      <div style={{ padding:'32px 20px', display:'flex', flexDirection:'column', gap:'16px' }}>
        <div className="card" style={{ textAlign:'center' }}>
          <p style={{ fontSize:'1.1rem', marginBottom:'8px' }}>⏸️</p>
          <p style={{ fontFamily:'var(--font-head)', fontWeight:'700' }}>You have a saved session</p>
          <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginTop:'4px' }}>Continue where you left off?</p>
        </div>
        <button className="btn-primary full" onClick={resumeSession}>{t.resume}</button>
        <button className="btn-ghost" onClick={() => startNew(test)}>{t.newSession}</button>
      </div>
    </div>
  )

  if (filtersReady && queue.length === 0) return (
    <div className="screen">{topBar(test.name, 'home')}
      <div style={{ padding:'20px' }}>
        <label className="section-label">{t.filterQuestions}</label>
        <div className="filter-bar">
          {['all','easy','medium','hard'].map(d => (
            <button key={d} className={`filter-chip${diffFilter === d ? ' active' : ''}`}
              onClick={() => setDiffFilter(d)}>{d === 'all' ? t.filterAll : t[`filter${d.charAt(0).toUpperCase()+d.slice(1)}`]}</button>
          ))}
        </div>
        {topics.length > 0 && (
          <div className="filter-bar">
            {['all', ...topics].map(tp => (
              <button key={tp} className={`filter-chip${topicFilter === tp ? ' active' : ''}`}
                onClick={() => setTopicFilter(tp)}>{tp === 'all' ? t.filterAll : tp}</button>
            ))}
          </div>
        )}
        <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 0', color:'var(--white)', cursor:'pointer', fontSize:'0.9rem' }}>
          <input type="checkbox" checked={wrongFilter} onChange={e => setWrongFilter(e.target.checked)} />
          {t.byWrongHistory}
        </label>
        <button className="btn-primary full" onClick={() => startNew(test, diffFilter, topicFilter, wrongFilter)}>{t.startQuiz}</button>
      </div>
    </div>
  )

  // Auto-start if no resume and not showing filters
  if (!filtersReady && queue.length === 0 && !showResumePrompt) {
    setFiltersReady(true)
    return <div className="screen">{topBar(test.name, 'home')}<div className="no-data">Loading…</div></div>
  }

  if (done) return (
    <div className="screen">{topBar(t.sessionComplete, 'home')}
      <div style={{ padding:'24px 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
        <div className="card" style={{ textAlign:'center' }}>
          <div className="results-score">{stats.total > 0 ? Math.round((stats.correct/stats.total)*100) : 0}%</div>
          <div className="results-label">{stats.correct}/{stats.total}</div>
        </div>
        <label className="section-label">{t.resultVisibility}</label>
        <p className="auth-hint" style={{ marginTop:0 }}>{t.sessionPrivacyNote}</p>
        <div className="privacy-toggle">
          <button className="priv-btn active" onClick={() => finishSession(true)}>🌐 {t.publicResult}</button>
          <button className="priv-btn" onClick={() => finishSession(false)}>🔒 {t.privateResult}</button>
        </div>
      </div>
    </div>
  )

  if (queue.length === 0) return null

  const q = queue[current]
  const qText = q.question?.[lang] || q.question?.en || q.question || ''
  const opts  = q.options?.[lang]  || q.options?.en  || []
  const correctAns = q.answer?.[lang] || q.answer?.en || ''
  const progress = Math.min(stats.correct, test.questions.length)

  return (
    <div className="screen">
      {topBar(test.name, 'home')}
      <div className="quiz-progress">
        <div className="progress-bar"><div className="progress-fill" style={{ width:`${(progress/test.questions.length)*100}%` }} /></div>
        <p className="progress-text">{progress}/{test.questions.length}</p>
      </div>
      <div className="question-card">
        <div className="q-meta">
          {q.topic      && <span className="tag tag-topic">{q.topic}</span>}
          {q.difficulty && <span className={`tag tag-${q.difficulty}`}>{q.difficulty}</span>}
        </div>
        <p className="question-text">{qText}</p>
        {q.type === 'multiple_choice' ? (
          <div className="options-list">
            {opts.map((opt, i) => {
              let cls = 'option-btn'
              if (answered !== null) {
                if (opt.toLowerCase() === correctAns.toLowerCase()) cls += ' correct'
                else if (opt === selected) cls += ' wrong'
              } else if (opt === selected) cls += ' selected'
              return <button key={i} className={cls} onClick={() => !answered && setSelected(opt)} disabled={answered !== null}>{opt}</button>
            })}
          </div>
        ) : (
          <input className={`fill-input${answered===true?' correct':answered===false?' wrong':''}`}
            value={fillVal} onChange={e => setFillVal(e.target.value)}
            onKeyDown={e => e.key==='Enter' && answered===null && confidence && submitAnswer()}
            placeholder={t.typeAnswer} disabled={answered !== null} />
        )}
      </div>

      {answered === null && (
        <div className="confidence-section">
          <span className="confidence-label">{t.confidence}</span>
          <div className="confidence-row">
            {['low','moderate','high'].map(c => (
              <button key={c} className={`conf-btn ${c}${confidence===c?' active':''}`} onClick={() => setConfidence(c)}>{t[c]}</button>
            ))}
          </div>
        </div>
      )}
      {answered === null && (
        <div className="submit-row">
          <button className="btn-primary full" onClick={submitAnswer}
            disabled={!confidence || (q.type==='multiple_choice' ? !selected : !fillVal.trim())}>
            {t.submit}
          </button>
        </div>
      )}
      {answered !== null && (
        <div className={`feedback-box ${answered ? 'correct' : 'wrong'}`}>
          <p className="feedback-result">{answered ? t.correct : t.wrong}</p>
          {!answered && <p className="feedback-answer">{t.correctAnswer} <strong>{correctAns}</strong></p>}
        </div>
      )}
      {answered === true && (
        <div className="submit-row"><button className="btn-primary full" onClick={nextQuestion}>{t.next}</button></div>
      )}
    </div>
  )
}

// ─── REMEDIAL ─────────────────────────────────────────────────────────────────
function RemedialScreen({ user, t, lang, data, navigate, topBar }) {
  const [mode, setMode]       = useState(null)
  const [test, setTest]       = useState(null)
  const [queue, setQueue]     = useState([])
  const [current, setCurrent] = useState(0)
  const [answered, setAnswered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [fillVal, setFillVal] = useState('')
  const [confidence, setConfidence] = useState(null)
  const [stats, setStats]     = useState({ correct: 0, total: 0 })
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (data?.testId) getTestById(data.testId).then(setTest)
  }, [])

  const startRemedial = async m => {
    setMode(m)
    if (!test) return
    let qs = []
    if (m === 'personal') {
      const wm = await getWrongAnswers(user.id)
      qs = test.questions.filter(q => (wm[q.id] || 0) > 0).sort((a, b) => (wm[b.id]||0) - (wm[a.id]||0))
    } else {
      const sessions = await import('./db').then(m => m.getUserSessions(user.id))
      const wc = {}
      sessions.forEach(s => Object.entries(s.attempts||{}).forEach(([qid, cnt]) => { wc[qid] = (wc[qid]||0) + cnt }))
      qs = test.questions.filter(q => wc[q.id]).sort((a, b) => (wc[b.id]||0) - (wc[a.id]||0))
    }
    setQueue(qs.length ? qs : shuffle([...test.questions]).slice(0, 10))
  }

  const submit = async () => {
    if (!confidence) return
    const q = queue[current]
    const userAns = (q.type==='multiple_choice' ? selected : fillVal.trim()).toLowerCase()
    const correctAns = (q.answer?.[lang] || q.answer?.en || '').toLowerCase()
    const isCorrect = userAns === correctAns
    setStats(s => ({ ...s, total: s.total+1, correct: isCorrect ? s.correct+1 : s.correct }))
    setAnswered(isCorrect)
    if (!isCorrect) {
      await incrementWrongAnswer(user.id, q.id)
      setTimeout(() => { setQueue(q2 => [...q2.slice(current+1), q]); setAnswered(null); setSelected(null); setFillVal(''); setConfidence(null) }, 1800)
    }
  }

  const next = () => {
    if (current + 1 >= queue.length) { setDone(true); return }
    setCurrent(c => c+1); setAnswered(null); setSelected(null); setFillVal(''); setConfidence(null)
  }

  if (!mode) return (
    <div className="screen">{topBar(t.remedialMode, 'home')}
      <div className="remedial-choice">
        <div className="remedial-option" onClick={() => startRemedial('personal')}>
          <div className="remedial-option-icon">👤</div>
          <div className="remedial-option-title">{t.personalRemedial}</div>
          <div className="remedial-option-desc">Questions you've personally gotten wrong the most</div>
        </div>
        <div className="remedial-option" onClick={() => startRemedial('community')}>
          <div className="remedial-option-icon">🌐</div>
          <div className="remedial-option-title">{t.communityRemedial}</div>
          <div className="remedial-option-desc">Questions hardest across all users</div>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className="screen">{topBar(t.remedialMode, 'home')}
      <div style={{ padding:'32px 20px', textAlign:'center' }}>
        <div className="results-score">{stats.total>0?Math.round((stats.correct/stats.total)*100):0}%</div>
        <div className="results-label">{stats.correct}/{stats.total}</div>
        <button className="btn-primary full" style={{ marginTop:'24px' }} onClick={() => navigate('home')}>{t.backHome}</button>
      </div>
    </div>
  )

  if (!queue.length) return (
    <div className="screen">{topBar(t.remedialMode, 'home')}
      <div className="no-data">Loading questions…</div>
    </div>
  )

  const q = queue[current]
  const qText = q.question?.[lang] || q.question?.en || ''
  const opts  = q.options?.[lang]  || q.options?.en  || []
  const correctAns = q.answer?.[lang] || q.answer?.en || ''

  return (
    <div className="screen">
      {topBar(t.remedialMode, 'home')}
      <div className="quiz-progress">
        <div className="progress-bar"><div className="progress-fill" style={{ width:`${(current/queue.length)*100}%` }} /></div>
        <p className="progress-text">{current}/{queue.length}</p>
      </div>
      <div className="question-card">
        <div className="q-meta">
          {q.topic      && <span className="tag tag-topic">{q.topic}</span>}
          {q.difficulty && <span className={`tag tag-${q.difficulty}`}>{q.difficulty}</span>}
        </div>
        <p className="question-text">{qText}</p>
        {q.type === 'multiple_choice' ? (
          <div className="options-list">
            {opts.map((opt, i) => {
              let cls = 'option-btn'
              if (answered !== null) { if (opt.toLowerCase()===correctAns.toLowerCase()) cls+=' correct'; else if (opt===selected) cls+=' wrong' }
              else if (opt===selected) cls+=' selected'
              return <button key={i} className={cls} onClick={() => !answered && setSelected(opt)} disabled={answered!==null}>{opt}</button>
            })}
          </div>
        ) : (
          <input className={`fill-input${answered===true?' correct':answered===false?' wrong':''}`}
            value={fillVal} onChange={e => setFillVal(e.target.value)} placeholder={t.typeAnswer} disabled={answered!==null} />
        )}
      </div>
      {answered===null && (
        <div className="confidence-section">
          <span className="confidence-label">{t.confidence}</span>
          <div className="confidence-row">
            {['low','moderate','high'].map(c => (
              <button key={c} className={`conf-btn ${c}${confidence===c?' active':''}`} onClick={() => setConfidence(c)}>{t[c]}</button>
            ))}
          </div>
        </div>
      )}
      {answered===null && <div className="submit-row"><button className="btn-primary full" onClick={submit} disabled={!confidence||(q.type==='multiple_choice'?!selected:!fillVal.trim())}>{t.submit}</button></div>}
      {answered!==null && <div className={`feedback-box ${answered?'correct':'wrong'}`}><p className="feedback-result">{answered?t.correct:t.wrong}</p>{!answered&&<p className="feedback-answer">{t.correctAnswer} <strong>{correctAns}</strong></p>}</div>}
      {answered===true && <div className="submit-row"><button className="btn-primary full" onClick={next}>{t.next}</button></div>}
    </div>
  )
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function ResultsScreen({ t, lang, data, navigate, topBar }) {
  const [copied, setCopied] = useState(false)
  const s = data?.session
  if (!s) return null
  const highConfWrong = (s.confidence_map||[]).filter(c => c.confidence==='high' && !c.correct).length
  const lowConfRight  = (s.confidence_map||[]).filter(c => c.confidence==='low'  &&  c.correct).length
  const shareUrl = `${window.location.origin}?share=${s.id}`
  const copy = async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false),2000) } catch {} }

  return (
    <div className="screen results-screen">
      {topBar(t.sessionComplete, 'home')}
      <div className="results-hero">
        <div className="results-score">{s.accuracy}%</div>
        <div className="results-label">{s.score}/{s.total} · {s.test_name}</div>
      </div>
      <div className="stat-row">
        <div className="stat-box"><div className="stat-val">{s.accuracy}%</div><div className="stat-lbl">{t.accuracy}</div></div>
        <div className="stat-box"><div className="stat-val">{s.total}</div><div className="stat-lbl">{t.attempts}</div></div>
        <div className="stat-box"><div className="stat-val">{s.is_public?'🌐':'🔒'}</div><div className="stat-lbl">{s.is_public?t.publicResult:t.privateResult}</div></div>
      </div>
      <div className="conf-insight">
        <div className="conf-insight-title">{t.confidenceVsAccuracy}</div>
        <div className="conf-bar-row">
          <span className="conf-bar-label">{t.confHighWrong}</span>
          <div className="conf-bar"><div className="conf-bar-fill" style={{ width:`${Math.min(highConfWrong*15,100)}%`, background:'var(--coral)' }} /></div>
          <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{highConfWrong}</span>
        </div>
        <div className="conf-bar-row">
          <span className="conf-bar-label">{t.confLowRight}</span>
          <div className="conf-bar"><div className="conf-bar-fill" style={{ width:`${Math.min(lowConfRight*15,100)}%`, background:'var(--success)' }} /></div>
          <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{lowConfRight}</span>
        </div>
      </div>
      {s.is_public && (
        <>
          <label className="section-label" style={{ paddingTop:'8px' }}>{t.sharableLink}</label>
          <div className="share-box">{shareUrl}</div>
          <button className="btn-ghost" style={{ width:'100%', marginTop:'8px' }} onClick={copy}>{copied ? t.linkCopied : t.shareResult}</button>
        </>
      )}
      <div className="results-actions">
        <button className="btn-primary full" onClick={() => navigate('quiz', { testId: data.testId })}>{t.startAgain}</button>
        <button className="btn-ghost" onClick={() => navigate('home')}>{t.backHome}</button>
      </div>
    </div>
  )
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function LeaderboardScreen({ t, topBar }) {
  const [rows, setRows]           = useState([])
  const [reviewerIds, setReviewerIds] = useState(new Set())
  useEffect(() => {
    (async () => {
      const all   = await getAllUsers()
      const pub   = await getPublicUsers()
      const bySession = [...all].sort((a,b)=>(b.session_count||0)-(a.session_count||0)).slice(0,5).map(u=>u.id)
      const byAcc     = [...all].sort((a,b)=>(b.overall_accuracy||0)-(a.overall_accuracy||0)).slice(0,5).map(u=>u.id)
      setReviewerIds(new Set([...bySession,...byAcc]))
      setRows(pub)
    })()
  }, [])
  const medal = i => i===0?'gold':i===1?'silver':i===2?'bronze':''
  return (
    <div className="screen">{topBar(t.leaderboard, 'home')}
      <div className="leaderboard-list">
        {rows.length===0 && <p className="no-data">{t.noHistory}</p>}
        {rows.map((u,i) => (
          <div key={u.id} className="lb-row">
            <span className={`lb-rank ${medal(i)}`}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
            <span className="lb-name">{u.username}{reviewerIds.has(u.id)&&<span className="reviewer-badge">⭐ Reviewer</span>}</span>
            <div style={{ textAlign:'right' }}>
              <div className="lb-acc">{u.overall_accuracy||0}%</div>
              <div className="lb-sessions">{u.session_count||0} {t.sessions}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
function HistoryScreen({ user, t, topBar }) {
  const [sessions, setSessions] = useState([])
  useEffect(() => { getUserSessions(user.id).then(setSessions) }, [])
  return (
    <div className="screen">{topBar(t.myHistory, 'home')}
      <div className="history-list">
        {sessions.length===0 && <p className="no-data">{t.noHistory}</p>}
        {sessions.map(s => (
          <div key={s.id} className="hist-row">
            <div className="hist-top"><span className="hist-test">{s.test_name}</span><span className="hist-score">{s.accuracy}%</span></div>
            <div className="hist-meta">{new Date(s.created_at).toLocaleDateString()} · {s.score}/{s.total}</div>
            <span className="hist-private">{s.is_public?'🌐 '+t.publicResult:'🔒 '+t.privateResult}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TEST DETAIL ──────────────────────────────────────────────────────────────
function TestDetailScreen({ user, t, lang, data, navigate, doUpdateUser, checkAchievements, topBar }) {
  const [test, setTest]       = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)

  useEffect(() => {
    if (!data?.testId) return
    getTestById(data.testId).then(setTest)
    getComments(data.testId).then(setComments)
  }, [])

  const rate = async (up) => {
    if (!test) return
    const prev = test.user_ratings || {}
    const already = prev[user.id]
    let thumbsUp   = test.thumbs_up   || 0
    let thumbsDown = test.thumbs_down || 0
    let newRatings = { ...prev }
    if (up) {
      if (already==='up') { thumbsUp--; delete newRatings[user.id] }
      else { if (already==='down') thumbsDown--; thumbsUp++; newRatings[user.id]='up' }
    } else {
      if (already==='down') { thumbsDown--; delete newRatings[user.id] }
      else { if (already==='up') thumbsUp--; thumbsDown++; newRatings[user.id]='down' }
    }
    const updated = await updateTest(test.id, { thumbs_up: thumbsUp, thumbs_down: thumbsDown, user_ratings: newRatings })
    if (updated) setTest(updated)
    if (up && test.created_by_id === user.id && thumbsUp >= 1) {
      const upd = await doUpdateUser({ liked_count: (user.liked_count||0) + 1 })
      await checkAchievements(upd)
    }
  }

  const postComment = async () => {
    if (!newComment.trim()) return
    const c = await insertComment({ test_id: data.testId, user_id: user.id, username: user.username, text: newComment.trim() })
    if (c) { setComments(cs => [...cs, c]); setNewComment('') }
  }

  const submitReport = async () => {
    if (!reportReason.trim()) return
    const reporters = [...(test.reporters||[])]
    if (reporters.includes(user.id)) return
    reporters.push(user.id)
    const updated = await updateTest(test.id, { reporters, flagged: reporters.length >= 3 })
    if (updated) setTest(updated)
    setReported(true); setShowReport(false)
  }

  if (!test) return <div className="screen">{topBar('Test','home')}<div className="no-data">Loading…</div></div>
  const myRating = (test.user_ratings||{})[user.id]

  return (
    <div className="screen">{topBar(test.name, 'home')}
      <div className="test-detail">
        <div className="card">
          <div style={{ fontFamily:'var(--font-head)', fontWeight:'700', fontSize:'1.1rem', marginBottom:'8px' }}>{test.name}</div>
          <div className="test-meta">
            <span className="test-stat">👤 {test.created_by}</span>
            <span className="test-stat">📝 {test.questions?.length} {t.questions}</span>
          </div>
          {test.flagged && !test.reviewed && <div className="flagged-badge" style={{ marginTop:'10px' }}>{t.flagged}</div>}
          {test.reviewed && <div className="reviewed-badge" style={{ marginTop:'10px' }}>{t.reviewed}</div>}
        </div>
        <div className="card">
          <div className="section-title">{t.rateTest}</div>
          <div className="rating-row">
            <button className={`thumb-btn${myRating==='up'?' active':''}`} onClick={() => rate(true)}>{t.thumbsUp}</button>
            <span className="thumb-count">{test.thumbs_up||0}</span>
            <button className={`thumb-btn${myRating==='down'?' active':''}`} onClick={() => rate(false)}>{t.thumbsDown}</button>
            <span className="thumb-count">{test.thumbs_down||0}</span>
          </div>
        </div>
        <div className="card">
          <div className="section-title">{t.comments}</div>
          <div className="comment-input-row">
            <input className="comment-input" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder={t.leaveComment} onKeyDown={e => e.key==='Enter' && postComment()} />
            <button className="btn-primary sm" onClick={postComment}>{t.postComment}</button>
          </div>
          <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {comments.length===0 && <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>{t.noComments}</p>}
            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-author">{c.username}</div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-date">{new Date(c.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
        {!reported && !showReport && <button className="btn-ghost" onClick={() => setShowReport(true)}>🚩 {t.reportTest}</button>}
        {showReport && (
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <input className="field" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder={t.reportReason} />
            <div style={{ display:'flex', gap:'8px' }}>
              <button className="btn-danger" onClick={submitReport}>{t.submitReport}</button>
              <button className="btn-ghost" onClick={() => setShowReport(false)}>{t.cancel}</button>
            </div>
          </div>
        )}
        {reported && <p className="alert alert-warn">Report submitted. Thank you!</p>}
      </div>
    </div>
  )
}

// ─── ADD TEST ─────────────────────────────────────────────────────────────────
function AddTestScreen({ user, t, lang, navigate, doUpdateUser, checkAchievements, topBar }) {
  const [name, setName]   = useState('')
  const [json, setJson]   = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [tags, setTags]   = useState([])

  const handleAdd = async () => {
    if (!name.trim()) return setErr('Enter a test name.')
    if (!json.trim())  return setErr('Paste the JSON first.')
    setLoading(true); setErr('')
    let parsed
    try {
      parsed = JSON.parse(json.replace(/```json|```/g,'').trim())
      if (parsed.error === 'invalid_content') { setErr('⚠️ ' + (parsed.message||'Invalid content.')); setLoading(false); return }
      if (!Array.isArray(parsed)) throw new Error('not array')
      if (!parsed.every(q => q.question && q.answer && q.type)) throw new Error('missing fields')
    } catch { setErr('Invalid JSON. Make sure you copied it fully from Claude.'); setLoading(false); return }

    // AI validation + tag suggestion
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (apiKey) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'x-api-key': apiKey, 'anthropic-version':'2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 800,
            messages: [{ role:'user', content: `Validate and tag these nursing exam questions.
1. If NOT legitimate nursing/medical content, return: {"valid":false,"reason":"explanation"}
2. If valid return: {"valid":true,"topics":["tag1","tag2"],"difficulties":{"questionId":"easy|medium|hard"}}
Questions: ${JSON.stringify(parsed.slice(0,5))}
Return ONLY JSON.` }]
          })
        })
        const ai = await res.json()
        const aiText = ai.content?.find(c=>c.type==='text')?.text || ''
        const aiResult = JSON.parse(aiText.replace(/```json|```/g,'').trim())
        if (!aiResult.valid) { setErr('⚠️ ' + (aiResult.reason||'Content validation failed.')); setLoading(false); return }
        setTags(aiResult.topics || [])
        if (aiResult.difficulties) {
          parsed = parsed.map(q => ({ ...q, difficulty: aiResult.difficulties[q.id] || q.difficulty || 'medium' }))
        }
      }
    } catch { /* proceed anyway if AI fails */ }

    const inserted = await insertTest({
      name: name.trim(), questions: parsed,
      created_by: user.username, created_by_id: user.id,
      thumbs_up: 0, thumbs_down: 0, hidden: false,
    })
    if (!inserted) { setErr('Failed to save test. Check your connection.'); setLoading(false); return }

    const upd = await doUpdateUser({ upload_count: (user.upload_count||0) + 1 })
    await checkAchievements(upd)
    navigate('home')
    setLoading(false)
  }

  return (
    <div className="screen">{topBar(t.addTest, 'home')}
      <div className="add-test-form">
        <input className="field" placeholder={t.testName} value={name} onChange={e => setName(e.target.value)} />
        <textarea className="textarea" placeholder={t.pasteJSON} value={json} onChange={e => setJson(e.target.value)} rows={8} />
        {tags.length > 0 && (
          <div><label className="section-label">AI Suggested Topics</label>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {tags.map(tg => <span key={tg} className="tag tag-topic">{tg}</span>)}
            </div>
          </div>
        )}
        {err && <p className="field-err">{err}</p>}
        <button className="btn-primary full" onClick={handleAdd} disabled={loading}>
          {loading ? <><span className="spinner" /> {t.tagsLoading}</> : t.addTestBtn}
        </button>
        <button className="btn-ghost" onClick={() => navigate('home')}>{t.cancel}</button>
      </div>
    </div>
  )
}

// ─── GUIDE ────────────────────────────────────────────────────────────────────
function GuideScreen({ t, navigate, topBar }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(t.guidePrompt); setCopied(true); setTimeout(()=>setCopied(false),2500) } catch {} }
  const steps = [t.guideStep1, t.guideStep2, t.guideStep3, t.guideStep4, t.guideStep5]
  return (
    <div className="screen">{topBar(t.guideTitle, 'home')}
      <div className="guide-content">
        {steps.map((step, i) => (
          <div key={i} className="guide-step">
            <div className="guide-step-title">{step}</div>
            {i === 2 && <>
              <div className="guide-prompt-box">{t.guidePrompt}</div>
              <button className="btn-ghost copy-prompt-btn" onClick={copy} style={{ width:'100%', marginTop:'8px' }}>
                {copied ? '✅ '+t.copied : '📋 '+t.copy+' Prompt'}
              </button>
            </>}
          </div>
        ))}
        <div className="alert alert-info">💡 The AI will validate your content and auto-suggest topic & difficulty tags.</div>
      </div>
    </div>
  )
}

// ─── INVITES ─────────────────────────────────────────────────────────────────
function InvitesScreen({ user, t, topBar }) {
  const [codes, setCodes]   = useState([])
  const [copied, setCopied] = useState(null)
  useEffect(() => { getUserInviteCodes(user.username).then(setCodes) }, [])
  const generate = async () => {
    const c = await generateInviteCode(user.username)
    if (c) setCodes(cs => [c, ...cs])
  }
  const copy = async code => { try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(null),2000) } catch {} }
  return (
    <div className="screen">{topBar(t.inviteFriends, 'home')}
      <div className="invites-content">
        <button className="btn-primary full" onClick={generate}>🔗 {t.generateInvite}</button>
        <label className="section-label">{t.yourCodes}</label>
        {codes.length===0 && <p className="no-data">No codes yet. Generate one above!</p>}
        {codes.map(c => (
          <div key={c.id} className="code-row">
            <div><div className="code-val">{c.code}</div><div className="code-status">{c.used?t.used:t.unused}</div></div>
            {!c.used && <button className="btn-primary sm" onClick={() => copy(c.code)}>{copied===c.code?t.copied:t.copy}</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
function SubmissionsScreen({ user, t, navigate, topBar }) {
  const [tests, setTests] = useState([])
  const load = () => getUserTests(user.id).then(setTests)
  useEffect(() => { load() }, [])

  const toggleHide = async (id, hidden) => { await updateTest(id, { hidden: !hidden }); load() }
  const handleDelete = async id => {
    if (!window.confirm(t.confirmDelete)) return
    await deleteTest(id); load()
  }

  return (
    <div className="screen">{topBar(t.submissions, 'home')}
      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {tests.length===0 && <p className="no-data">No submissions yet.</p>}
        {tests.map(tt => (
          <SubmissionCard key={tt.id} test={tt} t={t}
            onToggleHide={() => toggleHide(tt.id, tt.hidden)}
            onDelete={() => handleDelete(tt.id)}
            onViewDetail={() => navigate('testDetail', { testId: tt.id })} />
        ))}
      </div>
    </div>
  )
}

function SubmissionCard({ test, t, onToggleHide, onDelete, onViewDetail }) {
  const [stats, setStats] = useState({ totalTaken:0, avgScore:0 })
  useEffect(() => { getTestStats(test.id).then(setStats) }, [])
  return (
    <div className="sub-card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-head)', fontWeight:'700' }}>{test.name}</span>
        <div style={{ display:'flex', gap:'4px' }}>
          {test.hidden && <span className="hist-private">{t.submissionHidden}</span>}
          {test.flagged && !test.reviewed && <span style={{ fontSize:'0.75rem', color:'var(--coral)' }}>⚠️</span>}
          {test.reviewed && <span style={{ fontSize:'0.75rem', color:'var(--success)' }}>✅</span>}
        </div>
      </div>
      <div className="sub-stat-row">
        <div className="sub-stat"><div className="sub-stat-val">{stats.totalTaken}</div><div className="sub-stat-lbl">{t.totalTaken}</div></div>
        <div className="sub-stat"><div className="sub-stat-val">{stats.avgScore}%</div><div className="sub-stat-lbl">{t.avgScore}</div></div>
        <div className="sub-stat"><div className="sub-stat-val">{test.thumbs_up||0}👍</div><div className="sub-stat-lbl">Likes</div></div>
      </div>
      <div className="sub-actions">
        <button className="btn-ghost" onClick={onViewDetail}>ℹ️</button>
        <button className="btn-ghost" onClick={onToggleHide}>{test.hidden?'👁️':t.hideSubmission}</button>
        <button className="btn-danger" onClick={onDelete}>🗑️ {t.deleteSubmission}</button>
      </div>
    </div>
  )
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfileScreen({ user, t, navigate, doUpdateUser, topBar }) {
  const [profilePrivate, setProfilePrivate] = useState(user.profile_private||false)
  const [saved, setSaved] = useState(false)
  const [reviewEligible, setReviewEligible] = useState(false)
  const [flaggedTests, setFlaggedTests] = useState([])

  useEffect(() => {
    (async () => {
      const all = await getAllUsers()
      const bySession = [...all].sort((a,b)=>(b.session_count||0)-(a.session_count||0)).slice(0,5).map(u=>u.id)
      const byAcc     = [...all].sort((a,b)=>(b.overall_accuracy||0)-(a.overall_accuracy||0)).slice(0,5).map(u=>u.id)
      const isEligible = [...new Set([...bySession,...byAcc])].includes(user.id)
      setReviewEligible(isEligible)
      if (isEligible) {
        const tests = await getTests()
        setFlaggedTests(tests.filter(t => t.flagged && !t.reviewed))
      }
    })()
  }, [])

  const save = async () => {
    await doUpdateUser({ profile_private: profilePrivate }); setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  return (
    <div className="screen">{topBar(t.profile, 'home')}
      <div className="profile-content">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0 16px' }}>
          <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
          <div className="profile-name">{user.username}</div>
          <div className="profile-meta">{user.session_count||0} sessions · {user.overall_accuracy||0}% accuracy</div>
        </div>
        {(user.achievements||[]).length > 0 && (
          <div className="card">
            <div className="section-title">🏆 Achievements</div>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {user.achievements.map(id => {
                const def = ACHIEVEMENTS_DEF.find(a => a.id === id)
                return def ? <span key={id} className="tag tag-topic">{def.icon} {T.en.achievements[id]?.title}</span> : null
              })}
            </div>
          </div>
        )}
        <div className="toggle-row">
          <div><div className="toggle-label">{t.profilePrivacy}</div><div className="toggle-sub">{profilePrivate?t.private:t.public}</div></div>
          <label className="toggle-switch">
            <input type="checkbox" checked={profilePrivate} onChange={e => setProfilePrivate(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
        <button className="btn-primary full" onClick={save}>{saved?'✅ Saved!':t.saveSettings}</button>
        {reviewEligible && <>
          <div className="divider" />
          <div className="alert alert-info">⭐ You are a Top Reviewer! You can correct flagged tests.</div>
          {flaggedTests.length===0 && <p style={{ color:'var(--muted)', fontSize:'0.85rem', textAlign:'center' }}>No flagged tests right now.</p>}
          {flaggedTests.map(ft => (
            <button key={ft.id} className="btn-ghost" onClick={() => navigate('review', { testId: ft.id })}>
              🔍 Review: {ft.name}
            </button>
          ))}
        </>}
      </div>
    </div>
  )
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────
function ReviewScreen({ user, t, lang, data, navigate, topBar }) {
  const [test, setTest]       = useState(null)
  const [questions, setQuestions] = useState([])
  useEffect(() => {
    if (!data?.testId) return
    getTestById(data.testId).then(found => { if (found) { setTest(found); setQuestions(found.questions.map(q=>({...q}))) } })
  }, [])
  const updateQ = (idx, field, val) => setQuestions(qs => qs.map((q,i) => {
    if (i!==idx) return q
    if (field==='question') return { ...q, question:{ ...q.question, [lang]:val } }
    if (field==='answer')   return { ...q, answer:  { ...q.answer,   [lang]:val } }
    return q
  }))
  const save = async () => {
    await updateTest(data.testId, { questions, flagged:false, reviewed:true, reviewed_by:user.username })
    navigate('profile')
  }
  if (!test) return <div className="screen">{topBar(t.reviewFlagged,'profile')}<div className="no-data">Loading…</div></div>
  return (
    <div className="screen">{topBar(t.reviewFlagged,'profile')}
      <div className="review-content">
        <div className="alert alert-warn">⚠️ Editing: <strong>{test.name}</strong></div>
        {questions.map((q,i) => (
          <div key={q.id||i} className="review-q">
            <label style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{t.editQuestion} #{i+1}</label>
            <textarea rows={2} value={q.question?.[lang]||q.question?.en||''} onChange={e=>updateQ(i,'question',e.target.value)} />
            <label style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{t.editAnswer}</label>
            <textarea rows={1} value={q.answer?.[lang]||q.answer?.en||''} onChange={e=>updateQ(i,'answer',e.target.value)} />
          </div>
        ))}
        <button className="btn-primary full" onClick={save}>{t.saveCorrections}</button>
        <button className="btn-ghost" onClick={() => navigate('profile')}>{t.cancel}</button>
      </div>
    </div>
  )
}
