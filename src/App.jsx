import { useState, useEffect, useCallback } from 'react'
import { T } from './i18n'
import {
  loginUser, registerUser, updateUser, hashPassword, generateInviteCode, getUserInviteCodes,
  getTests, getTestById, insertTest, updateTest, deleteTest, getUserTests,
  insertSession, getUserSessions, getSessionById, getPublicUsers, getAllUsers,
  getComments, insertComment, getWrongAnswers, incrementWrongAnswer,
  saveQuizResume, getQuizResume, deleteQuizResume, getTestStats,
  followUser, unfollowUser, checkFollow, getFollowers, getFollowing,
  getNotifications, getUnreadNotificationCount, markNotificationsRead, createNotification
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
  const [notifCount, setNotifCount] = useState(0)
  const t = T[lang]

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  useEffect(() => {
    if (!user) return
    getUnreadNotificationCount(user.id).then(setNotifCount)
    const interval = setInterval(() => getUnreadNotificationCount(user.id).then(setNotifCount), 60000)
    return () => clearInterval(interval)
  }, [user])

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

  const login = u => {
    localStorage.setItem('np_user', JSON.stringify(u))
    setUser(u)
    setScreen(u.force_password_change ? 'changePassword' : 'home')
  }
  const logout = () => { localStorage.removeItem('np_user'); setUser(null); setScreen('auth') }

  const doUpdateUser = async updates => {
    const saved = await updateUser(user.id, updates)
    if (saved) { setUser(saved); localStorage.setItem('np_user', JSON.stringify(saved)) }
    return saved || { ...user, ...updates }
  }

  const topBar = (title, back = 'home', extra = null) => (
    <div className="top-bar">
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <button className="back-btn" onClick={() => navigate(back)}><Icon name="back" size={22} /></button>
        <span className="page-title">{title}</span>
      </div>
      <div className="top-actions">
        {extra}
        <button className="lang-btn" onClick={toggleLang}>{t.switchLang}</button>
        <button className="icon-btn" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /></button>
      </div>
    </div>
  )

  const commonProps = { user, t, lang, theme, toggleTheme, toggleLang, navigate, topBar, currentScreen: screen }
  const showSidebar = user && screen !== 'auth' && screen !== 'changePassword'

  const screens = {
    auth:           <AuthScreen {...commonProps} onLogin={login} />,
    home:           <HomeScreen {...commonProps} logout={logout} notifCount={notifCount} />,
    quiz:           <QuizScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    remedial:       <RemedialScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    leaderboard:    <LeaderboardScreen {...commonProps} />,
    history:        <HistoryScreen {...commonProps} />,
    notifications:  <NotificationsScreen {...commonProps} onRead={() => setNotifCount(0)} />,
    addTest:        <AddTestScreen {...commonProps} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    guide:          <GuideScreen {...commonProps} />,
    invites:        <InvitesScreen {...commonProps} />,
    testDetail:     <TestDetailScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    submissions:    <SubmissionsScreen {...commonProps} />,
    profile:        <ProfileScreen {...commonProps} doUpdateUser={doUpdateUser} />,
    results:        <ResultsScreen {...commonProps} data={screenData} />,
    review:         <ReviewScreen {...commonProps} data={screenData} />,
    changePassword: <ChangePasswordScreen {...commonProps} doUpdateUser={doUpdateUser} />,
  }

  return (
    <div className={`app ${theme}`}>
      <style>{STYLES}</style>
      {showSidebar && (
        <Sidebar navigate={navigate} screen={screen} user={user} logout={logout}
          t={t} theme={theme} toggleTheme={toggleTheme} toggleLang={toggleLang} notifCount={notifCount} />
      )}
      <div className="main-content">
        {screens[screen] || screens.home}
      </div>
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

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor' }) => {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 }
  const paths = {
    home:     <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" strokeWidth="1.6" stroke={color} fill="none"/><path d="M9 21V12h6v9" strokeWidth="1.6" stroke={color} fill="none"/></>,
    trophy:   <><path d="M8 21h8M12 17v4M6 3h12v7a6 6 0 01-12 0V3z" strokeWidth="1.6" stroke={color} fill="none"/><path d="M6 7H3a3 3 0 003 3M18 7h3a3 3 0 01-3 3" strokeWidth="1.6" stroke={color} fill="none"/></>,
    bars:     <><rect x="3" y="12" width="4" height="9" rx="1" strokeWidth="1.6" stroke={color} fill="none"/><rect x="10" y="7" width="4" height="14" rx="1" strokeWidth="1.6" stroke={color} fill="none"/><rect x="17" y="3" width="4" height="18" rx="1" strokeWidth="1.6" stroke={color} fill="none"/></>,
    person:   <><circle cx="12" cy="8" r="4" strokeWidth="1.6" stroke={color} fill="none"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth="1.6" stroke={color} fill="none"/></>,
    plus:     <><path d="M12 5v14M5 12h14" strokeWidth="1.8" stroke={color} strokeLinecap="round"/></>,
    back:     <><path d="M15 18l-6-6 6-6" strokeWidth="1.8" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    sun:      <><circle cx="12" cy="12" r="4" strokeWidth="1.6" stroke={color} fill="none"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="1.6" stroke={color} strokeLinecap="round"/></>,
    moon:     <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="1.6" stroke={color} fill="none"/></>,
    logout:   <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="1.6" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    quiz:     <><rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.6" stroke={color} fill="none"/><path d="M8 8h8M8 12h8M8 16h5" strokeWidth="1.6" stroke={color} strokeLinecap="round"/></>,
    repeat:   <><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeWidth="1.6" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    upload:   <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="1.6" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    link:     <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeWidth="1.6" stroke={color} strokeLinecap="round" fill="none"/></>,
    list:     <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" strokeWidth="1.8" stroke={color} strokeLinecap="round"/></>,
    camera:   <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeWidth="1.6" stroke={color} fill="none"/><circle cx="12" cy="13" r="4" strokeWidth="1.6" stroke={color} fill="none"/></>,
    bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeWidth="1.6" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    search:   <><circle cx="11" cy="11" r="8" strokeWidth="1.6" stroke={color} fill="none"/><path d="M21 21l-4.35-4.35" strokeWidth="1.8" stroke={color} strokeLinecap="round"/></>,
  }
  return <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">{paths[name]}</svg>
}

// ─── SIDEBAR (desktop) ────────────────────────────────────────────────────────
function Sidebar({ navigate, screen, user, logout, t, theme, toggleTheme, toggleLang, notifCount }) {
  const items = [
    { id: 'home',          icon: 'home',   label: 'Home' },
    { id: 'leaderboard',   icon: 'trophy', label: t.leaderboard },
    { id: 'addTest',       icon: 'plus',   label: t.addTest },
    { id: 'notifications', icon: 'bell',   label: t.notifications },
    { id: 'profile',       icon: 'person', label: t.profile },
  ]
  return (
    <nav className="sidebar">
      <div className="sidebar-logo"><span className="logo-sm">Quiztagram</span></div>
      <div className="sidebar-nav">
        {items.map(item => (
          <button key={item.id} className={`sidebar-item${screen === item.id ? ' active' : ''}`} onClick={() => navigate(item.id)}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
            {item.id === 'notifications' && notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={toggleLang}><Icon name="list" size={20} /><span>{t.switchLang}</span></button>
        <button className="sidebar-item" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /><span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button>
        <button className="sidebar-item" onClick={logout}><Icon name="logout" size={20} /><span>{t.logout}</span></button>
      </div>
    </nav>
  )
}

// ─── BOTTOM NAV (mobile) ──────────────────────────────────────────────────────
function BottomNav({ navigate, screen, notifCount = 0 }) {
  const items = [
    { id: 'home',          icon: 'home' },
    { id: 'leaderboard',   icon: 'trophy' },
    { id: 'addTest',       icon: 'plus', create: true },
    { id: 'notifications', icon: 'bell' },
    { id: 'profile',       icon: 'person' },
  ]
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button key={item.id} className={`nav-item${screen === item.id ? ' active' : ''}`} onClick={() => navigate(item.id)}>
          {item.create
            ? <span className="nav-icon-create"><Icon name={item.icon} size={18} /></span>
            : (
              <div className="nav-notif-wrap">
                <Icon name={item.icon} size={24} />
                {item.id === 'notifications' && notifCount > 0 && <span className="nav-notif-dot" />}
              </div>
            )
          }
        </button>
      ))}
    </nav>
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
          <button className="icon-btn" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /></button>
        </div>
        <div className="auth-logo">
          <h1 className="logo-title">Quiztagram</h1>
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
function HomeScreen({ user, t, theme, toggleTheme, toggleLang, navigate, logout, notifCount }) {
  const [allTests, setAllTests]         = useState([])
  const [search, setSearch]             = useState('')
  const [selectedTest, setSelectedTest] = useState(null)

  useEffect(() => {
    getTests().then(data => {
      setAllTests(data)
      if (data.length) setSelectedTest(data[0].id)
    })
  }, [])

  const tests = search ? allTests.filter(tt => tt.name.toLowerCase().includes(search.toLowerCase()) || (tt.created_by || '').toLowerCase().includes(search.toLowerCase())) : allTests
  const selected = tests.find(tt => tt.id === selectedTest) || (tests.length ? tests[0] : null)

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <div className="top-actions">
          <button className="lang-btn" onClick={toggleLang}>{t.switchLang}</button>
          <button className="icon-btn" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /></button>
          <button className="icon-btn" onClick={logout}><Icon name="logout" size={20} /></button>
        </div>
      </div>

      <div className="home-hero">
        <p className="greeting">{t.hello}, <strong>{user.username}</strong></p>
        <p className="hero-sub">{t.readyToStudy}</p>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar-inner">
          <span className="search-bar-icon"><Icon name="search" size={16} /></span>
          <input className="search-bar" placeholder={t.searchTests} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {allTests.length === 0 ? (
        <div className="empty-state">
          <p>{t.noTests}</p>
          <button className="btn-primary" onClick={() => navigate('addTest')}>+ {t.addTest}</button>
        </div>
      ) : (
        <>
          {/* Stories-style test picker */}
          <div className="stories-strip">
            {tests.map(tt => (
              <div key={tt.id} className="story-item" onClick={() => setSelectedTest(tt.id)}>
                <div className={`story-ring ${tt.id === selectedTest ? 'active' : 'inactive'}`}>
                  <div className="story-inner">
                    <span className="story-emoji">📝</span>
                  </div>
                </div>
                <span className={`story-label${tt.id === selectedTest ? ' active' : ''}`}>{tt.name}</span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="section">
              <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:'600', fontSize:'0.95rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{selected.name}</div>
                  <div style={{ fontSize:'0.76rem', color:'var(--muted)', marginTop:'2px' }}>by {selected.created_by} · {selected.questions?.length} {t.questions}</div>
                </div>
                <button className="btn-ghost" style={{ fontSize:'0.78rem', padding:'6px 14px', flexShrink:0 }} onClick={() => navigate('testDetail', { testId: selectedTest })}>
                  View
                </button>
              </div>
            </div>
          )}

          <div className="action-grid">
            <button className="action-card primary" onClick={() => navigate('quiz', { testId: selectedTest })}>
              <Icon name="quiz" size={28} /><span className="ac-label">{t.startQuiz}</span>
            </button>
            <button className="action-card remedial" onClick={() => navigate('remedial', { testId: selectedTest })}>
              <Icon name="repeat" size={28} /><span className="ac-label">{t.remedialMode}</span>
            </button>
            <button className="action-card board" onClick={() => navigate('leaderboard')}>
              <Icon name="trophy" size={28} /><span className="ac-label">{t.leaderboard}</span>
            </button>
            <button className="action-card hist" onClick={() => navigate('history')}>
              <Icon name="bars" size={28} /><span className="ac-label">{t.myHistory}</span>
            </button>
          </div>
        </>
      )}

      <div className="section" style={{ paddingBottom:'10px' }}>
        <label className="section-label">{t.tools}</label>
        <div className="tool-row">
          <button className="tool-btn" style={{ display:'flex', alignItems:'center', gap:'10px' }} onClick={() => navigate('addTest')}><Icon name="upload" size={18} /> {t.addTest}</button>
          <button className="tool-btn" style={{ display:'flex', alignItems:'center', gap:'10px' }} onClick={() => navigate('guide')}><Icon name="camera" size={18} /> {t.createGuide}</button>
          <button className="tool-btn" style={{ display:'flex', alignItems:'center', gap:'10px' }} onClick={() => navigate('invites')}><Icon name="link" size={18} /> {t.inviteFriends}</button>
          <button className="tool-btn" style={{ display:'flex', alignItems:'center', gap:'10px' }} onClick={() => navigate('submissions')}><Icon name="list" size={18} /> {t.submissions}</button>
        </div>
      </div>

      <BottomNav navigate={navigate} screen="home" notifCount={notifCount} />
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
function LeaderboardScreen({ user, t, topBar, navigate }) {
  const [rows, setRows]           = useState([])
  const [reviewerIds, setReviewerIds] = useState(new Set())
  const [followingSet, setFollowingSet] = useState(new Set())

  useEffect(() => {
    (async () => {
      const all   = await getAllUsers()
      const pub   = await getPublicUsers()
      const bySession = [...all].sort((a,b)=>(b.session_count||0)-(a.session_count||0)).slice(0,5).map(u=>u.id)
      const byAcc     = [...all].sort((a,b)=>(b.overall_accuracy||0)-(a.overall_accuracy||0)).slice(0,5).map(u=>u.id)
      setReviewerIds(new Set([...bySession,...byAcc]))
      setRows(pub)
      if (user) {
        const following = await getFollowing(user.id)
        setFollowingSet(new Set(following.map(u => u.id)))
      }
    })()
  }, [])

  const toggleFollow = async (targetUser) => {
    if (!user || targetUser.id === user.id) return
    if (followingSet.has(targetUser.id)) {
      await unfollowUser(user.id, targetUser.id)
      setFollowingSet(s => { const n = new Set(s); n.delete(targetUser.id); return n })
    } else {
      await followUser(user.id, user.username, targetUser.id)
      setFollowingSet(s => new Set([...s, targetUser.id]))
    }
  }

  const medal = i => i===0?'gold':i===1?'silver':i===2?'bronze':''
  const displayName = u => u.display_name || u.username

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{t.leaderboard}</span>
      </div>
      <div style={{ padding:'12px 0 0' }}>
        {rows.length===0 && <p className="no-data">{t.noHistory}</p>}
        <div className="leaderboard-list">
          {rows.map((u,i) => (
            <div key={u.id} className="lb-row">
              <span className={`lb-rank ${medal(i)}`}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
              <span className="lb-name">{displayName(u)}{reviewerIds.has(u.id)&&<span className="reviewer-badge">⭐ Reviewer</span>}</span>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ textAlign:'right' }}>
                  <div className="lb-acc">{u.overall_accuracy||0}%</div>
                  <div className="lb-sessions">{u.session_count||0} {t.sessions}</div>
                </div>
                {user && u.id !== user.id && (
                  <button className={`follow-btn ${followingSet.has(u.id) ? 'following' : 'not-following'}`} onClick={() => toggleFollow(u)}>
                    {followingSet.has(u.id) ? t.unfollow : t.follow}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav navigate={navigate} screen="leaderboard" />
    </div>
  )
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
function HistoryScreen({ user, t, topBar, navigate }) {
  const [sessions, setSessions] = useState([])
  useEffect(() => { getUserSessions(user.id).then(setSessions) }, [])
  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{t.myHistory}</span>
      </div>
      <div style={{ padding:'12px 0 0' }}>
        {sessions.length===0 && <p className="no-data">{t.noHistory}</p>}
        <div className="history-list">
          {sessions.map(s => (
            <div key={s.id} className="hist-row">
              <div className="hist-top"><span className="hist-test">{s.test_name}</span><span className="hist-score">{s.accuracy}%</span></div>
              <div className="hist-meta">{new Date(s.created_at).toLocaleDateString()} · {s.score}/{s.total}</div>
              <span className="hist-private">{s.is_public?'🌐 '+t.publicResult:'🔒 '+t.privateResult}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav navigate={navigate} screen="history" />
    </div>
  )
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function NotificationsScreen({ user, t, navigate, topBar, onRead }) {
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    getNotifications(user.id).then(data => {
      setNotifs(data)
      markNotificationsRead(user.id)
      if (onRead) onRead()
    })
  }, [])

  const notifText = n => {
    if (n.type === 'new_follower') return <><strong>{n.actor_username}</strong> {t.notifNewFollower}</>
    if (n.type === 'new_comment')  return <><strong>{n.actor_username}</strong> {t.notifNewComment} <em>{n.data?.test_name}</em></>
    if (n.type === 'new_like')     return <><strong>{n.actor_username}</strong> {t.notifNewLike} <em>{n.data?.test_name}</em></>
    return n.type
  }

  const timeAgo = ts => {
    const diff = Date.now() - new Date(ts)
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
    return `${Math.floor(diff/86400000)}d ago`
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{t.notifications}</span>
      </div>
      <div style={{ padding:'12px 0 0' }}>
        {notifs.length === 0 && <p className="no-data">{t.noNotifications}</p>}
        <div className="notif-list">
          {notifs.map(n => (
            <div key={n.id} className={`notif-row${!n.read ? ' unread' : ''}`}>
              <div className="notif-avatar">{(n.actor_username||'?')[0].toUpperCase()}</div>
              <div className="notif-body">
                <div className="notif-text">{notifText(n)}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <div className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      </div>
      <BottomNav navigate={navigate} screen="notifications" />
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

  const handleFileUpload = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setJson(ev.target.result)
    reader.readAsText(file)
  }

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
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed.slice(0, 5) }),
      })
      const ai = await res.json()
      const aiText = ai.content?.find(c => c.type === 'text')?.text || ''
      const aiResult = JSON.parse(aiText.replace(/```json|```/g, '').trim())
      if (!aiResult.valid) { setErr('⚠️ ' + (aiResult.reason || 'Content validation failed.')); setLoading(false); return }
      setTags(aiResult.topics || [])
      if (aiResult.difficulties) {
        parsed = parsed.map(q => ({ ...q, difficulty: aiResult.difficulties[q.id] || q.difficulty || 'medium' }))
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
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>— or —</span>
          <label className="btn-ghost" style={{ cursor:'pointer', fontSize:'0.82rem', padding:'8px 14px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            <Icon name="upload" size={16} /> {t.uploadJSON}
            <input type="file" accept=".json,application/json" onChange={handleFileUpload} style={{ display:'none' }} />
          </label>
        </div>
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
  const download = () => {
    const blob = new Blob([t.guidePrompt], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'quiztagram-prompt.md'
    a.click()
    URL.revokeObjectURL(url)
  }
  const steps = [t.guideStep1, t.guideStep2, t.guideStep3, t.guideStep4, t.guideStep5]
  return (
    <div className="screen">{topBar(t.guideTitle, 'home')}
      <div className="guide-content">
        <div className="alert alert-info">{t.aiCompat}</div>
        {steps.map((step, i) => (
          <div key={i} className="guide-step">
            <div className="guide-step-title">{step}</div>
            {i === 2 && <>
              <div className="guide-prompt-box">{t.guidePrompt}</div>
              <button className="btn-primary full" onClick={download} style={{ marginTop:'8px' }}>
                ⬇ {t.downloadPrompt}
              </button>
            </>}
          </div>
        ))}
        <div className="alert alert-warn">🔬 {t.pubmedNote}</div>
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
  const [displayName, setDisplayName]       = useState(user.display_name||'')
  const [mutualOnly, setMutualOnly]         = useState(user.show_to_mutual_only||false)
  const [saved, setSaved]                   = useState(false)
  const [reviewEligible, setReviewEligible] = useState(false)
  const [flaggedTests, setFlaggedTests]     = useState([])
  const [followers, setFollowers]           = useState([])
  const [following, setFollowing]           = useState([])
  const [followTab, setFollowTab]           = useState(null)

  useEffect(() => {
    (async () => {
      const all = await getAllUsers()
      const bySession = [...all].sort((a,b)=>(b.session_count||0)-(a.session_count||0)).slice(0,5).map(u=>u.id)
      const byAcc     = [...all].sort((a,b)=>(b.overall_accuracy||0)-(a.overall_accuracy||0)).slice(0,5).map(u=>u.id)
      const isEligible = [...new Set([...bySession,...byAcc])].includes(user.id)
      setReviewEligible(isEligible)
      if (isEligible) {
        const tests = await getTests()
        setFlaggedTests(tests.filter(tt => tt.flagged && !tt.reviewed))
      }
      const [frs, fng] = await Promise.all([getFollowers(user.id), getFollowing(user.id)])
      setFollowers(frs)
      setFollowing(fng)
    })()
  }, [])

  const save = async () => {
    await doUpdateUser({ profile_private: profilePrivate, display_name: displayName.trim() || null, show_to_mutual_only: mutualOnly })
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  if (followTab) return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => setFollowTab(null)}><Icon name="back" size={22} /></button>
        <span className="page-title">{followTab === 'followers' ? t.followers : t.following}</span>
      </div>
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
        {(followTab === 'followers' ? followers : following).map(u => (
          <div key={u.id} className="lb-row" style={{ borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--ig-gradient)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
              {(u.display_name || u.username)[0].toUpperCase()}
            </div>
            <span className="lb-name">{u.display_name || u.username}</span>
            <div style={{ textAlign:'right' }}>
              <div className="lb-acc">{u.overall_accuracy||0}%</div>
              <div className="lb-sessions">{u.session_count||0} sessions</div>
            </div>
          </div>
        ))}
        {(followTab === 'followers' ? followers : following).length === 0 && <p className="no-data">{followTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>}
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{user.username}</span>
      </div>
      <div className="profile-content">
        <div style={{ display:'flex', alignItems:'center', gap:'24px', padding:'16px 0 8px' }}>
          <div className="profile-avatar"><div className="profile-avatar-inner">{user.username[0].toUpperCase()}</div></div>
          <div>
            <div className="profile-name">{user.display_name || user.username}</div>
            {user.display_name && <div className="profile-meta">@{user.username}</div>}
            <div className="profile-meta" style={{ marginTop:'4px' }}>{user.upload_count||0} tests uploaded</div>
          </div>
        </div>
        <div className="profile-stats-row">
          <div className="profile-stat-item" style={{ cursor:'pointer' }} onClick={() => setFollowTab('followers')}>
            <div className="profile-stat-num">{followers.length}</div><div className="profile-stat-lbl">{t.followers}</div>
          </div>
          <div className="profile-stat-item" style={{ cursor:'pointer' }} onClick={() => setFollowTab('following')}>
            <div className="profile-stat-num">{following.length}</div><div className="profile-stat-lbl">{t.following}</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-num">{user.session_count||0}</div><div className="profile-stat-lbl">Sessions</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-num">{user.overall_accuracy||0}%</div><div className="profile-stat-lbl">Accuracy</div>
          </div>
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
        <label className="section-label" style={{ marginTop:'6px' }}>Privacy & Display</label>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <input className="field" placeholder={t.displayNamePlaceholder} value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <p style={{ fontSize:'0.73rem', color:'var(--muted)' }}>{t.anonymousModeDesc}</p>
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">{t.mutualOnly}</div><div className="toggle-sub">{t.mutualOnlyDesc}</div></div>
            <label className="toggle-switch">
              <input type="checkbox" checked={mutualOnly} onChange={e => setMutualOnly(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">{t.profilePrivacy}</div><div className="toggle-sub">{profilePrivate?t.private:t.public}</div></div>
            <label className="toggle-switch">
              <input type="checkbox" checked={profilePrivate} onChange={e => setProfilePrivate(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
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
      <BottomNav navigate={navigate} screen="profile" />
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

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
function ChangePasswordScreen({ user, navigate, doUpdateUser }) {
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)

  const handle = async () => {
    setErr('')
    if (newPw.length < 6)           return setErr('Password must be at least 6 characters.')
    if (newPw !== confirmPw)        return setErr('Passwords do not match.')
    setLoading(true)
    const hash = await hashPassword(newPw)
    await doUpdateUser({ password_hash: hash, force_password_change: false })
    navigate('home')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-title" style={{ fontSize:'1.6rem' }}>Set your password</span>
          <p className="logo-sub">You're using a temporary password. Choose a permanent one to continue.</p>
        </div>
        <div className="auth-fields">
          <input className="field" type="password" placeholder="New password"
            value={newPw} onChange={e => setNewPw(e.target.value)} autoFocus />
          <input className="field" type="password" placeholder="Confirm password"
            value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()} />
          {err && <p className="field-err">{err}</p>}
          <button className="btn-primary full" onClick={handle} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Set Password & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
