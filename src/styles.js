export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --teal: #0EC4B0; --coral: #FF6B6B; --gold: #FFD166; --navy: #0A1628;
  --navy2: #112240; --navy3: #1E3A5F; --white: #F0F4FF; --muted: #8899BB;
  --card: #152535; --border: #1E3A5F; --success: #06D6A0; --danger: #EF476F;
  --font-head: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
  --radius: 16px; --radius-sm: 10px; --trans: 0.2s ease;
}
.light {
  --navy: #F0F4FF; --navy2: #E2EAF8; --navy3: #CBD5E8; --white: #0A1628;
  --muted: #4A5568; --card: #FFFFFF; --border: #CBD5E8;
}

html, body, #root { height: 100%; }
body { font-family: var(--font-body); background: var(--navy); color: var(--white); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

.app { min-height: 100vh; max-width: 480px; margin: 0 auto; position: relative; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--navy3); border-radius: 4px; }

.screen { min-height: 100vh; padding-bottom: 80px; animation: fadeUp 0.3s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

/* ── Top Bar ── */
.top-bar { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; position:sticky; top:0; z-index:50; background:var(--navy); border-bottom:1px solid var(--border); backdrop-filter:blur(12px); }
.logo-sm { font-family:var(--font-head); font-weight:800; font-size:1.15rem; color:var(--teal); letter-spacing:-0.5px; }
.top-actions { display:flex; gap:6px; align-items:center; }
.icon-btn { background:var(--navy2); border:1px solid var(--border); color:var(--white); width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; transition:var(--trans); }
.icon-btn:hover { background:var(--navy3); }
.lang-btn { font-family:var(--font-head); font-size:0.72rem; font-weight:700; background:var(--teal); color:var(--navy); border:none; padding:5px 11px; border-radius:20px; cursor:pointer; letter-spacing:0.5px; }
.back-btn { background:var(--navy2); border:1px solid var(--border); color:var(--white); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1rem; flex-shrink:0; transition:var(--trans); }
.back-btn:hover { background:var(--navy3); }
.page-title { font-family:var(--font-head); font-weight:800; font-size:1.2rem; }

/* ── Auth ── */
.auth-screen { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; background: radial-gradient(ellipse at 20% 20%, rgba(14,196,176,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(255,107,107,0.08) 0%, transparent 55%), var(--navy); position:relative; }
.auth-card { width:100%; max-width:400px; background:var(--card); border:1px solid var(--border); border-radius:24px; padding:32px 28px; box-shadow:0 32px 80px rgba(0,0,0,0.4); position:relative; }
.auth-logo { text-align:center; margin-bottom:28px; }
.logo-icon { font-size:2.5rem; display:block; margin-bottom:4px; }
.logo-title { font-family:var(--font-head); font-weight:800; font-size:2rem; color:var(--teal); letter-spacing:-1px; display:block; }
.logo-sub { color:var(--muted); font-size:0.84rem; margin-top:4px; }
.tab-row { display:flex; background:var(--navy2); border-radius:12px; padding:4px; margin-bottom:20px; }
.tab { flex:1; padding:9px; border:none; background:transparent; color:var(--muted); font-family:var(--font-head); font-size:0.85rem; font-weight:600; border-radius:9px; cursor:pointer; transition:var(--trans); }
.tab.active { background:var(--teal); color:var(--navy); }
.auth-fields { display:flex; flex-direction:column; gap:11px; }
.field { background:var(--navy2); border:1.5px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.95rem; outline:none; transition:var(--trans); width:100%; }
.field:focus { border-color:var(--teal); }
.field-err { color:var(--coral); font-size:0.8rem; }
.auth-hint { color:var(--muted); font-size:0.78rem; text-align:center; margin-top:16px; line-height:1.6; }
.captcha { background:var(--navy2); border-radius:var(--radius-sm); padding:13px; }
.captcha-label { color:var(--muted); font-size:0.84rem; margin-bottom:8px; }
.captcha-row { display:flex; gap:8px; }
.captcha-input { flex:1; background:var(--navy); border:1.5px solid var(--border); color:var(--white); padding:9px 12px; border-radius:8px; font-size:0.9rem; outline:none; }
.captcha-input.err { border-color:var(--coral); }
.captcha-err { color:var(--coral); font-size:0.78rem; margin-top:5px; }
.captcha-ok { color:var(--success); font-size:0.84rem; }

/* ── Buttons ── */
.btn-primary { background:var(--teal); color:var(--navy); font-family:var(--font-head); font-weight:700; font-size:0.93rem; padding:13px 20px; border:none; border-radius:var(--radius-sm); cursor:pointer; transition:var(--trans); letter-spacing:0.2px; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
.btn-primary:hover { filter:brightness(1.08); transform:translateY(-1px); }
.btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.btn-primary.full { width:100%; }
.btn-primary.sm { padding:8px 13px; font-size:0.78rem; border-radius:8px; }
.btn-ghost { background:transparent; border:1.5px solid var(--border); color:var(--muted); font-family:var(--font-head); font-size:0.83rem; font-weight:600; padding:10px 16px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--trans); }
.btn-ghost:hover { border-color:var(--teal); color:var(--teal); }
.btn-danger { background:var(--danger); color:#fff; font-family:var(--font-head); font-weight:700; font-size:0.83rem; padding:10px 14px; border:none; border-radius:var(--radius-sm); cursor:pointer; transition:var(--trans); }
.btn-danger:hover { filter:brightness(1.08); }

/* ── Home ── */
.home-hero { padding:24px 20px 8px; }
.greeting { font-size:0.95rem; color:var(--muted); }
.hero-sub { font-family:var(--font-head); font-weight:800; font-size:1.9rem; color:var(--white); letter-spacing:-1px; margin-top:3px; }
.section { padding:16px 20px 0; }
.section-label { font-family:var(--font-head); font-size:0.72rem; font-weight:700; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; display:block; margin-bottom:9px; }
.select { width:100%; background:var(--card); border:1.5px solid var(--border); color:var(--white); padding:11px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.9rem; outline:none; cursor:pointer; }
.action-grid { display:grid; grid-template-columns:1fr 1fr; gap:11px; padding:14px 20px 0; }
.action-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; padding:22px 14px; border-radius:var(--radius); border:1.5px solid var(--border); background:var(--card); cursor:pointer; transition:var(--trans); }
.action-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.25); }
.action-card.primary { border-color:var(--teal);   background:linear-gradient(135deg,rgba(14,196,176,0.08),var(--card)); }
.action-card.remedial { border-color:#9B59B6; background:linear-gradient(135deg,rgba(155,89,182,0.08),var(--card)); }
.action-card.board    { border-color:var(--gold);  background:linear-gradient(135deg,rgba(255,209,102,0.08),var(--card)); }
.action-card.hist     { border-color:var(--coral); background:linear-gradient(135deg,rgba(255,107,107,0.08),var(--card)); }
.ac-icon { font-size:1.75rem; }
.ac-label { font-family:var(--font-head); font-weight:700; font-size:0.83rem; color:var(--white); text-align:center; }
.tool-row { display:flex; flex-direction:column; gap:7px; }
.tool-btn { background:var(--card); border:1.5px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); text-align:left; font-family:var(--font-body); font-size:0.88rem; cursor:pointer; transition:var(--trans); }
.tool-btn:hover { border-color:var(--teal); color:var(--teal); }
.empty-state { text-align:center; padding:48px 20px; color:var(--muted); display:flex; flex-direction:column; gap:16px; align-items:center; font-size:0.95rem; }

