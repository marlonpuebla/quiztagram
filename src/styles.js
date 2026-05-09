export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ig-gradient: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #F77737, #FCAF45);
  --ig-blue: #0095F6;
  --teal: #0095F6;
  --coral: #ED4956;
  --gold: #FCAF45;
  --navy: #000000;
  --navy2: #121212;
  --navy3: #262626;
  --white: #FAFAFA;
  --muted: #8E8E8E;
  --card: #1C1C1C;
  --border: #363636;
  --success: #06D6A0;
  --danger: #ED4956;
  --font-head: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --radius: 12px;
  --radius-sm: 8px;
  --trans: 0.2s ease;
}
.light {
  --navy: #FAFAFA;
  --navy2: #F2F2F2;
  --navy3: #E8E8E8;
  --white: #262626;
  --muted: #8E8E8E;
  --card: #FFFFFF;
  --border: #DBDBDB;
}

html, body, #root { height: 100%; }
body { font-family: var(--font-body); background: var(--navy); color: var(--white); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

.app { min-height: 100vh; position: relative; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--navy3); border-radius: 4px; }

.screen { min-height: 100vh; padding-bottom: 80px; animation: fadeUp 0.25s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ── Top Bar ── */
.top-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; position:sticky; top:0; z-index:50; background:var(--navy); border-bottom:1px solid var(--border); }
.logo-sm { font-family:'Pacifico', cursive; font-size:1.5rem; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.top-actions { display:flex; gap:4px; align-items:center; }
.icon-btn { background:transparent; border:none; color:var(--white); width:38px; height:38px; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:var(--trans); }
.icon-btn:hover { background:var(--navy2); }
.lang-btn { font-family:var(--font-body); font-size:0.78rem; font-weight:600; background:transparent; color:var(--white); border:1.5px solid var(--border); padding:5px 11px; border-radius:6px; cursor:pointer; }
.back-btn { background:transparent; border:none; color:var(--white); width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.2rem; flex-shrink:0; border-radius:50%; transition:var(--trans); }
.back-btn:hover { background:var(--navy2); }
.page-title { font-weight:700; font-size:1rem; }

/* ── Bottom Nav (Instagram style) ── */
.bottom-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:480px; background:var(--navy); border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-around; padding:8px 0 calc(8px + env(safe-area-inset-bottom, 0px)); z-index:100; }
.nav-item { display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer; padding:4px 20px; background:transparent; border:none; color:var(--muted); transition:var(--trans); flex:1; }
.nav-item.active { color:var(--white); }
.nav-icon { font-size:1.5rem; line-height:1; }
.nav-icon-create { width:30px; height:30px; border-radius:8px; border:2px solid var(--white); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:300; color:var(--white); }
.nav-item.active .nav-icon-create { background:var(--white); color:var(--navy); }

/* ── Auth ── */
.auth-screen { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; background:var(--navy); }
.auth-layout { display:flex; flex-direction:column; width:100%; }
.auth-panel { display:flex; align-items:center; justify-content:center; width:100%; position:relative; }
.auth-controls { position:absolute; top:16px; right:16px; display:flex; gap:8px; }
.auth-card { width:100%; max-width:380px; padding:32px 0; position:relative; }
.auth-logo { text-align:center; margin-bottom:32px; }
.logo-icon { font-size:3.2rem; display:block; margin-bottom:6px; }
.logo-title { font-family:'Pacifico', cursive; font-size:2.6rem; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; display:block; }
.logo-sub { color:var(--muted); font-size:0.85rem; margin-top:6px; }
.tab-row { display:flex; border-bottom:1px solid var(--border); margin-bottom:24px; }
.tab { flex:1; padding:11px; border:none; background:transparent; color:var(--muted); font-family:var(--font-body); font-size:0.88rem; font-weight:600; cursor:pointer; transition:var(--trans); border-bottom:2px solid transparent; margin-bottom:-1px; }
.tab.active { color:var(--white); border-bottom-color:var(--white); }
.auth-fields { display:flex; flex-direction:column; gap:12px; }
.field { background:var(--navy2); border:1px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.95rem; outline:none; transition:var(--trans); width:100%; }
.field:focus { border-color:var(--muted); }
.field-err { color:var(--coral); font-size:0.8rem; }
.auth-hint { color:var(--muted); font-size:0.78rem; text-align:center; margin-top:16px; line-height:1.6; }
.captcha { background:var(--navy2); border-radius:var(--radius-sm); padding:13px; border:1px solid var(--border); }
.captcha-label { color:var(--muted); font-size:0.84rem; margin-bottom:8px; }
.captcha-row { display:flex; gap:8px; }
.captcha-input { flex:1; background:var(--navy); border:1px solid var(--border); color:var(--white); padding:9px 12px; border-radius:8px; font-size:0.9rem; outline:none; }
.captcha-input.err { border-color:var(--coral); }
.captcha-err { color:var(--coral); font-size:0.78rem; margin-top:5px; }
.captcha-ok { color:var(--success); font-size:0.84rem; }

