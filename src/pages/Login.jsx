import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function login(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Email o password errati.'); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)', top: -150, right: -100 }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)', bottom: -100, left: -80 }} />
        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs><pattern id="g" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M 36 0 L 0 0 0 36" fill="none" stroke="#94a3b8" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 50, height: 50, borderRadius: 13, margin: '0 auto 14px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>M</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-.03em', marginBottom: 5 }}>Studio Mazzella</h1>
          <p style={{ fontSize: 13, color: '#475569' }}>Accedi al gestionale interno</p>
        </div>

        <div style={{ background: '#161b27', border: '1px solid #1e2a40', borderRadius: 16, padding: '26px 26px 22px', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="lbl">Email</label>
              <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@studiomazzella.it" required autoFocus />
            </div>
            <div><label className="lbl">Password</label>
              <input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {err && <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>{err}</div>}
            <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 2, borderRadius: 10 }}>
              {loading ? <><span className="spinner" style={{ width: 15, height: 15, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Accesso...</> : 'Accedi'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 16 }}>Studio Mazzella · Gestionale v8</p>
      </div>
    </div>
  )
}