/* ── Cards ── */
.card { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:18px; }
.card + .card { margin-top:11px; }
.section-title { font-family:var(--font-head); font-weight:700; font-size:0.95rem; margin-bottom:10px; }

/* ── Quiz ── */
.quiz-progress { padding:0 20px 10px; }
.progress-bar { height:5px; background:var(--navy2); border-radius:3px; overflow:hidden; }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--teal),rgba(14,196,176,0.6)); border-radius:3px; transition:width 0.4s ease; }
.progress-text { font-size:0.75rem; color:var(--muted); margin-top:5px; text-align:right; }
.question-card { margin:0 20px; background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:22px; }
.q-meta { display:flex; gap:7px; margin-bottom:14px; flex-wrap:wrap; }
.tag { font-size:0.68rem; font-weight:700; padding:3px 9px; border-radius:20px; font-family:var(--font-head); letter-spacing:0.3px; }
.tag-topic  { background:rgba(14,196,176,0.12);  color:var(--teal);    border:1px solid rgba(14,196,176,0.3); }
.tag-easy   { background:rgba(6,214,160,0.12);   color:var(--success); border:1px solid rgba(6,214,160,0.3);  }
.tag-medium { background:rgba(255,209,102,0.12); color:var(--gold);    border:1px solid rgba(255,209,102,0.3);}
.tag-hard   { background:rgba(239,71,111,0.12);  color:var(--danger);  border:1px solid rgba(239,71,111,0.3); }
.question-text { font-size:1.02rem; line-height:1.65; font-weight:500; margin-bottom:18px; }
.options-list { display:flex; flex-direction:column; gap:9px; }
.option-btn { background:var(--navy2); border:2px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); text-align:left; font-family:var(--font-body); font-size:0.88rem; cursor:pointer; transition:var(--trans); line-height:1.4; }
.option-btn:hover:not(:disabled) { border-color:var(--teal); }
.option-btn.selected { border-color:var(--teal);    background:rgba(14,196,176,0.1); }
.option-btn.correct  { border-color:var(--success); background:rgba(6,214,160,0.1);  }
.option-btn.wrong    { border-color:var(--danger);  background:rgba(239,71,111,0.1); }
.option-btn:disabled { cursor:not-allowed; }
.fill-input { width:100%; background:var(--navy2); border:2px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.95rem; outline:none; margin-bottom:10px; }
.fill-input:focus { border-color:var(--teal); }
.fill-input.correct { border-color:var(--success); }
.fill-input.wrong   { border-color:var(--danger);  }
.confidence-section { margin:18px 20px 0; }
.confidence-label { font-family:var(--font-head); font-size:0.76rem; font-weight:700; color:var(--muted); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:9px; display:block; }
.confidence-row { display:flex; gap:8px; }
.conf-btn { flex:1; padding:11px 6px; border-radius:var(--radius-sm); border:2px solid var(--border); background:var(--card); color:var(--white); font-family:var(--font-head); font-size:0.78rem; font-weight:700; cursor:pointer; transition:var(--trans); text-align:center; }
.conf-btn.low.active      { border-color:var(--coral);   background:rgba(255,107,107,0.15); color:var(--coral);   }
.conf-btn.moderate.active { border-color:var(--gold);    background:rgba(255,209,102,0.15); color:var(--gold);    }
.conf-btn.high.active     { border-color:var(--success); background:rgba(6,214,160,0.15);   color:var(--success); }
.submit-row { padding:14px 20px 0; display:flex; gap:10px; }
.feedback-box { margin:14px 20px 0; padding:15px; border-radius:var(--radius-sm); animation:fadeUp 0.2s ease; }
.feedback-box.correct { background:rgba(6,214,160,0.1);   border:1px solid rgba(6,214,160,0.3);   }
.feedback-box.wrong   { background:rgba(239,71,111,0.1);  border:1px solid rgba(239,71,111,0.3);  }
.feedback-result { font-family:var(--font-head); font-size:1.05rem; font-weight:800; margin-bottom:5px; }
.feedback-answer { font-size:0.83rem; color:var(--muted); line-height:1.5; }

