import { useState, useEffect, useCallback } from 'react'
import { T } from './i18n'
import {
  loginUser, registerUser, updateUser, hashPassword, generateInviteCode, getUserInviteCodes,
  getTests, getTestById, insertTest, updateTest, deleteTest, getUserTests,
  insertSession, getUserSessions, getSessionById, getPublicUsers, getAllUsers,
  getComments, insertComment, getWrongAnswers, incrementWrongAnswer,
  saveQuizResume, getQuizResume, deleteQuizResume, getTestStats,
  followUser, unfollowUser, checkFollow, getFollowers, getFollowing,
  getNotifications, getUnreadNotificationCount, markNotificationsRead, createNotification,
  getTestVerifications, upsertVerification,
  requestPasswordReset, resetPassword,
  getAcademicSuggestions,
  getProStatus, createCheckoutSession, createPortalSession
} from './db'
import { STYLES } from './styles'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

const isProfileComplete = u => !!(u?.college && u?.program && u?.semester)

const needsSemesterUpdate = u => {
  if (!u?.enrolled && !u?.class_schedule?.length) return false
  if (!u?.classes_updated_at) return u?.enrolled || false
  return Date.now() - new Date(u.classes_updated_at) > 120 * 86400000
}

const getSemesterOptions = () => {
  const y = new Date().getFullYear()
  const opts = []
  for (let yr = y - 1; yr <= y + 1; yr++) {
    opts.push(`Spring ${yr}`, `Summer ${yr}`, `Fall ${yr}`)
  }
  return opts
}

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
  const [proStatus, setProStatus]   = useState({ isPro: false, ai_import_count: 0 })
  const t = T[lang]

  const isPro = proStatus.isPro

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  useEffect(() => {
    if (!user) return
    getUnreadNotificationCount(user.id).then(setNotifCount)
    const interval = setInterval(() => getUnreadNotificationCount(user.id).then(setNotifCount), 60000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return
    getProStatus(user.id).then(setProStatus)
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reset = params.get('reset')
    const pro   = params.get('pro')
    if (reset) {
      window.history.replaceState({}, '', '/')
      setScreen('resetPassword')
      setScreenData({ token: reset })
    } else if (pro === 'success' && user) {
      window.history.replaceState({}, '', '/')
      getProStatus(user.id).then(setProStatus)
      setScreen('pro')
      setScreenData({ success: true })
    }
  }, [])

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

  const commonProps = { user, t, lang, theme, toggleTheme, toggleLang, navigate, topBar, currentScreen: screen, isPro, proStatus, refreshPro: () => getProStatus(user?.id).then(setProStatus) }
  const showSidebar = user && screen !== 'auth' && screen !== 'changePassword' && screen !== 'resetPassword'

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
    achievements:   <AchievementsScreen {...commonProps} />,
    testDetail:     <TestDetailScreen {...commonProps} data={screenData} doUpdateUser={doUpdateUser} checkAchievements={checkAchievements} />,
    submissions:    <SubmissionsScreen {...commonProps} />,
    profile:        <ProfileScreen {...commonProps} doUpdateUser={doUpdateUser} />,
    results:        <ResultsScreen {...commonProps} data={screenData} />,
    review:         <ReviewScreen {...commonProps} data={screenData} />,
    changePassword: <ChangePasswordScreen {...commonProps} doUpdateUser={doUpdateUser} />,
    tos:            <TosScreen user={user} navigate={navigate} />,
    privacy:        <PrivacyScreen user={user} navigate={navigate} />,
    forgotPassword: <ForgotPasswordScreen t={t} navigate={navigate} />,
    resetPassword:  <ResetPasswordScreen t={t} data={screenData} navigate={navigate} />,
    pro:            <ProScreen {...commonProps} data={screenData} />,
  }

  return (
    <div className={`app ${theme}${showSidebar ? '' : ' no-sidebar'}`}>
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
    medal:    <><circle cx="12" cy="8" r="5" strokeWidth="1.6" stroke={color} fill="none"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" strokeWidth="1.6" stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  }
  return <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">{paths[name]}</svg>
}