/* ── Buttons ── */
.btn-primary { background:var(--ig-blue); color:#fff; font-family:var(--font-body); font-weight:700; font-size:0.93rem; padding:11px 20px; border:none; border-radius:var(--radius-sm); cursor:pointer; transition:var(--trans); display:inline-flex; align-items:center; justify-content:center; gap:8px; }
.btn-primary:hover { filter:brightness(1.1); }
.btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
.btn-primary.full { width:100%; }
.btn-primary.sm { padding:7px 13px; font-size:0.8rem; border-radius:6px; }
.btn-ghost { background:transparent; border:1.5px solid var(--border); color:var(--white); font-family:var(--font-body); font-size:0.86rem; font-weight:600; padding:10px 16px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--trans); }
.btn-ghost:hover { border-color:var(--muted); }
.btn-danger { background:var(--danger); color:#fff; font-family:var(--font-body); font-weight:700; font-size:0.83rem; padding:10px 14px; border:none; border-radius:var(--radius-sm); cursor:pointer; }
.btn-danger:hover { filter:brightness(1.08); }

/* ── Home ── */
.home-hero { padding:18px 16px 6px; }
.greeting { font-size:0.88rem; color:var(--muted); }
.hero-sub { font-weight:700; font-size:1.6rem; color:var(--white); margin-top:3px; letter-spacing:-0.5px; }
.section { padding:12px 16px 0; }
.section-label { font-size:0.7rem; font-weight:700; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; display:block; margin-bottom:9px; }
.select { width:100%; background:var(--card); border:1px solid var(--border); color:var(--white); padding:11px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.9rem; outline:none; cursor:pointer; }

/* ── Stories Strip ── */
.stories-strip { display:flex; gap:14px; overflow-x:auto; padding:14px 16px 8px; scrollbar-width:none; }
.stories-strip::-webkit-scrollbar { display:none; }
.story-item { display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; flex-shrink:0; }
.story-ring { width:62px; height:62px; border-radius:50%; padding:2.5px; transition:var(--trans); }
.story-ring.active { background:var(--ig-gradient); }
.story-ring.inactive { background:var(--border); }
.story-inner { width:100%; height:100%; border-radius:50%; background:var(--navy2); display:flex; align-items:center; justify-content:center; border:2px solid var(--navy); }
.story-emoji { font-size:1.5rem; }
.story-label { font-size:0.63rem; color:var(--muted); max-width:66px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.story-label.active { color:var(--white); font-weight:600; }

/* ── Action Grid ── */
.action-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:12px 16px 0; }
.action-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; padding:22px 14px; border-radius:var(--radius); border:1px solid var(--border); background:var(--card); cursor:pointer; transition:var(--trans); }
.action-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.4); }
.action-card.primary  { border-color:rgba(0,149,246,0.5);  background:rgba(0,149,246,0.06); }
.action-card.remedial { border-color:rgba(155,89,182,0.5); background:rgba(155,89,182,0.06); }
.action-card.board    { border-color:rgba(252,175,69,0.5); background:rgba(252,175,69,0.06); }
.action-card.hist     { border-color:rgba(237,73,86,0.5);  background:rgba(237,73,86,0.06); }
.ac-icon { font-size:1.8rem; }
.ac-label { font-weight:600; font-size:0.84rem; color:var(--white); text-align:center; }

/* ── Tool Row ── */
.tool-row { display:flex; flex-direction:column; gap:1px; background:var(--border); border-radius:var(--radius); overflow:hidden; }
.tool-btn { background:var(--card); border:none; color:var(--white); padding:14px 16px; text-align:left; font-family:var(--font-body); font-size:0.9rem; cursor:pointer; transition:background var(--trans); }
.tool-btn:hover { background:var(--navy3); }
.empty-state { text-align:center; padding:48px 20px; color:var(--muted); display:flex; flex-direction:column; gap:16px; align-items:center; font-size:0.95rem; }

/* ── Cards ── */
.card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
.card + .card { margin-top:10px; }
.section-title { font-weight:700; font-size:0.95rem; margin-bottom:10px; }

