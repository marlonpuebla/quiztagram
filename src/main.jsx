import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A1628', color:'#fff', fontFamily:'sans-serif', padding:'24px', textAlign:'center' }}>
          <div>
            <div style={{ fontSize:'2rem', marginBottom:'12px' }}>🩺</div>
            <h2 style={{ marginBottom:'8px' }}>NursePrep failed to load</h2>
            <p style={{ color:'#8898aa', fontSize:'0.9rem', maxWidth:'360px' }}>
              {String(this.state.error?.message || this.state.error)}
            </p>
            <p style={{ color:'#8898aa', fontSize:'0.8rem', marginTop:'12px' }}>
              If you are the developer, make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel environment variables.
            </p>
            <button onClick={() => window.location.reload()} style={{ marginTop:'20px', padding:'10px 24px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