// ─── SIDEBAR (desktop) ────────────────────────────────────────────────────────
function Sidebar({ navigate, screen, user, logout, t, theme, toggleTheme, toggleLang, notifCount }) {
  const items = [
    { id: 'home',          icon: 'home',   label: 'Home' },
    { id: 'leaderboard',   icon: 'trophy', label: t.leaderboard },
    { id: 'addTest',       icon: 'plus',   label: t.addTest },
    { id: 'guide',         icon: 'camera', label: t.createGuide },
    { id: 'invites',       icon: 'link',   label: t.inviteFriends },
    { id: 'achievements',  icon: 'medal',  label: t.myAchievements },
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
        <div className="sidebar-legal">
          <button onClick={() => navigate('tos')}>Terms</button>
          <button onClick={() => navigate('privacy')}>Privacy</button>
        </div>
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
function AuthScreen({ t, lang, theme, toggleTheme, toggleLang, onLogin, navigate }) {
  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite]     = useState('')
  const [captchaDone, setCaptchaDone] = useState(false)
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [showHero, setShowHero] = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    const handler = () => setShowHero(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (code) {
      setInvite(code.toUpperCase())
      setMode('register')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const handle = async () => {
    setErr('')
    if (!username.trim()) return setErr(t.enterUsername)
    if (!password.trim()) return setErr(t.enterPassword)
    setLoading(true)
    if (mode === 'login') {
      const { user, error } = await loginUser(username.trim(), password.trim())
      if (error) setErr(t.usernameNotFound)
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

  const features = [
    { icon:'quiz',   title: t.heroF1Title, desc: t.heroF1Desc },
    { icon:'bars',   title: t.heroF2Title, desc: t.heroF2Desc },
    { icon:'trophy', title: t.heroF3Title, desc: t.heroF3Desc },
    { icon:'medal',  title: t.heroF4Title, desc: t.heroF4Desc },
  ]

  return (
    <div className={`auth-screen ${theme}`}>
      <div className="auth-layout">

        {/* ── Left Hero Panel (desktop only) ── */}
        {showHero && <div className="auth-hero">
          <div className="auth-hero-inner">
            <div className="auth-hero-logo">Quiztagram</div>
            <div className="auth-hero-tagline">{t.tagline}</div>
            <div className="auth-hero-sub">{t.heroSubtext}</div>
            <div className="auth-hero-features">
              {features.map(f => (
                <div key={f.icon} className="auth-hero-feature">
                  <div className="auth-hero-feature-icon">
                    <Icon name={f.icon} size={20} color="var(--ig-blue)" />
                  </div>
                  <div>
                    <div className="auth-hero-feature-title">{f.title}</div>
                    <div className="auth-hero-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ── Right Form Panel ── */}
        <div className="auth-panel">
          <div className="auth-controls">
            <button className="lang-btn" onClick={toggleLang}>{lang === 'en' ? 'ES' : 'EN'}</button>
            <button className="icon-btn" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /></button>
          </div>
          <div className="auth-card">
            <div className="auth-logo">
              <h1 className="logo-title">Quiztagram</h1>
              <p className="logo-sub">{t.tagline}</p>
            </div>
            <div className="tab-row">
              <button className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setErr('') }}>{t.signIn}</button>
              <button className={`tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setErr('') }}>{t.register}</button>
            </div>
            <div className="auth-fields">
              <input className="field" placeholder={mode === 'login' ? t.usernameOrEmail : t.username}
                value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="off" />
              <input className="field" type="password" placeholder={t.password} value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
              {mode === 'register' && <>
                <input className="field" placeholder={t.inviteCode} value={invite}
                  onChange={e => setInvite(e.target.value)} autoCapitalize="characters" />
                {!captchaDone ? <Captcha t={t} onPass={() => setCaptchaDone(true)} /> : <p className="captcha-ok">{t.captchaPassed}</p>}
              </>}
              {err && <p className="field-err">{err}</p>}
              <button className="btn-primary full" onClick={handle} disabled={loading}>
                {loading ? <span className="spinner" /> : mode === 'login' ? t.signIn : t.createAccount}
              </button>
              {mode === 'login' && (
                <button className="btn-ghost full" style={{ marginTop:'4px', fontSize:'0.82rem' }}
                  onClick={() => navigate('forgotPassword')}>
                  {t.forgotPassword}
                </button>
              )}
            </div>
            <div className="auth-legal">
              By using Quiztagram you agree to our{' '}
              <button onClick={() => navigate('tos')}>Terms of Service</button>
              {' '}and{' '}
              <button onClick={() => navigate('privacy')}>Privacy Policy</button>.
            </div>
          </div>
        </div>

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

      {needsSemesterUpdate(user) && (
        <div className="semester-reminder">
          <span>{t.semesterReminder}</span>
          <button className="btn-primary sm" onClick={() => navigate('profile')}>{t.updateNow}</button>
        </div>
      )}

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
                  {(selected.college || selected.program || selected.semester) && (
                    <div className="meta-badge">
                      {selected.college  && <span className="meta-tag">{selected.college}</span>}
                      {selected.program  && <span className="meta-tag">{selected.program}</span>}
                      {selected.semester && <span className="meta-tag">{selected.semester}</span>}
                    </div>
                  )}
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
  const [filter, setFilter]       = useState('everyone')

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
  const displayRows = filter === 'following'
    ? rows.filter(u => followingSet.has(u.id) || u.id === user?.id)
    : rows

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="logo-sm">Quiztagram</span>
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{t.leaderboard}</span>
      </div>
      <div style={{ padding:'12px 16px 4px', display:'flex', gap:'8px' }}>
        <button className={`filter-chip${filter==='everyone'?' active':''}`} onClick={() => setFilter('everyone')}>{t.filterEveryone}</button>
        <button className={`filter-chip${filter==='following'?' active':''}`} onClick={() => setFilter('following')}>{t.filterFollowing}</button>
      </div>
      <div style={{ padding:'8px 0 0' }}>
        {displayRows.length===0 && <p className="no-data">{filter==='following' ? 'Follow someone to see them here.' : t.noHistory}</p>}
        <div className="leaderboard-list">
          {displayRows.map((u,i) => (
            <div key={u.id} className="lb-row">
              <span className={`lb-rank ${medal(i)}`}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
              <div className="lb-name">
                <div>{displayName(u)}</div>
                {reviewerIds.has(u.id) && <span className="reviewer-badge">⭐ Reviewer</span>}
              </div>
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
  const [verifications, setVerifications] = useState([])
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [verifyPassed, setVerifyPassed] = useState(null)

  useEffect(() => {
    if (!data?.testId) return
    getTestById(data.testId).then(setTest)
    getComments(data.testId).then(setComments)
    getTestVerifications(data.testId).then(setVerifications)
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

  const myVerification  = verifications.find(v => v.user_id === user.id) || null
  const totalVerified   = verifications.length
  const totalPassed     = verifications.filter(v => v.passed).length
  const passRate        = totalVerified > 0 ? Math.round((totalPassed / totalVerified) * 100) : 0
  const canVerify       = isProfileComplete(user)

  const submitVerification = async () => {
    if (verifyPassed === null) return
    const result = await upsertVerification({
      test_id: data.testId, user_id: user.id, passed: verifyPassed,
      semester_taken: user.semester || null, profile_complete: canVerify,
    })
    if (result) {
      setVerifications(vs => [...vs.filter(v => v.user_id !== user.id), result])
      setShowVerifyForm(false)
    }
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
          {(test.college || test.program || test.semester) && (
            <div className="meta-badge">
              {test.college  && <span className="meta-tag">{test.college}</span>}
              {test.program  && <span className="meta-tag">{test.program}</span>}
              {test.semester && <span className="meta-tag">{test.semester}</span>}
            </div>
          )}
          {test.ai_imported && <div className="ai-import-badge" style={{ marginTop:'10px' }}>✦ AI-Generated — verify accuracy</div>}
          {test.flagged && !test.reviewed && <div className="flagged-badge" style={{ marginTop:'10px' }}>{t.flagged}</div>}
          {test.reviewed && <div className="reviewed-badge" style={{ marginTop:'10px' }}>{t.reviewed}</div>}
        </div>

        {/* ── Verification Card ── */}
        <div className="card">
          <div className="section-title">{t.verifyTitle}</div>
          {totalVerified > 0 && (
            <div className="verify-stats">
              <div className="verify-stat"><div className="verify-stat-val">{totalVerified}</div><div className="verify-stat-lbl">{t.verifiedCount}</div></div>
              <div className="verify-stat"><div className="verify-stat-val">{totalPassed}</div><div className="verify-stat-lbl">{t.passedCount}</div></div>
              <div className="verify-stat"><div className="verify-stat-val">{passRate}%</div><div className="verify-stat-lbl">{t.passRate}</div></div>
            </div>
          )}
          {myVerification && !showVerifyForm && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.83rem', color:'var(--muted)' }}>{t.verifyMine} {myVerification.passed ? '✅' : '❌'}</span>
              <button className="btn-ghost" style={{ fontSize:'0.78rem', padding:'5px 12px' }} onClick={() => { setVerifyPassed(myVerification.passed); setShowVerifyForm(true) }}>{t.verifyUpdate}</button>
            </div>
          )}
          {!myVerification && !showVerifyForm && (
            canVerify
              ? <button className="btn-ghost" onClick={() => setShowVerifyForm(true)}>{t.verifyBtn}</button>
              : <p className="verify-note">{t.verifyNeedProfile}</p>
          )}
          {showVerifyForm && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div className="verify-pass-row">
                <button className={`verify-btn pass${verifyPassed===true?' active':''}`} onClick={() => setVerifyPassed(true)}>{t.verifyPassed}</button>
                <button className={`verify-btn fail${verifyPassed===false?' active':''}`} onClick={() => setVerifyPassed(false)}>{t.verifyFailed}</button>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="btn-primary full" onClick={submitVerification} disabled={verifyPassed===null}>{t.verifySubmit}</button>
                <button className="btn-ghost" onClick={() => setShowVerifyForm(false)}>{t.cancel}</button>
              </div>
            </div>
          )}
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
function AddTestScreen({ user, t, lang, navigate, doUpdateUser, checkAchievements, topBar, isPro, proStatus }) {
  const [mode, setMode]   = useState('json') // 'json' | 'artifact'
  const [name, setName]   = useState('')
  const [json, setJson]   = useState('')
  const [artifactCode, setArtifactCode] = useState('')
  const [copyrightOk, setCopyrightOk]   = useState(false)
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [tags, setTags]   = useState([])
  const [metaCollege, setMetaCollege]   = useState(user.college || '')
  const [metaProgram, setMetaProgram]   = useState(user.program || '')
  const [metaSemester, setMetaSemester] = useState(user.semester || '')
  const profileFilled = isProfileComplete(user)

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
      college: metaCollege.trim() || null,
      program: metaProgram.trim() || null,
      semester: metaSemester || null,
      professor: user.professor || null,
    })
    if (!inserted) { setErr('Failed to save test. Check your connection.'); setLoading(false); return }

    const upd = await doUpdateUser({ upload_count: (user.upload_count||0) + 1 })
    await checkAchievements(upd)
    navigate('home')
    setLoading(false)
  }

  const handleImportArtifact = async () => {
    if (!name.trim()) return setErr('Enter a test name.')
    if (!artifactCode.trim()) return setErr('Paste your AI artifact code first.')
    if (!copyrightOk) return setErr('Please confirm you have the right to share this content.')
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/tests/import-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactCode, name: name.trim(),
          created_by: user.username, created_by_id: user.id,
          college: metaCollege.trim() || null,
          program: metaProgram.trim() || null,
          semester: metaSemester || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'import_limit') {
          setErr(''); navigate('pro')
          setLoading(false); return
        }
        setErr(data.error || 'Import failed. Try again.'); setLoading(false); return
      }
      const upd = await doUpdateUser({ upload_count: (user.upload_count||0) + 1 })
      await checkAchievements(upd)
      navigate('home')
    } catch { setErr('Network error. Check your connection.') }
    setLoading(false)
  }

  const [collegeSuggs, setCollegeSuggs] = useState([])
  const [programSuggs, setProgramSuggs] = useState([])
  useEffect(() => { getAcademicSuggestions().then(s => { setCollegeSuggs(s.colleges); setProgramSuggs(s.programs) }) }, [])

  const originStep = (stepNum) => (
    <div className="add-test-step">
      <div className="add-test-step-label">Step {stepNum} — {t.testOrigin}</div>
      {!profileFilled && <p style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{t.testOriginNote}</p>}
      <input className="field" list="at-college-suggs" placeholder={t.collegePlaceholder} value={metaCollege} onChange={e => setMetaCollege(e.target.value)} />
      <datalist id="at-college-suggs">{collegeSuggs.map(c => <option key={c} value={c} />)}</datalist>
      <input className="field" list="at-program-suggs" placeholder={t.programPlaceholder} value={metaProgram} onChange={e => setMetaProgram(e.target.value)} />
      <datalist id="at-program-suggs">{programSuggs.map(p => <option key={p} value={p} />)}</datalist>
      <select className="select" value={metaSemester} onChange={e => setMetaSemester(e.target.value)}>
        <option value="">{t.semesterLabel}…</option>
        {getSemesterOptions().map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )

  return (
    <div className="screen">{topBar(t.addTest, 'home')}
      <div className="add-test-form">

        {/* Mode toggle */}
        <div className="tab-row" style={{ marginBottom:'4px' }}>
          <button className={`tab${mode==='json'?' active':''}`} onClick={() => { setMode('json'); setErr('') }}>JSON Upload</button>
          <button className={`tab${mode==='artifact'?' active':''}`} onClick={() => { setMode('artifact'); setErr('') }}>✦ Import AI Artifact</button>
        </div>

        {mode === 'json' && <>
          {/* Step 1 — AI Guide */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 1 — Generate with AI</div>
            <p style={{ fontSize:'0.84rem', color:'var(--muted)', lineHeight:1.55 }}>
              Use any AI assistant (Claude, ChatGPT, Gemini) to convert your exam photos or notes into a Quiztagram JSON file.
            </p>
            <button className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.85rem' }} onClick={() => navigate('guide')}>
              <Icon name="camera" size={16} /> {t.createGuide}
            </button>
          </div>

          {/* Step 2 — Test Details */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 2 — {t.testDetails}</div>
            <input className="field" placeholder={t.testName} value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Step 3 — Upload Content */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 3 — {t.uploadContent}</div>
            <textarea className="textarea" placeholder={t.pasteJSON} value={json} onChange={e => setJson(e.target.value)} rows={7} />
            <div className="or-divider">or</div>
            <label className="btn-ghost" style={{ cursor:'pointer', fontSize:'0.84rem', display:'inline-flex', alignItems:'center', gap:'8px', alignSelf:'flex-start' }}>
              <Icon name="upload" size={16} /> {t.uploadJSON}
              <input type="file" accept=".json,application/json" onChange={handleFileUpload} style={{ display:'none' }} />
            </label>
          </div>

          {originStep(4)}

          {tags.length > 0 && (
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', padding:'4px 0' }}>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)', alignSelf:'center' }}>AI Topics:</span>
              {tags.map(tg => <span key={tg} className="tag tag-topic">{tg}</span>)}
            </div>
          )}

          <div className="legal-disclaimer">
            Only upload content you created or have rights to share. Do not upload copyrighted exam questions from commercial sources (NCLEX, ATI, HESI, Kaplan, UWorld, etc.). Violations may result in content removal and account termination.
          </div>
          {err && <p className="field-err">{err}</p>}
          <button className="btn-primary full" onClick={handleAdd} disabled={loading}>
            {loading ? <><span className="spinner" /> {t.tagsLoading}</> : t.addTestBtn}
          </button>
        </>}

        {mode === 'artifact' && <>
          {/* Step 1 — Test Name */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 1 — {t.testDetails}</div>
            <input className="field" placeholder={t.testName} value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Step 2 — Paste Artifact */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 2 — Paste AI Artifact Code</div>
            <p style={{ fontSize:'0.82rem', color:'var(--muted)', lineHeight:1.55 }}>
              Copy the full artifact/canvas code generated by Claude, ChatGPT, or Gemini and paste it below. Claude will extract the questions automatically.
            </p>
            {!isPro && (
              <div style={{ fontSize:'0.78rem', color:'var(--muted)', background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'8px 12px' }}>
                {3 - (proStatus.ai_import_count || 0)} of 3 free imports remaining this month —{' '}
                <button className="link-btn" onClick={() => navigate('pro')}>Upgrade to Pro for unlimited</button>
              </div>
            )}
            <textarea className="textarea" placeholder="Paste HTML, React, or JavaScript artifact code here…" value={artifactCode} onChange={e => setArtifactCode(e.target.value)} rows={9} style={{ fontFamily:'monospace', fontSize:'0.78rem' }} />
          </div>

          {originStep(3)}

          {/* Legal safeguards */}
          <div className="add-test-step">
            <div className="add-test-step-label">Step 4 — Confirm & Legal</div>
            <div className="alert alert-warn" style={{ fontSize:'0.8rem', lineHeight:1.6 }}>
              <strong>AI-Generated Content Warning:</strong> Questions extracted from AI artifacts may contain clinical errors, hallucinations, or inaccuracies. Always verify medical information against authoritative sources before studying or sharing. Quiztagram is not responsible for errors in AI-generated content.
            </div>
            <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', fontSize:'0.83rem', color:'var(--muted)', cursor:'pointer', marginTop:'8px' }}>
              <input type="checkbox" checked={copyrightOk} onChange={e => setCopyrightOk(e.target.checked)} style={{ marginTop:'2px', flexShrink:0 }} />
              I confirm that I have the right to share this content and that it does not reproduce verbatim copyrighted material from commercial sources (NCLEX, ATI, HESI, Kaplan, UWorld, textbooks, etc.).
            </label>
          </div>

          {err && <p className="field-err">{err}</p>}
          <button className="btn-primary full" onClick={handleImportArtifact} disabled={loading}>
            {loading ? <><span className="spinner" /> Extracting questions…</> : '✦ Import Artifact'}
          </button>
        </>}

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
  const [codes, setCodes]       = useState([])
  const [copied, setCopied]     = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)
  useEffect(() => { getUserInviteCodes(user.username).then(setCodes) }, [])
  const generate = async () => {
    const c = await generateInviteCode(user.username)
    if (c) setCodes(cs => [c, ...cs])
  }
  const copy = async code => { try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(null),2000) } catch {} }
  const shareLink = async code => {
    const url = `${window.location.origin}?invite=${code}`
    try { await navigator.clipboard.writeText(url); setCopiedLink(code); setTimeout(()=>setCopiedLink(null),2000) } catch {}
  }
  return (
    <div className="screen">{topBar(t.inviteFriends, 'home')}
      <div className="invites-content">
        <button className="btn-primary full" onClick={generate}>🔗 {t.generateInvite}</button>
        <label className="section-label">{t.yourCodes}</label>
        {codes.length===0 && <p className="no-data">No codes yet. Generate one above!</p>}
        {codes.map(c => (
          <div key={c.id} className="code-row">
            <div><div className="code-val">{c.code}</div><div className="code-status">{c.used?t.used:t.unused}</div></div>
            {!c.used && <div style={{ display:'flex', gap:'6px' }}>
              <button className="btn-ghost sm" onClick={() => copy(c.code)}>{copied===c.code?t.copied:t.copy}</button>
              <button className="btn-primary sm" onClick={() => shareLink(c.code)}>{copiedLink===c.code?t.copied:'🔗 Link'}</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
function AchievementsScreen({ user, t, topBar }) {
  const earned = user.achievements || []
  return (
    <div className="screen">{topBar(t.myAchievements, 'home')}
      <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
        {ACHIEVEMENTS_DEF.map(def => {
          const isEarned = earned.includes(def.id)
          return (
            <div key={def.id} className="card" style={{ textAlign:'center', opacity: isEarned ? 1 : 0.35 }}>
              <div style={{ fontSize:'2rem', marginBottom:'8px' }}>{def.icon}</div>
              <div style={{ fontWeight:'700', fontSize:'0.85rem' }}>{t.achievements[def.id]?.title}</div>
              <div style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:'4px', lineHeight:1.4 }}>{t.achievements[def.id]?.desc}</div>
              {isEarned && <div style={{ fontSize:'0.7rem', color:'var(--success)', marginTop:'6px', fontWeight:600 }}>✓ {t.earnedLabel}</div>}
            </div>
          )
        })}
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
const AVATAR_EMOJIS = ['🎓','👩‍⚕️','👨‍⚕️','🩺','💊','🏥','🧬','🔬','🩻','📖','⭐','🎯','💙','🧪','✨']

function ProfileScreen({ user, t, navigate, doUpdateUser, topBar, isPro, proStatus }) {
  const [profilePrivate, setProfilePrivate] = useState(user.profile_private||false)
  const [displayName, setDisplayName]       = useState(user.display_name||'')
  const [mutualOnly, setMutualOnly]         = useState(user.show_to_mutual_only||false)
  const [savedMsg, setSavedMsg]             = useState('')
  const [saveErr, setSaveErr]               = useState('')
  const [reviewEligible, setReviewEligible] = useState(false)
  const [flaggedTests, setFlaggedTests]     = useState([])
  const [followers, setFollowers]           = useState([])
  const [following, setFollowing]           = useState([])
  const [followTab, setFollowTab]           = useState(null)
  // Account
  const [username, setUsername]             = useState(user.username||'')
  const [avatarEmoji, setAvatarEmoji]       = useState(user.avatar_emoji||'')
  const [email, setEmail]                   = useState(user.email||'')
  // Academic
  const [college, setCollege]               = useState(user.college||'')
  const [program, setProgram]               = useState(user.program||'')
  const [semester, setSemester]             = useState(user.semester||'')
  const [enrolled, setEnrolled]             = useState(user.enrolled||false)
  const [classSchedule, setClassSchedule]   = useState(user.class_schedule||[])
  const [newClassName, setNewClassName]     = useState('')
  const [newClassProf, setNewClassProf]     = useState('')
  const [demoPrivacy, setDemoPrivacy]       = useState(user.demographics_privacy||'private')
  // Suggestions
  const [collegeSuggs, setCollegeSuggs]     = useState([])
  const [programSuggs, setProgramSuggs]     = useState([])

  useEffect(() => {
    (async () => {
      const [all, suggs, frs, fng] = await Promise.all([
        getAllUsers(), getAcademicSuggestions(),
        getFollowers(user.id), getFollowing(user.id)
      ])
      setCollegeSuggs(suggs.colleges)
      setProgramSuggs(suggs.programs)
      const bySession = [...all].sort((a,b)=>(b.session_count||0)-(a.session_count||0)).slice(0,5).map(u=>u.id)
      const byAcc     = [...all].sort((a,b)=>(b.overall_accuracy||0)-(a.overall_accuracy||0)).slice(0,5).map(u=>u.id)
      const isEligible = [...new Set([...bySession,...byAcc])].includes(user.id)
      setReviewEligible(isEligible)
      if (isEligible) { const tests = await getTests(); setFlaggedTests(tests.filter(tt => tt.flagged && !tt.reviewed)) }
      setFollowers(frs); setFollowing(fng)
    })()
  }, [])

  const addClassPair = () => {
    if (!newClassName.trim()) return
    setClassSchedule(cs => [...cs, { name: newClassName.trim(), professor: newClassProf.trim() }])
    setNewClassName(''); setNewClassProf('')
  }

  const save = async () => {
    setSaveErr(''); setSavedMsg('')
    const schedChanged = JSON.stringify(classSchedule) !== JSON.stringify(user.class_schedule || [])
    const result = await doUpdateUser({
      username: username.trim() || user.username,
      avatar_emoji: avatarEmoji || null,
      email: email.trim() || null,
      profile_private: profilePrivate,
      display_name: displayName.trim() || null,
      show_to_mutual_only: mutualOnly,
      college: college.trim() || null,
      program: program.trim() || null,
      semester: semester || null,
      enrolled,
      class_schedule: classSchedule,
      demographics_privacy: demoPrivacy,
      ...(schedChanged ? { classes_updated_at: new Date().toISOString() } : {}),
    })
    if (result?.error === 'username_taken') { setSaveErr(t.usernameTaken); return }
    setSavedMsg('✅ Saved!'); setTimeout(() => setSavedMsg(''), 2500)
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
        <span className="page-title" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>{t.profile}</span>
      </div>

      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div className="profile-avatar">
            <div className="profile-avatar-inner">
              {avatarEmoji || user.avatar_emoji || user.username[0].toUpperCase()}
            </div>
          </div>
        </div>
        <div className="profile-header-name">
          {user.display_name || user.username}
          {isPro && <span className="pro-badge">✦ Pro</span>}
        </div>
        {user.display_name && <div className="profile-header-username">@{user.username}</div>}
        <div className="profile-header-meta">{user.upload_count||0} tests uploaded</div>
        {isPro
          ? <div style={{ fontSize:'0.75rem', color:'var(--ig-blue)', marginTop:'4px' }}>
              Pro until {new Date(proStatus.pro_expires_at).toLocaleDateString()}
            </div>
          : <button className="btn-primary sm" style={{ marginTop:'8px' }} onClick={() => navigate('pro')}>
              ✦ Upgrade to Pro
            </button>
        }
      </div>

      {/* ── Stats Row ── */}
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

      <div className="profile-content">

        {/* ── Quick Actions ── */}
        <div className="profile-quick-actions">
          <button className="profile-action-btn" onClick={() => navigate('submissions')}>
            <Icon name="list" size={20} /><span>{t.submissions}</span>
          </button>
          <button className="profile-action-btn" onClick={() => navigate('achievements')}>
            <Icon name="medal" size={20} /><span>{t.myAchievements}</span>
          </button>
        </div>

        {/* ── Account ── */}
        <div className="profile-section">
          <div className="profile-section-hdr">{t.accountSettings}</div>
          <div>
            <label className="section-label">{t.avatarLabel}</label>
            <div className="avatar-picker">
              <button className={`avatar-option clear${avatarEmoji === '' ? ' active' : ''}`} onClick={() => setAvatarEmoji('')}>
                {user.username[0].toUpperCase()}
              </button>
              {AVATAR_EMOJIS.map(e => (
                <button key={e} className={`avatar-option${avatarEmoji === e ? ' active' : ''}`} onClick={() => setAvatarEmoji(e)}>{e}</button>
              ))}
            </div>
            <p style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:'6px' }}>{t.avatarHint}</p>
          </div>
          <div>
            <label className="section-label">{t.changeUsername}</label>
            <input className="field" placeholder={user.username} value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="off" />
          </div>
          <div>
            <label className="section-label">{t.displayName}</label>
            <input className="field" placeholder={t.displayNamePlaceholder} value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <p style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:'6px' }}>{t.anonymousModeDesc}</p>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="profile-section">
          <div className="profile-section-hdr">{t.security}</div>
          <div>
            <label className="section-label">{t.recoveryEmail}</label>
            <input className="field" type="email" placeholder={t.recoveryEmailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />
            <p style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:'6px' }}>{t.recoveryEmailNote}</p>
          </div>
          <button className="btn-ghost" style={{ fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'10px' }}
            onClick={() => navigate('changePassword')}>
            <Icon name="back" size={16} style={{ transform:'rotate(180deg)' }} />{t.changePassword}
          </button>
        </div>

        {/* ── Academic Profile ── */}
        <div className="profile-section">
          <div className="profile-section-hdr">
            <span>{t.academicProfile}</span>
            {isProfileComplete({ college, program, semester })
              ? <span className="profile-complete-badge">{t.profileComplete}</span>
              : <span className="profile-incomplete-badge">{t.profileIncomplete}</span>}
          </div>
          {needsSemesterUpdate({ ...user, class_schedule: classSchedule, enrolled, classes_updated_at: user.classes_updated_at }) && (
            <div className="semester-reminder" style={{ margin:0 }}><span>{t.semesterReminder}</span></div>
          )}
          <div className="demo-section">
            <input className="field" list="college-suggs" placeholder={t.collegePlaceholder} value={college} onChange={e => setCollege(e.target.value)} />
            <datalist id="college-suggs">{collegeSuggs.map(c => <option key={c} value={c} />)}</datalist>

            <input className="field" list="program-suggs" placeholder={t.programPlaceholder} value={program} onChange={e => setProgram(e.target.value)} />
            <datalist id="program-suggs">{programSuggs.map(p => <option key={p} value={p} />)}</datalist>

            <select className="select" value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">{t.semesterLabel}…</option>
              {getSemesterOptions().map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="toggle-row">
              <div><div className="toggle-label">{t.enrolledLabel}</div></div>
              <label className="toggle-switch">
                <input type="checkbox" checked={enrolled} onChange={e => setEnrolled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div>
            <label className="section-label">{t.classesLabel}</label>
            <div className="class-sched-list">
              {classSchedule.map((cls, i) => (
                <div key={i} className="class-sched-item">
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="class-sched-name">{cls.name}</div>
                    {cls.professor && <div className="class-sched-prof">{cls.professor}</div>}
                  </div>
                  <button className="class-sched-remove" onClick={() => setClassSchedule(cs => cs.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
            <div className="class-sched-add" style={{ marginTop: classSchedule.length ? '8px' : '0' }}>
              <input className="field-sm" placeholder={t.classNamePlaceholder} value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addClassPair()} />
              <input className="field-sm" placeholder={t.classProfPlaceholder} value={newClassProf}
                onChange={e => setNewClassProf(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addClassPair()} />
              <button className="btn-primary sm" onClick={addClassPair}>{t.addClassPair}</button>
            </div>
          </div>

          <div>
            <label className="section-label">{t.demoPrivacyLabel}</label>
            <div className="privacy-chip-row">
              {[['private', t.privacyOnlyMe], ['mutuals', t.privacyMutuals], ['public', t.privacyEveryone]].map(([val, label]) => (
                <button key={val} className={`privacy-chip${demoPrivacy === val ? ' active' : ''}`} onClick={() => setDemoPrivacy(val)}>{label}</button>
              ))}
            </div>
            <p style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:'6px' }}>{t.professorPrivateNote}</p>
          </div>
        </div>

        {/* ── Privacy & Display ── */}
        <div className="profile-section">
          <div className="profile-section-hdr">Privacy & Display</div>
          <div className="toggle-row">
            <div><div className="toggle-label">{t.mutualOnly}</div><div className="toggle-sub">{t.mutualOnlyDesc}</div></div>
            <label className="toggle-switch">
              <input type="checkbox" checked={mutualOnly} onChange={e => setMutualOnly(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">{t.profilePrivacy}</div><div className="toggle-sub">{profilePrivate ? t.private : t.public}</div></div>
            <label className="toggle-switch">
              <input type="checkbox" checked={profilePrivate} onChange={e => setProfilePrivate(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {saveErr && <p className="field-err" style={{ textAlign:'center' }}>{saveErr}</p>}
        <button className="btn-primary full" onClick={save}>{savedMsg || t.saveSettings}</button>

        {reviewEligible && <>
          <div className="divider" />
          <div className="alert alert-info">⭐ You are a Top Reviewer! You can correct flagged tests.</div>
          {flaggedTests.length === 0 && <p style={{ color:'var(--muted)', fontSize:'0.85rem', textAlign:'center' }}>No flagged tests right now.</p>}
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

// ─── PRO ─────────────────────────────────────────────────────────────────────
function ProScreen({ user, t, navigate, topBar, isPro, proStatus, data, refreshPro }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  const upgrade = async () => {
    setLoading(true); setErr('')
    const res = await createCheckoutSession(user.id)
    if (res?.url) { window.location.href = res.url }
    else { setErr('Could not start checkout. Try again.'); setLoading(false) }
  }

  const manage = async () => {
    setLoading(true); setErr('')
    const res = await createPortalSession(user.id)
    if (res?.url) { window.location.href = res.url }
    else { setErr('Could not open billing portal. Try again.'); setLoading(false) }
  }

  const FEATURES = [
    { icon:'✦', title:'Unlimited AI Artifact Imports', desc:'Import as many AI-generated quizzes as you want. Free users get 3/month.' },
    { icon:'📊', title:'Advanced Analytics', desc:'Weak topic heatmaps, confidence trends, and session breakdowns. (Coming soon)' },
    { icon:'📄', title:'Export Study History', desc:'Download your full quiz history as a PDF. (Coming soon)' },
    { icon:'🎖️', title:'Pro Badge', desc:'A ✦ Pro badge on your profile visible to the community.' },
    { icon:'🔗', title:'Referral Rewards', desc:'Each friend you invite earns you 1 extra month of Pro — automatically.' },
  ]

  return (
    <div className="screen">{topBar('Quiztagram Pro', 'home')}
      <div className="pro-screen">

        {data?.success && (
          <div className="alert alert-success" style={{ margin:'0 0 16px' }}>
            🎉 You're now on Pro! Welcome to the club.
          </div>
        )}

        {/* Hero */}
        <div className="pro-hero">
          <div className="pro-hero-badge">✦ Pro</div>
          <div className="pro-hero-price">$4.99<span>/month</span></div>
          <div className="pro-hero-sub">Cancel anytime. No contracts.</div>
        </div>

        {/* Features */}
        <div className="pro-features">
          {FEATURES.map(f => (
            <div key={f.title} className="pro-feature-row">
              <div className="pro-feature-icon">{f.icon}</div>
              <div>
                <div className="pro-feature-title">{f.title}</div>
                <div className="pro-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral callout */}
        <div className="pro-referral-card">
          <div className="pro-referral-title">🔗 Share & Earn Free Pro</div>
          <div className="pro-referral-desc">
            Every invite link you share that results in a new registration earns you <strong>1 month of Pro free</strong> — automatically, no action needed.
          </div>
          <button className="btn-ghost full" style={{ marginTop:'10px' }} onClick={() => navigate('invites')}>
            View My Invite Links
          </button>
        </div>

        {err && <p className="field-err">{err}</p>}

        {isPro ? <>
          <div className="pro-active-card">
            <div className="pro-active-title">✦ Pro Active</div>
            <div className="pro-active-exp">Renews {new Date(proStatus.pro_expires_at).toLocaleDateString()}</div>
          </div>
          <button className="btn-ghost full" onClick={manage} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Manage Subscription'}
          </button>
        </> : (
          <button className="btn-primary full pro-cta" onClick={upgrade} disabled={loading}>
            {loading ? <span className="spinner" /> : '✦ Upgrade to Pro — $4.99/mo'}
          </button>
        )}

        <p style={{ fontSize:'0.72rem', color:'var(--muted)', textAlign:'center', marginTop:'12px', lineHeight:1.6 }}>
          Payments processed securely by Stripe. By subscribing you agree to our{' '}
          <button className="link-btn" onClick={() => navigate('tos')}>Terms of Service</button>.
        </p>
      </div>
    </div>
  )
}

// ─── TERMS OF SERVICE ────────────────────────────────────────────────────────
function TosScreen({ user, navigate }) {
  const back = user ? 'home' : 'auth'
  const S = ({ title, children }) => (
    <div className="legal-section">
      <div className="legal-section-title">{title}</div>
      <div className="legal-section-body">{children}</div>
    </div>
  )
  return (
    <div className="screen">
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button className="back-btn" onClick={() => navigate(back)}><Icon name="back" size={22} /></button>
          <span className="page-title">Terms of Service</span>
        </div>
      </div>
      <div className="legal-header">
        <div className="legal-header-title">Quiztagram Terms of Service</div>
        <div className="legal-header-sub">Effective May 9, 2026 · Questions: <span className="legal-email">legal@quiztagram.com</span></div>
      </div>
      <div className="legal-content">
        <S title="1. Acceptance of Terms">
          By creating an account, accessing, or using Quiztagram in any way, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all of these terms, you may not use the service. These Terms apply to all users, including visitors, registered users, and content contributors.
        </S>
        <S title="2. What Quiztagram Is">
          Quiztagram is a peer-to-peer study platform designed to help nursing and healthcare students share, discover, and practice exam questions. It is a <strong>study aid only</strong> — not a substitute for official coursework, accredited training programs, textbooks, or licensed clinical guidance. Quiztagram makes no representations about the accuracy, completeness, currency, or fitness of any content for any purpose. <strong>Do not rely on Quiztagram content for clinical, diagnostic, or patient-care decisions.</strong>
        </S>
        <S title="3. Eligibility & Account Registration">
          To use Quiztagram you must:
          <ul>
            <li>Be at least 13 years of age.</li>
            <li>Receive a valid invite code from an existing member — registration is invite-only.</li>
            <li>Provide a unique username and a secure password. You may optionally add a recovery email address used solely for password resets.</li>
            <li>Keep your login credentials confidential. You are responsible for all activity that occurs under your account.</li>
          </ul>
          You may log in using your username or your registered recovery email address. If you lose access, password reset links are sent to your recovery email and expire after one hour.
        </S>
        <S title="4. User Content & Your Responsibilities">
          You are solely responsible for all content you upload or submit. By uploading content, you represent and warrant that:
          <ul>
            <li>You created the content yourself, or you possess all rights necessary to share it on Quiztagram.</li>
            <li>The content does not infringe any copyright, trademark, trade secret, or other intellectual property right of any third party.</li>
            <li>You will <strong>not</strong> upload questions sourced from copyrighted commercial products — including but not limited to <strong>NCLEX, ATI, HESI, Kaplan, UWorld, Lippincott, or Elsevier</strong> materials — without explicit written authorization from the copyright holder.</li>
            <li>Sharing content from your own class notes, personal study materials, or professor-distributed handouts is your personal decision. You assume full responsibility for compliance with your institution's academic integrity policy. Quiztagram does not endorse or encourage academic misconduct.</li>
            <li>The content is not false, defamatory, obscene, harassing, threatening, or otherwise unlawful.</li>
          </ul>
          Quiztagram is not responsible for any academic, professional, or legal consequences arising from your use of this platform.
        </S>
        <S title="5. AI Artifact Import">
          Quiztagram allows users to import quiz content from AI-generated artifacts created by third-party AI systems (including but not limited to Claude, ChatGPT, and Gemini). By using the AI Artifact Import feature, you acknowledge and agree that:
          <ul>
            <li>You are solely responsible for ensuring the imported content does not infringe any copyright or other intellectual property right. Quiztagram uses the Anthropic Claude API to parse and convert artifact code into quiz questions — this processing does not transfer ownership or grant any license to underlying third-party content.</li>
            <li><strong>AI-generated content may contain clinical errors, hallucinations, or inaccurate medical information.</strong> All imported content is automatically labeled "AI-Generated" on the platform. You must independently verify the accuracy of all medical and clinical information before studying or sharing it.</li>
            <li>You must confirm before import that you have the rights to share the artifact content. Making a false confirmation constitutes a violation of these Terms and may result in account termination.</li>
            <li>Quiztagram disclaims all liability for harm arising from reliance on inaccurate AI-generated quiz content, including but not limited to academic harm, clinical harm, or licensure consequences.</li>
            <li>Imported tests are subject to the same community content moderation, flagging, and DMCA takedown processes as all other user-uploaded content (see Sections 4 and 8).</li>
          </ul>
        </S>
        <S title="6. Academic Profile & Privacy Controls">
          Quiztagram allows you to optionally share academic information — including college, program, semester, current classes, and professor. You control who sees this data through your profile privacy settings:
          <ul>
            <li><strong>Private:</strong> Only you can see your academic info.</li>
            <li><strong>Mutual Followers:</strong> Only users you mutually follow can see it.</li>
            <li><strong>Public:</strong> All Quiztagram users can see it.</li>
          </ul>
          Your <strong>professor field is always private</strong> regardless of your privacy setting — it is never displayed to other users. Test metadata (college, program, semester attached to an uploaded test) is always public to support search and discovery. All academic fields are optional. You can change or remove them at any time from your profile.
        </S>
        <S title="7. Exam Verification Feature">
          Quiztagram allows you to verify whether a practice test matched your real classroom exam and report whether you passed. To submit a verification, your academic profile (college, program, semester) must be complete. Verifications are used to display aggregate statistics (e.g., pass rate, verified count) on test cards. Your individual result may be visible to others depending on your profile privacy settings. You may update your verification at any time.
        </S>
        <S title="8. Social Features">
          Quiztagram includes social features — following other users, commenting on tests, and receiving notifications. You agree not to use these features to harass, threaten, impersonate, or spam other users. We reserve the right to remove content and ban accounts that abuse social features.
        </S>
        <S title="9. Copyright & DMCA Takedowns">
          Quiztagram respects intellectual property rights and will respond to valid notices under the Digital Millennium Copyright Act (DMCA). To submit a takedown request, email <strong className="legal-email">legal@quiztagram.com</strong> with:
          <ul>
            <li>Identification of the copyrighted work claimed to be infringed.</li>
            <li>The specific URL or location of the allegedly infringing content on Quiztagram.</li>
            <li>Your name, mailing address, telephone number, and email address.</li>
            <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.</li>
            <li>Your physical or electronic signature.</li>
          </ul>
          We will process valid notices promptly. Repeat infringers will have their accounts permanently terminated. Counter-notices may be submitted to the same address.
        </S>
        <S title="10. Prohibited Conduct">
          You may not:
          <ul>
            <li>Attempt to reverse-engineer, scrape, or automate access to Quiztagram.</li>
            <li>Use the platform for commercial purposes without written consent.</li>
            <li>Create multiple accounts to circumvent bans or invite restrictions.</li>
            <li>Interfere with or disrupt the security, integrity, or performance of the platform.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation.</li>
          </ul>
        </S>
        <S title="11. Disclaimer of Warranties">
          Quiztagram is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the platform will be uninterrupted, error-free, or that any content is accurate, current, or complete. Quiztagram is not affiliated with, endorsed by, or connected to NCLEX, ATI, HESI, Kaplan, UWorld, or any educational institution.
        </S>
        <S title="12. Limitation of Liability">
          To the fullest extent permitted by applicable law, Quiztagram and its operators, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of data, loss of academic standing, loss of licensure opportunity, or loss of revenue — arising out of or in connection with your use of, or inability to use, this platform, even if we have been advised of the possibility of such damages.
        </S>
        <S title="13. Account Suspension & Termination">
          We reserve the right to suspend or permanently terminate any account at our discretion, including for violation of these Terms, uploading infringing content, abusive behavior, or creation of multiple accounts to circumvent restrictions. We will generally attempt to provide notice, but are not required to do so where security or legal considerations apply. You may request account deletion by contacting <strong className="legal-email">legal@quiztagram.com</strong>.
        </S>
        <S title="14. Changes to These Terms">
          We may update these Terms at any time. When we make material changes, we will update the effective date at the top of this page and, where feasible, notify users within the app. Your continued use of Quiztagram after changes are posted constitutes your acceptance of the revised Terms.
        </S>
        <S title="15. Governing Law">
          These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Quiztagram operates, without regard to conflict-of-law principles. Any dispute arising under these Terms shall be resolved in the competent courts of that jurisdiction.
        </S>
        <S title="16. Contact">
          For legal matters, DMCA requests, account deletion, or any Terms-related questions:{' '}
          <strong className="legal-email">legal@quiztagram.com</strong>
        </S>
      </div>
    </div>
  )
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────
function PrivacyScreen({ user, navigate }) {
  const back = user ? 'home' : 'auth'
  const S = ({ title, children }) => (
    <div className="legal-section">
      <div className="legal-section-title">{title}</div>
      <div className="legal-section-body">{children}</div>
    </div>
  )
  return (
    <div className="screen">
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button className="back-btn" onClick={() => navigate(back)}><Icon name="back" size={22} /></button>
          <span className="page-title">Privacy Policy</span>
        </div>
      </div>
      <div className="legal-header">
        <div className="legal-header-title">Quiztagram Privacy Policy</div>
        <div className="legal-header-sub">Effective May 9, 2026 · Questions: <span className="legal-email">legal@quiztagram.com</span></div>
      </div>
      <div className="legal-content">
        <S title="1. What We Collect">
          We collect only what is necessary to operate the platform:
          <ul>
            <li><strong>Account credentials:</strong> Your username and a one-way cryptographic hash of your password. We never store your actual password in plain text.</li>
            <li><strong>Recovery email (optional):</strong> If you choose to add one, your email address is stored solely for password reset purposes. It is never shown publicly, never used for marketing, and never shared with third parties. See Section 3.</li>
            <li><strong>Academic profile (all optional):</strong> College or university, program or course, current semester, enrollment status, and list of classes you are taking. These are controlled by your privacy settings.</li>
            <li><strong>Professor (optional):</strong> Your professor's name, stored privately. See Section 4.</li>
            <li><strong>Study activity:</strong> Quiz sessions, scores, accuracy rates, confidence ratings, question-level wrong-answer history, and session timestamps.</li>
            <li><strong>Achievements:</strong> Earned achievement badges based on your platform activity.</li>
            <li><strong>Content you create:</strong> Tests and questions you upload, comments you post, and ratings you submit.</li>
            <li><strong>Social interactions:</strong> Users you follow and users who follow you, notifications you send and receive.</li>
            <li><strong>Exam verifications:</strong> Whether you confirmed taking a real exam and whether you passed, tied to your academic profile. See Section 5.</li>
            <li><strong>Invite codes:</strong> Which invite code you used to register, and any codes you have generated.</li>
          </ul>
        </S>
        <S title="2. How We Use Your Data">
          We use the data we collect to:
          <ul>
            <li>Operate and improve the platform — scores, leaderboards, achievements, study history, and remedial recommendations.</li>
            <li>Personalize your experience — surfacing tests relevant to your college, program, or semester.</li>
            <li>Enable peer discovery — showing aggregated, anonymized signals such as "students at your college also took this test" without revealing individual identities.</li>
            <li>Send password reset emails when you request them (if you have a recovery email set).</li>
            <li>Detect and prevent abuse, fraud, and policy violations.</li>
          </ul>
          We do <strong>not</strong> sell your data. We do <strong>not</strong> use your data for advertising. We do <strong>not</strong> share your data with third-party analytics, marketing, or ad platforms.
        </S>
        <S title="3. Recovery Email & Password Resets">
          Your recovery email address is entirely optional. If provided:
          <ul>
            <li>It is stored in your account and used <strong>only</strong> to send password reset links when you request them.</li>
            <li>Password reset tokens are single-use and expire after <strong>one hour</strong>. Unused tokens are invalidated when a new request is made.</li>
            <li>We send reset emails via Resend (resend.com), a transactional email service. Resend acts as a data processor under our instructions and may temporarily process your email address to deliver the message.</li>
            <li>Your email address is <strong>never shown</strong> to other users, never included in public APIs, and never used for any purpose other than password recovery.</li>
            <li>You can update or remove your recovery email at any time from your profile settings.</li>
          </ul>
          You may also log in using either your username or your registered email address.
        </S>
        <S title="4. Professor Field — Always Private">
          If you enter a professor's name in your academic profile, it is stored privately and <strong>never displayed to any other user</strong> under any circumstances — including when your profile is set to Public. The professor field is used only internally to improve anonymized peer matching (for example, to surface the fact that other students share your professor, without revealing who those students are or naming the professor publicly). You may leave this field blank or clear it at any time with no effect on other features.
        </S>
        <S title="5. Academic Profile Privacy Controls">
          You control who can see your academic information through three visibility tiers:
          <ul>
            <li><strong>Private (default):</strong> Only you can see your college, program, semester, enrollment status, and class list.</li>
            <li><strong>Mutual Followers:</strong> Only users you both follow and who follow you back can see this information.</li>
            <li><strong>Public:</strong> Any logged-in Quiztagram user can see it. Your professor field remains private regardless.</li>
          </ul>
          <strong>Test metadata</strong> (the college, program, and semester you attach to a test you upload) is always publicly visible to support search and discovery. You can edit or remove test metadata from your submissions at any time. Your privacy tier only controls your profile, not your uploaded test metadata.
        </S>
        <S title="6. Exam Verification Data">
          When you verify that a practice test matched a real exam you took, we store:
          <ul>
            <li>Your user ID, a reference to the test, and your pass/fail result.</li>
            <li>The timestamp of your verification.</li>
          </ul>
          Aggregate statistics (total verifications, pass count, pass rate) are displayed publicly on test detail pages. Your individual verification result may be visible to other users depending on your profile privacy settings. You may update your verification at any time.
        </S>
        <S title="7. Data Sharing & Third Parties">
          We do not sell or rent your personal data. We share data with third parties only in these limited circumstances:
          <ul>
            <li><strong>Resend (transactional email):</strong> Your recovery email address is passed to Resend solely to deliver password reset messages. Resend does not use it for any other purpose.</li>
            <li><strong>Legal compliance:</strong> When required by applicable law, regulation, court order, or valid legal process.</li>
            <li><strong>Protection of rights:</strong> To protect the rights, property, safety, or security of Quiztagram, its users, or the public.</li>
          </ul>
          No other data sharing occurs.
        </S>
        <S title="8. Data Retention & Account Deletion">
          Your data is retained for as long as your account is active. If you wish to delete your account and all associated personal data, email <strong className="legal-email">legal@quiztagram.com</strong> with the subject line "Account Deletion Request." We will process the request within <strong>30 days</strong> and confirm when deletion is complete. Note that anonymized, aggregated statistics derived from your activity may be retained as they cannot be linked back to you.
        </S>
        <S title="9. Security">
          We take reasonable measures to protect your data:
          <ul>
            <li>Passwords are hashed using SHA-256 with a server-side application salt. Plain-text passwords are never stored or logged.</li>
            <li>Password reset tokens are randomly generated UUIDs, single-use, and expire after one hour.</li>
            <li>Data is stored on servers with access controls and standard hosting security practices.</li>
          </ul>
          No internet transmission or electronic storage method is 100% secure. We encourage you to use a strong, unique password and to set a recovery email so you can regain access if needed.
        </S>
        <S title="10. Children">
          Quiztagram is not directed at children under 13 years of age and does not knowingly collect personal information from anyone under 13. If you believe we have inadvertently collected information from a child under 13, please contact us immediately at <strong className="legal-email">legal@quiztagram.com</strong> and we will take steps to delete it promptly.
        </S>
        <S title="11. Your Rights">
          Depending on your jurisdiction (including the EU/EEA under GDPR and California under CCPA), you may have the right to:
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correct:</strong> Update inaccurate or incomplete data (most data can be updated directly in your profile).</li>
            <li><strong>Delete:</strong> Request deletion of your account and associated personal data.</li>
            <li><strong>Export:</strong> Receive a machine-readable copy of your personal data.</li>
            <li><strong>Object:</strong> Object to certain processing activities.</li>
          </ul>
          To exercise any of these rights, contact <strong className="legal-email">legal@quiztagram.com</strong>. We will respond within 30 days. We may need to verify your identity before processing your request.
        </S>
        <S title="12. Changes to This Policy">
          We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date at the top of this page and post a notice within the app. Your continued use of Quiztagram after changes are posted constitutes your acceptance of the updated policy. If you disagree with any changes, you may request account deletion.
        </S>
        <S title="13. Contact">
          For privacy questions, data requests, or concerns about this policy:{' '}
          <strong className="legal-email">legal@quiztagram.com</strong>
        </S>
      </div>
    </div>
  )
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
function ForgotPasswordScreen({ t, navigate }) {
  const [username, setUsername] = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)

  const handle = async () => {
    if (!username.trim()) return
    setLoading(true)
    await requestPasswordReset(username.trim())
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="logo-title">Quiztagram</h1>
          <p className="logo-sub">{t.forgotPasswordTitle}</p>
        </div>
        {sent ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p style={{ color:'var(--muted)', marginBottom:'16px', fontSize:'0.9rem', lineHeight:'1.5' }}>{t.resetLinkSent}</p>
            <button className="btn-ghost full" onClick={() => navigate('auth')}>{t.backToSignIn}</button>
          </div>
        ) : (
          <div className="auth-fields">
            <p style={{ fontSize:'0.85rem', color:'var(--muted)', marginBottom:'4px' }}>{t.forgotPasswordDesc}</p>
            <input className="field" placeholder={t.usernameOrEmail} value={username} autoCapitalize="off"
              onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
            <button className="btn-primary full" onClick={handle} disabled={loading}>
              {loading ? <span className="spinner" /> : t.sendResetLink}
            </button>
            <button className="btn-ghost full" style={{ marginTop:'4px' }} onClick={() => navigate('auth')}>{t.backToSignIn}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
function ResetPasswordScreen({ t, data, navigate }) {
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [invalid, setInvalid]   = useState(false)

  const handle = async () => {
    setErr('')
    if (newPw.length < 6)      return setErr('Password must be at least 6 characters.')
    if (newPw !== confirmPw)   return setErr('Passwords do not match.')
    setLoading(true)
    const hash = await hashPassword(newPw)
    const res = await resetPassword(data?.token, hash)
    if (res?.error) setInvalid(true)
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="logo-title">Quiztagram</h1>
          <p className="logo-sub">{t.resetPassword}</p>
        </div>
        {done ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p style={{ color:'var(--muted)', marginBottom:'16px', fontSize:'0.9rem' }}>{t.resetSuccess}</p>
            <button className="btn-primary full" onClick={() => navigate('auth')}>{t.signIn}</button>
          </div>
        ) : invalid ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p className="field-err" style={{ textAlign:'center', marginBottom:'16px' }}>{t.resetInvalid}</p>
            <button className="btn-ghost full" onClick={() => navigate('forgotPassword')}>{t.forgotPassword}</button>
          </div>
        ) : (
          <div className="auth-fields">
            <p style={{ fontSize:'0.85rem', color:'var(--muted)', marginBottom:'4px' }}>{t.resetPasswordDesc}</p>
            <input className="field" type="password" placeholder={t.newPassword} value={newPw}
              onChange={e => setNewPw(e.target.value)} autoFocus />
            <input className="field" type="password" placeholder={t.confirmPassword} value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
            {err && <p className="field-err">{err}</p>}
            <button className="btn-primary full" onClick={handle} disabled={loading}>
              {loading ? <span className="spinner" /> : t.resetPassword}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ChangePasswordScreen({ user, navigate, doUpdateUser }) {
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)

  const forced = !!user?.force_password_change

  const handle = async () => {
    setErr('')
    if (newPw.length < 6)           return setErr('Password must be at least 6 characters.')
    if (newPw !== confirmPw)        return setErr('Passwords do not match.')
    setLoading(true)
    const hash = await hashPassword(newPw)
    await doUpdateUser({ password_hash: hash, force_password_change: false })
    navigate(forced ? 'home' : 'profile')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="logo-title" style={{ fontSize:'1.8rem' }}>Quiztagram</h1>
          <p className="logo-sub" style={{ marginTop:'8px' }}>
            {forced ? 'You\'re using a temporary password. Choose a permanent one to continue.' : 'Choose a new password for your account.'}
          </p>
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