/* ── Quiz ── */
.quiz-progress { padding:0 16px 10px; }
.progress-bar { height:3px; background:var(--navy3); border-radius:2px; overflow:hidden; }
.progress-fill { height:100%; background:var(--ig-gradient); border-radius:2px; transition:width 0.4s ease; }
.progress-text { font-size:0.72rem; color:var(--muted); margin-top:5px; text-align:right; }
.question-card { margin:0 16px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
.q-meta { display:flex; gap:7px; margin-bottom:12px; flex-wrap:wrap; }
.tag { font-size:0.7rem; font-weight:600; padding:3px 9px; border-radius:20px; }
.tag-topic  { background:rgba(0,149,246,0.12);  color:var(--ig-blue); }
.tag-easy   { background:rgba(6,214,160,0.12);   color:var(--success); }
.tag-medium { background:rgba(252,175,69,0.12);  color:var(--gold); }
.tag-hard   { background:rgba(237,73,86,0.12);   color:var(--danger); }
.question-text { font-size:1rem; line-height:1.65; font-weight:400; margin-bottom:16px; }
.options-list { display:flex; flex-direction:column; gap:8px; }
.option-btn { background:var(--navy2); border:1.5px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); text-align:left; font-family:var(--font-body); font-size:0.9rem; cursor:pointer; transition:var(--trans); line-height:1.4; }
.option-btn:hover:not(:disabled) { border-color:var(--ig-blue); }
.option-btn.selected { border-color:var(--ig-blue);  background:rgba(0,149,246,0.1); }
.option-btn.correct  { border-color:var(--success); background:rgba(6,214,160,0.1); }
.option-btn.wrong    { border-color:var(--danger);  background:rgba(237,73,86,0.1); }
.option-btn:disabled { cursor:not-allowed; }
.fill-input { width:100%; background:var(--navy2); border:1.5px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.95rem; outline:none; margin-bottom:10px; }
.fill-input:focus { border-color:var(--ig-blue); }
.fill-input.correct { border-color:var(--success); }
.fill-input.wrong   { border-color:var(--danger); }
.confidence-section { margin:16px 16px 0; }
.confidence-label { font-size:0.7rem; font-weight:700; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; display:block; }
.confidence-row { display:flex; gap:8px; }
.conf-btn { flex:1; padding:11px 6px; border-radius:var(--radius-sm); border:1.5px solid var(--border); background:var(--card); color:var(--muted); font-family:var(--font-body); font-size:0.78rem; font-weight:600; cursor:pointer; transition:var(--trans); text-align:center; }
.conf-btn.low.active      { border-color:var(--coral);   background:rgba(237,73,86,0.1);   color:var(--coral);   }
.conf-btn.moderate.active { border-color:var(--gold);    background:rgba(252,175,69,0.1);  color:var(--gold);    }
.conf-btn.high.active     { border-color:var(--success); background:rgba(6,214,160,0.1);   color:var(--success); }
.submit-row { padding:12px 16px 0; display:flex; gap:10px; }
.feedback-box { margin:12px 16px 0; padding:14px; border-radius:var(--radius-sm); animation:fadeUp 0.2s ease; }
.feedback-box.correct { background:rgba(6,214,160,0.08);  border:1px solid rgba(6,214,160,0.3); }
.feedback-box.wrong   { background:rgba(237,73,86,0.08);  border:1px solid rgba(237,73,86,0.3); }
.feedback-result { font-weight:700; font-size:1rem; margin-bottom:4px; }
.feedback-answer { font-size:0.83rem; color:var(--muted); line-height:1.5; }