/* ── Results ── */
.results-screen { padding:0 20px 80px; }
.results-hero { text-align:center; padding:28px 0 20px; }
.results-score { font-family:var(--font-head); font-size:3.8rem; font-weight:800; color:var(--teal); line-height:1; }
.results-label { color:var(--muted); margin-top:7px; font-size:0.9rem; }
.stat-row { display:flex; gap:10px; margin:14px 0; }
.stat-box { flex:1; background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:14px; text-align:center; }
.stat-val { font-family:var(--font-head); font-size:1.3rem; font-weight:800; color:var(--teal); }
.stat-lbl { font-size:0.7rem; color:var(--muted); margin-top:3px; }
.conf-insight { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:15px; margin:10px 0; }
.conf-insight-title { font-family:var(--font-head); font-size:0.76rem; font-weight:700; color:var(--muted); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:11px; }
.conf-bar-row { display:flex; align-items:center; gap:9px; margin-bottom:7px; font-size:0.8rem; }
.conf-bar-label { width:130px; color:var(--muted); flex-shrink:0; font-size:0.76rem; }
.conf-bar { flex:1; height:7px; background:var(--navy2); border-radius:4px; overflow:hidden; }
.conf-bar-fill { height:100%; border-radius:4px; }
.privacy-toggle { display:flex; gap:8px; margin:10px 0; }
.priv-btn { flex:1; padding:12px; border-radius:var(--radius-sm); border:2px solid var(--border); background:var(--card); color:var(--muted); font-family:var(--font-head); font-size:0.8rem; font-weight:700; cursor:pointer; transition:var(--trans); }
.priv-btn.active { border-color:var(--teal); color:var(--teal); background:rgba(14,196,176,0.1); }
.results-actions { display:flex; flex-direction:column; gap:9px; margin-top:14px; }
.share-box { background:var(--navy2); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:12px; word-break:break-all; font-family:'Courier New',monospace; font-size:0.76rem; color:var(--teal); margin-top:8px; }

