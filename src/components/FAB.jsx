import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, FolderOpen, Bell, X } from 'lucide-react'

const ACTIONS = [
  { label: 'Nuovo cliente',  icon: Users,     route: '/clienti' },
  { label: 'Nuova pratica',  icon: FolderOpen, route: '/pratiche' },
  { label: 'Nuova scadenza', icon: Bell,       route: '/notifiche' },
]

export default function FAB() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    // Positioned left of the LexAI button (which is at right:22, bottom:22)
    <div ref={ref} style={{ position: 'fixed', right: 82, bottom: 22, zIndex: 48 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 58, right: 0,
          background: 'var(--bg3)', border: '1px solid var(--border3)',
          borderRadius: 12, padding: '5px', minWidth: 185,
          boxShadow: '0 16px 40px rgba(0,0,0,.5)',
          animation: 'fabPop .15s cubic-bezier(.16,1,.3,1)',
        }}>
          {ACTIONS.map(a => (
            <button key={a.label} onClick={() => { setOpen(false); navigate(a.route) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--text2)', transition: 'all .1s', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={13} color="var(--blue2)" />
              </div>
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} style={{
        width: 42, height: 42, borderRadius: '50%',
        background: open ? 'var(--bg4)' : 'var(--bg3)',
        border: `1px solid ${open ? 'var(--blue)' : 'var(--border3)'}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: open ? 'var(--blue2)' : 'var(--text3)', transition: 'all .2s',
        boxShadow: '0 4px 12px rgba(0,0,0,.3)',
      }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue2)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--border3)'; e.currentTarget.style.color = 'var(--text3)' } }}>
        {open ? <X size={16} /> : <Plus size={18} />}
      </button>
    </div>
  )
}