/* ── Results ── */
.results-screen { padding:0 16px 80px; }
.results-hero { text-align:center; padding:32px 0 20px; }
.results-score { font-size:4.2rem; font-weight:800; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; letter-spacing:-2px; }
.results-label { color:var(--muted); margin-top:8px; font-size:0.9rem; }
.stat-row { display:flex; gap:10px; margin:14px 0; }
.stat-box { flex:1; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px; text-align:center; }
.stat-val { font-size:1.3rem; font-weight:800; color:var(--ig-blue); }
.stat-lbl { font-size:0.7rem; color:var(--muted); margin-top:3px; }
.conf-insight { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:15px; margin:10px 0; }
.conf-insight-title { font-size:0.7rem; font-weight:700; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:11px; }
.conf-bar-row { display:flex; align-items:center; gap:9px; margin-bottom:7px; }
.conf-bar-label { width:130px; color:var(--muted); flex-shrink:0; font-size:0.76rem; }
.conf-bar { flex:1; height:5px; background:var(--navy2); border-radius:4px; overflow:hidden; }
.conf-bar-fill { height:100%; border-radius:4px; }
.privacy-toggle { display:flex; gap:8px; margin:10px 0; }
.priv-btn { flex:1; padding:12px; border-radius:var(--radius-sm); border:1.5px solid var(--border); background:var(--card); color:var(--muted); font-family:var(--font-body); font-size:0.82rem; font-weight:600; cursor:pointer; transition:var(--trans); }
.priv-btn.active { border-color:var(--ig-blue); color:var(--ig-blue); background:rgba(0,149,246,0.08); }
.results-actions { display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.share-box { background:var(--navy2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; word-break:break-all; font-family:'Courier New',monospace; font-size:0.76rem; color:var(--ig-blue); margin-top:8px; }

/* ── Leaderboard ── */
.leaderboard-list { padding:0 16px; display:flex; flex-direction:column; }
.lb-row { display:flex; align-items:center; gap:13px; background:var(--card); border-bottom:1px solid var(--border); padding:14px 16px; }
.lb-row:first-child { border-radius:var(--radius) var(--radius) 0 0; }
.lb-row:last-child  { border-radius:0 0 var(--radius) var(--radius); border-bottom:none; }
.lb-rank { font-weight:800; font-size:1rem; color:var(--muted); width:28px; flex-shrink:0; }
.lb-rank.gold   { color:#FFD700; }
.lb-rank.silver { color:#C0C0C0; }
.lb-rank.bronze { color:#CD7F32; }
.lb-name { flex:1; font-weight:500; font-size:0.92rem; display:flex; flex-direction:column; gap:3px; }
.lb-acc { font-weight:700; color:var(--ig-blue); font-size:0.9rem; }
.lb-sessions { font-size:0.74rem; color:var(--muted); }
.reviewer-badge { font-size:0.66rem; background:var(--gold); color:#000; padding:2px 7px; border-radius:10px; font-weight:700; margin-left:5px; }

/* ── History ── */
.history-list { padding:0 16px; display:flex; flex-direction:column; }
.hist-row { background:var(--card); border-bottom:1px solid var(--border); padding:14px 16px; }
.hist-row:first-child { border-radius:var(--radius) var(--radius) 0 0; }
.hist-row:last-child  { border-radius:0 0 var(--radius) var(--radius); border-bottom:none; }
.hist-top { display:flex; justify-content:space-between; align-items:center; }
.hist-test { font-weight:500; font-size:0.9rem; }
.hist-score { font-weight:700; color:var(--ig-blue); }
.hist-meta { font-size:0.73rem; color:var(--muted); margin-top:3px; }
.hist-private { font-size:0.68rem; color:var(--muted); background:var(--navy2); padding:2px 7px; border-radius:10px; display:inline-block; margin-top:4px; }

/* ── Test Detail ── */
.test-detail { padding:0 16px 24px; display:flex; flex-direction:column; gap:10px; }
.test-meta { display:flex; gap:8px; flex-wrap:wrap; }
.test-stat { font-size:0.8rem; color:var(--muted); }
.rating-row { display:flex; gap:10px; align-items:center; }
.thumb-btn { font-size:1.2rem; background:var(--navy2); border:1px solid var(--border); border-radius:8px; padding:7px 13px; cursor:pointer; transition:var(--trans); }
.thumb-btn:hover,.thumb-btn.active { background:var(--navy3); transform:scale(1.06); }
.thumb-count { font-size:0.83rem; color:var(--muted); }
.comment-input-row { display:flex; gap:8px; margin-bottom:2px; }
.comment-input { flex:1; background:var(--navy2); border:1px solid var(--border); color:var(--white); padding:11px 13px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.84rem; outline:none; }
.comment-item { border-left:2px solid var(--ig-blue); padding-left:11px; }
.comment-author { font-size:0.75rem; color:var(--ig-blue); font-weight:600; margin-bottom:2px; }
.comment-text { font-size:0.86rem; }
.comment-date { font-size:0.7rem; color:var(--muted); margin-top:2px; }
.flagged-badge    { background:rgba(237,73,86,0.08);  border:1px solid rgba(237,73,86,0.3);  color:var(--danger); padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; text-align:center; }
.reviewed-badge   { background:rgba(6,214,160,0.08);  border:1px solid rgba(6,214,160,0.3);  color:var(--success);padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; text-align:center; }
.ai-import-badge  { background:rgba(0,149,246,0.08);  border:1px solid rgba(0,149,246,0.25); color:var(--ig-blue); padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; text-align:center; }
.link-btn { background:none; border:none; color:var(--ig-blue); cursor:pointer; font-family:var(--font-body); font-size:inherit; padding:0; text-decoration:underline; }

/* ── Pro ── */
.pro-badge { display:inline-flex; align-items:center; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; font-size:0.8rem; font-weight:800; margin-left:8px; vertical-align:middle; }
.pro-screen { padding:16px; display:flex; flex-direction:column; gap:14px; max-width:480px; margin:0 auto; }
.pro-hero { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:28px; text-align:center; position:relative; overflow:hidden; }
.pro-hero::before { content:''; position:absolute; inset:0; background:var(--ig-gradient); opacity:0.05; pointer-events:none; }
.pro-hero-badge { display:inline-block; font-size:0.78rem; font-weight:800; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing:1px; margin-bottom:10px; }
.pro-hero-price { font-size:2.8rem; font-weight:900; color:var(--white); line-height:1; }
.pro-hero-price span { font-size:1rem; font-weight:500; color:var(--muted); }
.pro-hero-sub { font-size:0.8rem; color:var(--muted); margin-top:6px; }
.pro-features { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:4px 0; }
.pro-feature-row { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border-bottom:1px solid var(--border); }
.pro-feature-row:last-child { border-bottom:none; }
.pro-feature-icon { font-size:1.2rem; width:28px; flex-shrink:0; text-align:center; margin-top:1px; }
.pro-feature-title { font-weight:700; font-size:0.88rem; margin-bottom:3px; }
.pro-feature-desc { font-size:0.78rem; color:var(--muted); line-height:1.5; }
.pro-referral-card { background:rgba(0,149,246,0.06); border:1px solid rgba(0,149,246,0.2); border-radius:var(--radius); padding:16px; }
.pro-referral-title { font-weight:700; font-size:0.92rem; margin-bottom:6px; }
.pro-referral-desc { font-size:0.82rem; color:var(--muted); line-height:1.6; }
.pro-active-card { background:rgba(6,214,160,0.06); border:1px solid rgba(6,214,160,0.25); border-radius:var(--radius); padding:16px; text-align:center; }
.pro-active-title { font-weight:800; font-size:1rem; color:var(--success); }
.pro-active-exp { font-size:0.8rem; color:var(--muted); margin-top:4px; }
.pro-cta { background:var(--ig-gradient); border:none; font-size:1rem; font-weight:700; padding:16px; letter-spacing:0.2px; }
.alert-success { background:rgba(6,214,160,0.08); border:1px solid rgba(6,214,160,0.3); color:var(--success); padding:12px 16px; border-radius:var(--radius-sm); font-size:0.85rem; }

/* ── Add Test ── */
.add-test-form { padding:0 16px; display:flex; flex-direction:column; gap:12px; }
.textarea { background:var(--navy2); border:1px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:'Courier New',monospace; font-size:0.8rem; outline:none; resize:vertical; min-height:150px; width:100%; line-height:1.5; }

/* ── Guide ── */
.guide-content { padding:0 16px; display:flex; flex-direction:column; gap:12px; }
.guide-step { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:15px; }
.guide-step-title { font-size:0.86rem; font-weight:600; color:var(--ig-blue); margin-bottom:8px; }
.guide-prompt-box { background:var(--navy); border:1px solid var(--border); border-radius:8px; padding:13px; font-family:'Courier New',monospace; font-size:0.7rem; color:var(--muted); white-space:pre-wrap; word-break:break-word; max-height:180px; overflow-y:auto; line-height:1.5; }
.copy-prompt-btn { margin-top:8px; }

/* ── Invites ── */
.invites-content { padding:0 16px; display:flex; flex-direction:column; gap:10px; }
.code-row { display:flex; align-items:center; justify-content:space-between; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:11px 15px; }
.code-val { font-family:'Courier New',monospace; font-size:0.88rem; color:var(--ig-blue); }
.code-status { font-size:0.73rem; color:var(--muted); margin-top:2px; }

/* ── Submissions ── */
.sub-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:15px; display:flex; flex-direction:column; gap:9px; }
.sub-actions { display:flex; gap:7px; flex-wrap:wrap; }
.sub-stat-row { display:flex; gap:14px; }
.sub-stat { text-align:center; }
.sub-stat-val { font-size:1.15rem; font-weight:700; color:var(--ig-blue); }
.sub-stat-lbl { font-size:0.7rem; color:var(--muted); }

/* ── Profile ── */
.profile-content { padding:0 16px; display:flex; flex-direction:column; gap:10px; }
.profile-avatar { width:76px; height:76px; border-radius:50%; padding:3px; background:var(--ig-gradient); margin-bottom:4px; flex-shrink:0; }
.profile-avatar-inner { width:100%; height:100%; border-radius:50%; background:var(--navy2); display:flex; align-items:center; justify-content:center; font-size:1.9rem; font-weight:700; color:var(--white); border:2px solid var(--navy); }
.profile-name { font-weight:700; font-size:1.2rem; }
.profile-meta { font-size:0.8rem; color:var(--muted); }
.profile-stats-row { display:flex; justify-content:space-around; padding:16px 0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.profile-stat-item { text-align:center; }
.profile-stat-num { font-size:1.2rem; font-weight:700; color:var(--white); }
.profile-stat-lbl { font-size:0.73rem; color:var(--muted); margin-top:2px; }
.toggle-row { display:flex; align-items:center; justify-content:space-between; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:13px 15px; }
.toggle-label { font-size:0.88rem; font-weight:500; }
.toggle-sub { font-size:0.73rem; color:var(--muted); margin-top:2px; }
.toggle-switch { position:relative; width:46px; height:25px; flex-shrink:0; }
.toggle-switch input { opacity:0; width:0; height:0; }
.toggle-slider { position:absolute; inset:0; background:var(--navy3); border-radius:13px; cursor:pointer; transition:var(--trans); }
.toggle-slider:before { content:''; position:absolute; width:19px; height:19px; left:3px; bottom:3px; background:white; border-radius:50%; transition:var(--trans); }
input:checked + .toggle-slider { background:var(--ig-blue); }
input:checked + .toggle-slider:before { transform:translateX(21px); }

/* ── Remedial ── */
.remedial-choice { padding:0 16px; display:flex; flex-direction:column; gap:10px; }
.remedial-option { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; cursor:pointer; transition:var(--trans); }
.remedial-option:hover { border-color:var(--ig-blue); }
.remedial-option-icon { font-size:1.9rem; margin-bottom:7px; }
.remedial-option-title { font-weight:700; font-size:0.98rem; }
.remedial-option-desc { font-size:0.82rem; color:var(--muted); margin-top:4px; }

/* ── Filter ── */
.filter-bar { padding:0 0 10px; display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; }
.filter-bar::-webkit-scrollbar { display:none; }
.filter-chip { flex-shrink:0; padding:7px 16px; border-radius:20px; border:1.5px solid var(--border); background:transparent; color:var(--muted); font-size:0.8rem; font-weight:600; cursor:pointer; transition:var(--trans); white-space:nowrap; }
.filter-chip.active { background:var(--white); color:var(--navy); border-color:var(--white); }

/* ── Review ── */
.review-content { padding:0 16px; display:flex; flex-direction:column; gap:10px; }
.review-q { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:13px; display:flex; flex-direction:column; gap:7px; }
.review-q textarea { background:var(--navy2); border:1px solid var(--border); color:var(--white); border-radius:8px; padding:9px; font-family:var(--font-body); font-size:0.84rem; outline:none; resize:vertical; width:100%; }

/* ── Achievement Toast ── */
.achievement-toast { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); z-index:1000; width:calc(100% - 40px); max-width:400px; background:var(--ig-gradient); color:#fff; border-radius:var(--radius); padding:14px 18px; box-shadow:0 20px 60px rgba(0,0,0,0.6); animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1); display:flex; gap:13px; align-items:center; }
@keyframes toastIn { from { transform:translateX(-50%) translateY(80px) scale(0.88); opacity:0; } to { transform:translateX(-50%) translateY(0) scale(1); opacity:1; } }
.achievement-toast.out { animation:toastOut 0.3s ease forwards; }
@keyframes toastOut { to { transform:translateX(-50%) translateY(80px) scale(0.88); opacity:0; } }
.toast-icon { font-size:1.9rem; flex-shrink:0; }
.toast-title { font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; opacity:0.85; }
.toast-name { font-size:0.98rem; font-weight:800; }
.toast-desc { font-size:0.8rem; opacity:0.85; margin-top:1px; }

/* ── Search Bar ── */
.search-bar-wrap { padding:8px 16px 4px; }
.search-bar { width:100%; background:var(--navy2); border:1px solid var(--border); color:var(--white); padding:10px 14px 10px 38px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.88rem; outline:none; transition:var(--trans); }
.search-bar:focus { border-color:var(--muted); }
.search-bar-inner { position:relative; }
.search-bar-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--muted); }

/* ── Follow Button ── */
.follow-btn { font-family:var(--font-body); font-size:0.8rem; font-weight:700; padding:6px 14px; border-radius:var(--radius-sm); border:none; cursor:pointer; transition:var(--trans); flex-shrink:0; }
.follow-btn.following { background:var(--navy2); color:var(--white); border:1.5px solid var(--border); }
.follow-btn.not-following { background:var(--ig-blue); color:#fff; }
.follow-btn.not-following:hover { filter:brightness(1.1); }

/* ── Notification Badge ── */
.notif-badge { background:var(--danger); color:#fff; border-radius:10px; font-size:0.65rem; font-weight:700; padding:2px 5px; min-width:16px; text-align:center; line-height:1.4; }
.nav-notif-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
.nav-notif-dot { position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:var(--danger); border-radius:50%; border:1.5px solid var(--navy); }

/* ── Notifications Screen ── */
.notif-list { padding:0 16px; display:flex; flex-direction:column; }
.notif-row { display:flex; align-items:flex-start; gap:12px; padding:14px 0; border-bottom:1px solid var(--border); }
.notif-row:last-child { border-bottom:none; }
.notif-row.unread { background:rgba(0,149,246,0.04); margin:0 -16px; padding:14px 16px; }
.notif-avatar { width:38px; height:38px; border-radius:50%; background:var(--ig-gradient); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.9rem; flex-shrink:0; }
.notif-body { flex:1; min-width:0; }
.notif-text { font-size:0.88rem; line-height:1.4; }
.notif-text strong { color:var(--ig-blue); }
.notif-time { font-size:0.72rem; color:var(--muted); margin-top:3px; }
.notif-unread-dot { width:8px; height:8px; border-radius:50%; background:var(--ig-blue); flex-shrink:0; margin-top:6px; }

/* ── Desktop Sidebar ── */
.sidebar { display:none; }
@media (min-width: 768px) {
  .app { display:flex; min-height:100vh; }
  .sidebar { display:flex; flex-direction:column; position:fixed; left:0; top:0; bottom:0; width:240px; background:var(--navy); border-right:1px solid var(--border); z-index:100; padding:16px 0; }
  .sidebar-logo { padding:8px 20px 20px; }
  .sidebar-nav { flex:1; display:flex; flex-direction:column; gap:2px; padding:0 10px; }
  .sidebar-item { display:flex; align-items:center; gap:14px; padding:12px 12px; border-radius:var(--radius-sm); border:none; background:transparent; color:var(--muted); font-family:var(--font-body); font-size:0.93rem; cursor:pointer; transition:var(--trans); text-align:left; width:100%; position:relative; }
  .sidebar-item:hover { background:var(--navy2); color:var(--white); }
  .sidebar-item.active { color:var(--white); font-weight:600; }
  .sidebar-item .notif-badge { margin-left:auto; }
  .sidebar-footer { padding:10px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:2px; }
  .main-content { margin-left:240px; flex:1; }
  .bottom-nav { display:none !important; }
  .screen { padding-bottom:20px; }
  .top-actions { display:none !important; }
  .top-bar .logo-sm { display:none; }
}
@media (max-width: 767px) {
  .main-content { max-width:480px; margin:0 auto; }
}

/* ── Academic Demographics ── */
.demo-section { display:flex; flex-direction:column; gap:8px; }
.class-list { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
.class-chip { display:inline-flex; align-items:center; gap:5px; background:var(--navy3); border:1px solid var(--border); border-radius:20px; padding:4px 10px 4px 12px; font-size:0.8rem; color:var(--white); }
.class-chip-remove { background:transparent; border:none; color:var(--muted); cursor:pointer; font-size:1rem; padding:0; line-height:1; display:flex; align-items:center; }
.class-chip-remove:hover { color:var(--coral); }
.class-add-row { display:flex; gap:8px; }
.privacy-chip-row { display:flex; gap:6px; flex-wrap:wrap; }
.privacy-chip { padding:6px 14px; border-radius:20px; border:1.5px solid var(--border); background:transparent; color:var(--muted); font-size:0.8rem; font-weight:600; cursor:pointer; transition:var(--trans); white-space:nowrap; }
.privacy-chip.active { background:var(--ig-blue); border-color:var(--ig-blue); color:#fff; }
.profile-complete-badge { display:inline-flex; align-items:center; gap:4px; font-size:0.72rem; font-weight:600; padding:3px 9px; border-radius:10px; background:rgba(6,214,160,0.1); color:var(--success); border:1px solid rgba(6,214,160,0.25); }
.profile-incomplete-badge { display:inline-flex; align-items:center; gap:4px; font-size:0.72rem; font-weight:600; padding:3px 9px; border-radius:10px; background:rgba(237,73,86,0.08); color:var(--coral); border:1px solid rgba(237,73,86,0.25); }

/* ── Semester Reminder ── */
.semester-reminder { margin:0 16px 4px; padding:11px 14px; border-radius:var(--radius-sm); background:rgba(252,175,69,0.08); border:1px solid rgba(252,175,69,0.25); color:var(--gold); display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:0.82rem; }

/* ── Test Metadata Badges ── */
.meta-badge { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.meta-tag { font-size:0.7rem; padding:3px 9px; border-radius:10px; background:rgba(0,149,246,0.08); color:var(--ig-blue); border:1px solid rgba(0,149,246,0.2); }

/* ── Verification Card ── */
.verify-stats { display:flex; gap:20px; padding:4px 0; }
.verify-stat { text-align:center; }
.verify-stat-val { font-size:1.2rem; font-weight:800; color:var(--ig-blue); }
.verify-stat-lbl { font-size:0.7rem; color:var(--muted); margin-top:2px; }
.verify-note { font-size:0.78rem; color:var(--muted); font-style:italic; line-height:1.4; }
.verify-pass-row { display:flex; gap:8px; }
.verify-btn { flex:1; padding:12px; border-radius:var(--radius-sm); border:1.5px solid var(--border); background:var(--card); color:var(--muted); font-family:var(--font-body); font-size:0.85rem; font-weight:600; cursor:pointer; transition:var(--trans); text-align:center; }
.verify-btn.pass.active  { border-color:var(--success); background:rgba(6,214,160,0.1);  color:var(--success); }
.verify-btn.fail.active  { border-color:var(--coral);   background:rgba(237,73,86,0.1);  color:var(--coral);   }

/* ── Legal Pages ── */
.legal-content { padding:0 16px 32px; display:flex; flex-direction:column; gap:10px; }
.legal-header { padding:20px 16px 8px; }
.legal-header-title { font-size:1.1rem; font-weight:700; }
.legal-header-sub { font-size:0.75rem; color:var(--muted); margin-top:4px; }
.legal-section { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
.legal-section-title { font-size:0.72rem; font-weight:700; color:var(--ig-blue); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.legal-section-body { font-size:0.82rem; line-height:1.75; color:var(--muted); }
.legal-section-body strong { color:var(--white); font-weight:600; }
.legal-section-body .legal-email { color:var(--ig-blue); font-weight:600; }
.legal-section-body ul { padding-left:16px; margin:6px 0; display:flex; flex-direction:column; gap:4px; }
.legal-disclaimer { background:rgba(237,73,86,0.06); border:1px solid rgba(237,73,86,0.2); border-radius:var(--radius-sm); padding:12px 14px; font-size:0.78rem; color:var(--muted); line-height:1.6; }

/* ── Sidebar Legal ── */
.sidebar-legal { padding:8px 14px 6px; display:flex; gap:18px; }
.sidebar-legal button { background:none; border:none; color:var(--muted); font-size:0.7rem; cursor:pointer; padding:0; font-family:var(--font-body); transition:var(--trans); }
.sidebar-legal button:hover { color:var(--white); }

/* ── Auth Legal Footer ── */
.auth-legal { text-align:center; margin-top:16px; font-size:0.72rem; color:var(--muted); line-height:1.8; }
.auth-legal button { background:none; border:none; color:var(--ig-blue); cursor:pointer; padding:0; font-size:0.72rem; font-family:var(--font-body); }

/* ── Auth Desktop Two-Column ── */
@media (min-width: 768px) {
  .auth-screen { padding:0; align-items:stretch; }
  .auth-layout { flex-direction:row; min-height:100vh; }
  .auth-hero { display:flex; flex-direction:column; justify-content:center; flex:1; padding:64px 72px; position:relative; overflow:hidden; border-right:1px solid var(--border); }
  .auth-hero::before { content:''; position:absolute; inset:0; background:var(--ig-gradient); opacity:0.05; pointer-events:none; }
  .auth-hero::after { content:''; position:absolute; top:-160px; right:-160px; width:480px; height:480px; background:var(--ig-gradient); opacity:0.08; border-radius:50%; filter:blur(80px); pointer-events:none; }
  .auth-hero-inner { position:relative; z-index:1; max-width:500px; }
  .auth-panel { width:460px; flex-shrink:0; padding:48px; }
  .auth-card .auth-logo { display:none; }
}
.auth-hero-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(0,149,246,0.1); border:1px solid rgba(0,149,246,0.25); border-radius:20px; padding:5px 14px; font-size:0.75rem; color:var(--ig-blue); font-weight:600; letter-spacing:0.3px; margin-bottom:28px; }
.auth-hero-logo { display:inline-block; font-family:'Pacifico', cursive; font-size:3.2rem; background:var(--ig-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:20px; line-height:1.4; padding-bottom:10px; }
.auth-hero-tagline { font-size:1.55rem; font-weight:800; color:var(--white); margin-bottom:10px; line-height:1.3; letter-spacing:-0.5px; }
.auth-hero-sub { color:var(--muted); font-size:0.9rem; margin-bottom:44px; line-height:1.7; max-width:400px; }
.auth-hero-features { display:flex; flex-direction:column; gap:24px; }
.auth-hero-feature { display:flex; align-items:flex-start; gap:15px; }
.auth-hero-feature-icon { width:42px; height:42px; border-radius:10px; background:rgba(0,149,246,0.08); border:1px solid rgba(0,149,246,0.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.auth-hero-feature-title { font-weight:700; font-size:0.93rem; color:var(--white); margin-bottom:3px; }
.auth-hero-feature-desc { font-size:0.8rem; color:var(--muted); line-height:1.55; }

/* ── Profile Sections ── */
.profile-header { text-align:center; padding:24px 16px 8px; }
.profile-header-name { font-size:1.15rem; font-weight:700; margin-top:10px; }
.profile-header-username { font-size:0.82rem; color:var(--muted); margin-top:3px; }
.profile-header-meta { font-size:0.78rem; color:var(--muted); margin-top:3px; }
.profile-quick-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.profile-action-btn { display:flex; align-items:center; justify-content:center; gap:9px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px; font-family:var(--font-body); font-size:0.88rem; font-weight:600; color:var(--white); cursor:pointer; transition:var(--trans); }
.profile-action-btn:hover { border-color:var(--muted); background:var(--navy3); }
.profile-section { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:18px; display:flex; flex-direction:column; gap:12px; }
.profile-section-hdr { font-size:0.66rem; font-weight:700; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; display:flex; align-items:center; justify-content:space-between; }
.no-sidebar .main-content { margin-left:0 !important; }

/* ── Class Schedule (name + professor pairs) ── */
.class-sched-list { display:flex; flex-direction:column; gap:6px; }
.class-sched-item { display:flex; align-items:center; justify-content:space-between; background:var(--navy2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:9px 12px; gap:10px; }
.class-sched-name { font-size:0.88rem; font-weight:600; }
.class-sched-prof { font-size:0.75rem; color:var(--muted); margin-top:1px; }
.class-sched-remove { background:transparent; border:none; color:var(--muted); cursor:pointer; font-size:1.1rem; padding:0; line-height:1; flex-shrink:0; }
.class-sched-remove:hover { color:var(--coral); }
.class-sched-add { display:flex; flex-direction:column; gap:7px; }
.class-sched-add .field-sm { width:100%; box-sizing:border-box; background:var(--navy2); border:1px solid var(--border); color:var(--white); padding:10px 12px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.88rem; outline:none; transition:var(--trans); }
.class-sched-add .field-sm:focus { border-color:var(--muted); }

/* ── Avatar Emoji Picker ── */
.avatar-picker { display:flex; gap:8px; flex-wrap:wrap; padding:4px 0; }
.avatar-option { width:44px; height:44px; border-radius:50%; border:2px solid var(--border); background:var(--navy2); display:flex; align-items:center; justify-content:center; font-size:1.35rem; cursor:pointer; transition:var(--trans); }
.avatar-option:hover { border-color:var(--muted); }
.avatar-option.active { border-color:var(--ig-blue); background:rgba(0,149,246,0.1); }
.avatar-option.clear { font-size:0.7rem; font-weight:700; color:var(--muted); letter-spacing:0.5px; }

/* ── Add Test Step Sections ── */
.add-test-step { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; display:flex; flex-direction:column; gap:10px; }
.add-test-step-label { font-size:0.65rem; font-weight:700; color:var(--ig-blue); text-transform:uppercase; letter-spacing:1.2px; }
.or-divider { display:flex; align-items:center; gap:10px; color:var(--muted); font-size:0.78rem; }
.or-divider::before,.or-divider::after { content:''; flex:1; height:1px; background:var(--border); }

/* ── Misc ── */
.divider { height:1px; background:var(--border); margin:4px 0; }
.spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.2); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.no-data { text-align:center; color:var(--muted); padding:32px 20px; font-size:0.88rem; }
.alert { padding:11px 14px; border-radius:var(--radius-sm); font-size:0.83rem; line-height:1.5; }
.alert-warn { background:rgba(252,175,69,0.08); border:1px solid rgba(252,175,69,0.25); color:var(--gold); }
.alert-info { background:rgba(0,149,246,0.08); border:1px solid rgba(0,149,246,0.25); color:var(--ig-blue); }
`