/* ── Leaderboard ── */
.leaderboard-list { padding:0 20px; display:flex; flex-direction:column; gap:8px; }
.lb-row { display:flex; align-items:center; gap:13px; background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:13px 15px; }
.lb-rank { font-family:var(--font-head); font-weight:800; font-size:1.05rem; color:var(--muted); width:26px; flex-shrink:0; }
.lb-rank.gold   { color:#FFD700; }
.lb-rank.silver { color:#C0C0C0; }
.lb-rank.bronze { color:#CD7F32; }
.lb-name { flex:1; font-weight:500; font-size:0.92rem; }
.lb-acc { font-family:var(--font-head); font-weight:700; color:var(--teal); }
.lb-sessions { font-size:0.76rem; color:var(--muted); }
.reviewer-badge { font-size:0.68rem; background:var(--gold); color:var(--navy); padding:2px 7px; border-radius:10px; font-weight:700; margin-left:5px; }

/* ── History ── */
.history-list { padding:0 20px; display:flex; flex-direction:column; gap:7px; }
.hist-row { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:13px 15px; }
.hist-top { display:flex; justify-content:space-between; align-items:center; }
.hist-test { font-weight:500; font-size:0.88rem; }
.hist-score { font-family:var(--font-head); font-weight:700; color:var(--teal); }
.hist-meta { font-size:0.73rem; color:var(--muted); margin-top:3px; }
.hist-private { font-size:0.68rem; color:var(--muted); background:var(--navy2); padding:2px 7px; border-radius:10px; display:inline-block; margin-top:4px; }

/* ── Test Detail ── */
.test-detail { padding:0 20px 24px; display:flex; flex-direction:column; gap:11px; }
.test-meta { display:flex; gap:8px; flex-wrap:wrap; }
.test-stat { font-size:0.8rem; color:var(--muted); }
.rating-row { display:flex; gap:10px; align-items:center; }
.thumb-btn { font-size:1.25rem; background:var(--navy2); border:1.5px solid var(--border); border-radius:8px; padding:7px 13px; cursor:pointer; transition:var(--trans); }
.thumb-btn:hover,.thumb-btn.active { background:var(--navy3); transform:scale(1.06); }
.thumb-count { font-size:0.83rem; color:var(--muted); }
.comment-input-row { display:flex; gap:8px; margin-bottom:2px; }
.comment-input { flex:1; background:var(--navy2); border:1.5px solid var(--border); color:var(--white); padding:11px 13px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.84rem; outline:none; }
.comment-item { border-left:2px solid var(--teal); padding-left:11px; }
.comment-author { font-size:0.75rem; color:var(--teal); font-weight:600; margin-bottom:2px; }
.comment-text { font-size:0.86rem; }
.comment-date { font-size:0.7rem; color:var(--muted); margin-top:2px; }
.flagged-badge  { background:rgba(239,71,111,0.12); border:1px solid rgba(239,71,111,0.35); color:var(--danger); padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; text-align:center; }
.reviewed-badge { background:rgba(6,214,160,0.12);  border:1px solid rgba(6,214,160,0.35);  color:var(--success);padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; text-align:center; }

/* ── Add Test ── */
.add-test-form { padding:0 20px; display:flex; flex-direction:column; gap:13px; }
.textarea { background:var(--navy2); border:1.5px solid var(--border); color:var(--white); padding:13px 15px; border-radius:var(--radius-sm); font-family:'Courier New',monospace; font-size:0.8rem; outline:none; resize:vertical; min-height:150px; width:100%; line-height:1.5; }

/* ── Guide ── */
.guide-content { padding:0 20px; display:flex; flex-direction:column; gap:13px; }
.guide-step { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:15px; }
.guide-step-title { font-family:var(--font-head); font-size:0.84rem; font-weight:700; color:var(--teal); margin-bottom:8px; }
.guide-prompt-box { background:var(--navy); border:1px solid var(--border); border-radius:8px; padding:13px; font-family:'Courier New',monospace; font-size:0.7rem; color:var(--muted); white-space:pre-wrap; word-break:break-word; max-height:180px; overflow-y:auto; line-height:1.5; }
.copy-prompt-btn { margin-top:8px; }

/* ── Invites ── */
.invites-content { padding:0 20px; display:flex; flex-direction:column; gap:11px; }
.code-row { display:flex; align-items:center; justify-content:space-between; background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:11px 15px; }
.code-val { font-family:'Courier New',monospace; font-size:0.88rem; color:var(--teal); }
.code-status { font-size:0.73rem; color:var(--muted); margin-top:2px; }

/* ── Submissions ── */
.sub-card { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:15px; display:flex; flex-direction:column; gap:9px; }
.sub-actions { display:flex; gap:7px; flex-wrap:wrap; }
.sub-stat-row { display:flex; gap:14px; }
.sub-stat { text-align:center; }
.sub-stat-val { font-family:var(--font-head); font-size:1.15rem; font-weight:700; color:var(--teal); }
.sub-stat-lbl { font-size:0.7rem; color:var(--muted); }

/* ── Profile ── */
.profile-content { padding:0 20px; display:flex; flex-direction:column; gap:11px; }
.profile-avatar { width:68px; height:68px; border-radius:50%; background:linear-gradient(135deg,var(--teal),#9B59B6); display:flex; align-items:center; justify-content:center; font-family:var(--font-head); font-size:1.7rem; font-weight:800; color:var(--navy); margin-bottom:3px; }
.profile-name { font-family:var(--font-head); font-size:1.35rem; font-weight:800; }
.profile-meta { font-size:0.8rem; color:var(--muted); }
.toggle-row { display:flex; align-items:center; justify-content:space-between; background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:13px 15px; }
.toggle-label { font-size:0.88rem; font-weight:500; }
.toggle-sub { font-size:0.73rem; color:var(--muted); margin-top:2px; }
.toggle-switch { position:relative; width:46px; height:25px; flex-shrink:0; }
.toggle-switch input { opacity:0; width:0; height:0; }
.toggle-slider { position:absolute; inset:0; background:var(--navy3); border-radius:13px; cursor:pointer; transition:var(--trans); }
.toggle-slider:before { content:''; position:absolute; width:19px; height:19px; left:3px; bottom:3px; background:white; border-radius:50%; transition:var(--trans); }
input:checked + .toggle-slider { background:var(--teal); }
input:checked + .toggle-slider:before { transform:translateX(21px); }

/* ── Remedial ── */
.remedial-choice { padding:0 20px; display:flex; flex-direction:column; gap:11px; }
.remedial-option { background:var(--card); border:2px solid var(--border); border-radius:var(--radius); padding:20px; cursor:pointer; transition:var(--trans); }
.remedial-option:hover { border-color:var(--teal); transform:translateY(-1px); }
.remedial-option-icon { font-size:1.9rem; margin-bottom:7px; }
.remedial-option-title { font-family:var(--font-head); font-weight:700; font-size:0.98rem; }
.remedial-option-desc { font-size:0.8rem; color:var(--muted); margin-top:4px; }

/* ── Filter ── */
.filter-bar { padding:0 0 10px; display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; }
.filter-bar::-webkit-scrollbar { display:none; }
.filter-chip { flex-shrink:0; padding:7px 13px; border-radius:20px; border:1.5px solid var(--border); background:var(--card); color:var(--muted); font-size:0.78rem; font-family:var(--font-head); font-weight:600; cursor:pointer; transition:var(--trans); white-space:nowrap; }
.filter-chip.active { background:var(--teal); color:var(--navy); border-color:var(--teal); }

/* ── Review ── */
.review-content { padding:0 20px; display:flex; flex-direction:column; gap:11px; }
.review-q { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:13px; display:flex; flex-direction:column; gap:7px; }
.review-q textarea { background:var(--navy2); border:1.5px solid var(--border); color:var(--white); border-radius:8px; padding:9px; font-family:var(--font-body); font-size:0.84rem; outline:none; resize:vertical; width:100%; }

/* ── Achievement Toast ── */
.achievement-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:1000; width:calc(100% - 40px); max-width:400px; background:linear-gradient(135deg,#0EC4B0,#06D6A0); color:var(--navy); border-radius:var(--radius); padding:15px 18px; box-shadow:0 16px 48px rgba(0,0,0,0.45); animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1); display:flex; gap:13px; align-items:center; }
@keyframes toastIn { from { transform:translateX(-50%) translateY(80px) scale(0.88); opacity:0; } to { transform:translateX(-50%) translateY(0) scale(1); opacity:1; } }
.achievement-toast.out { animation:toastOut 0.3s ease forwards; }
@keyframes toastOut { to { transform:translateX(-50%) translateY(80px) scale(0.88); opacity:0; } }
.toast-icon { font-size:1.9rem; flex-shrink:0; }
.toast-title { font-family:var(--font-head); font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; opacity:0.7; }
.toast-name { font-family:var(--font-head); font-size:0.98rem; font-weight:800; }
.toast-desc { font-size:0.8rem; opacity:0.8; margin-top:1px; }

/* ── Misc ── */
.divider { height:1px; background:var(--border); margin:4px 0; }
.spinner { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,0.3); border-top-color:var(--navy); border-radius:50%; animation:spin 0.65s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.no-data { text-align:center; color:var(--muted); padding:32px 20px; font-size:0.88rem; }
.alert { padding:11px 13px; border-radius:var(--radius-sm); font-size:0.83rem; line-height:1.5; }
.alert-warn { background:rgba(255,209,102,0.1); border:1px solid rgba(255,209,102,0.3); color:var(--gold); }
.alert-info { background:rgba(14,196,176,0.1); border:1px solid rgba(14,196,176,0.3); color:var(--teal); }
`
