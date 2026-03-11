import React, { useState, useEffect, useRef, memo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Users, FolderOpen, Calendar, CreditCard, Trash2,
  Landmark, FileText, Globe, BookOpen, Mail, Settings, LogOut,
  Bell, Search, StickyNote, X, ChevronLeft, ChevronRight, HardDrive, BarChart2, Plus, Bot
} from 'lucide-react'
import LexAI from './LexAI'
import FAB from './FAB'
import SpotlightSearch from './SpotlightSearch'

const NAV = [
  { section: 'GESTIONE', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/clienti', label: 'Clienti', icon: Users },
    { to: '/pratiche', label: 'Pratiche', icon: FolderOpen },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
  ]},
  { section: 'FISCALE', items: [
    { to: '/rateizzi', label: 'Rateizzi', icon: CreditCard },
    { to: '/rottamazioni', label: 'Rottamazioni', icon: Trash2 },
    { to: '/cassa', label: 'Reg. Cassa', icon: Landmark },
  ]},
  { section: 'STRUMENTI', items: [
    { to: '/documenti', label: 'Documenti', icon: FileText },
    { to: '/email-ai', label: 'Email AI', icon: Mail },
    { to: '/report', label: 'Report', icon: BarChart2 },
    { to: '/backup', label: 'Backup', icon: HardDrive },
    { to: '/portali', label: 'Portali', icon: Globe },
    { to: '/guide', label: 'Guide', icon: BookOpen },
  ]},
]

const BREADCRUMBS = {
  '/': 'Dashboard', '/clienti': 'Clienti', '/pratiche': 'Pratiche',
  '/calendario': 'Calendario', '/rateizzi': 'Rateizzi',
  '/rottamazioni': 'Rottamazioni', '/cassa': 'Reg. Cassa',
  '/documenti': 'Documenti', '/portali': 'Portali',
  '/guide': 'Guide', '/email-ai': 'Email AI',
  '/notifiche': 'Notifiche', '/impostazioni': 'Impostazioni', '/report': 'Report',
}

export default function Layout() {
  const [spotlight, setSpotlight] = useState(false)

  // Cmd+K / Ctrl+K spotlight
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSpotlight(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [col, setCol] = useState(false)
  const [sq, setSq] = useState('')
  const [sOpen, setSOpen] = useState(false)
  const [sRes, setSRes] = useState([])
  const [notes, setNotes] = useState(localStorage.getItem('sm_notes') || '')
  const [nOpen, setNOpen] = useState(false)
  const [notifN, setNotifN] = useState(0)
  const [praticheUrgN, setPraticheUrgN] = useState(0)
  const searchRef = useRef(null)

  useEffect(() => { loadNotif(); const t = setInterval(loadNotif, 60000); return () => clearInterval(t) }, [])
  useEffect(() => { if (sOpen) setTimeout(() => searchRef.current?.focus(), 60) }, [sOpen])
  useEffect(() => { localStorage.setItem('sm_notes', notes) }, [notes])
  useEffect(() => {
    const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSOpen(true) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  async function loadNotif() {
    const oggi = new Date().toISOString().split('T')[0]
    const fra7  = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const fra2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    const { count: pu } = await supabase.from('pratiche').select('id', { count: 'exact', head: true }).gte('data_scadenza', oggi).lte('data_scadenza', fra2).neq('stato','completata').neq('stato','archiviata')
    setPraticheUrgN(pu || 0)
    const { count } = await supabase.from('scadenze')
      .select('*', { count: 'exact', head: true })
      .gte('data_scadenza', oggi).lte('data_scadenza', fra7).eq('completata', false)
    setNotifN(count || 0)
  }

  async function doSearch(q) {
    setSq(q)
    if (q.length < 2) { setSRes([]); return }
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clienti').select('id,nome,cognome,ragione_sociale,codice_fiscale,partita_iva')
        .or(`nome.ilike.%${q}%,cognome.ilike.%${q}%,ragione_sociale.ilike.%${q}%,codice_fiscale.ilike.%${q}%,partita_iva.ilike.%${q}%`).limit(6),
      supabase.from('pratiche').select('id,titolo,stato').ilike('titolo', `%${q}%`).limit(4),
    ])
    setSRes([
      ...(c || []).map(x => ({ type: 'cliente', id: x.id, label: x.ragione_sociale || `${x.nome||''} ${x.cognome||''}`.trim(), sub: x.codice_fiscale || x.partita_iva || 'Cliente' })),
      ...(p || []).map(x => ({ type: 'pratica', id: x.id, label: x.titolo, sub: x.stato || 'Pratica' })),
    ])
  }

  function goRes(r) {
    navigate(r.type === 'cliente' ? `/clienti/${r.id}` : '/pratiche')
    setSOpen(false); setSq(''); setSRes([])
  }

  const initials = `${(profile?.nome||'S')[0]}${(profile?.cognome||'M')[0]}`.toUpperCase()
  const crumb = BREADCRUMBS[location.pathname] || 'Studio Mazzella'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: col ? 54 : 220,
        flexShrink: 0, overflow: 'hidden',
        transition: 'width .22s cubic-bezier(.16,1,.3,1)',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ padding: col ? '14px 13px' : '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 56 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(37,99,235,0.45)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>M</span>
          </div>
          {!col && (
            <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text1)', whiteSpace: 'nowrap', letterSpacing: '-.03em' }}>Studio Mazzella</div>
              <div style={{ fontSize: 9.5, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 1 }}>Commercialisti</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NAV.map((section, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {!col && <div className="nav-section-label">{section.section}</div>}
              {col && si > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '6px 5px 8px' }} />}
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} title={col ? label : undefined}
                  className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon size={15} />
                    {to === '/pratiche' && praticheUrgN > 0 && <span style={{ position:'absolute', top:-4, right:-5, background:'var(--amber)', color:'#000', fontSize:8, fontWeight:800, width:13, height:13, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid var(--bg2)' }}>{praticheUrgN > 9 ? '9+' : praticheUrgN}</span>}
                  </div>
                  {!col && <span>{label}</span>}
                  {!col && to === '/pratiche' && praticheUrgN > 0 && <span style={{ marginLeft:'auto', background:'var(--amber-dim)', color:'var(--amber2)', border:'1px solid rgba(245,158,11,.2)', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99 }}>{praticheUrgN}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom system */}
        <div style={{ padding: '8px 8px 10px', borderTop: '1px solid var(--border)' }}>
          <div className="nav-section-label" style={{ marginBottom: 4 }}>{!col ? 'SISTEMA' : ''}</div>
          <NavLink to="/notifiche" className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`} style={{ marginBottom: 2 }} title={col ? 'Notifiche' : undefined}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Bell size={15} />
              {notifN > 0 && <span style={{ position: 'absolute', top: -4, right: -5, background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 800, width: 13, height: 13, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--bg2)' }}>{notifN > 9 ? '9+' : notifN}</span>}
            </div>
            {!col && <span>Notifiche</span>}
            {!col && notifN > 0 && <span style={{ marginLeft: 'auto', background: 'var(--red-dim)', color: '#f87171', border: '1px solid rgba(239,68,68,.2)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{notifN}</span>}
          </NavLink>
          <NavLink to="/impostazioni" className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`} style={{ marginBottom: 10 }} title={col ? 'Impostazioni' : undefined}>
            <Settings size={15} style={{ flexShrink: 0 }} />{!col && <span>Impostazioni</span>}
          </NavLink>

          {/* User card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '-.02em' }}>{initials}</div>
            {!col && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.nome} {profile?.cognome}</div>
                  <div style={{ fontSize: 10, color: 'var(--text4)', textTransform: 'capitalize' }}>{profile?.ruolo || 'admin'}</div>
                </div>
                <button onClick={signOut} title="Esci" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 4, display: 'flex', borderRadius: 5, transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text4)'}>
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapse btn */}
        <button onClick={() => setCol(!col)} style={{
          position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)',
          width: 22, height: 22, borderRadius: '50%', background: 'var(--bg4)',
          border: '1px solid var(--border3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text4)', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,.5)',
          transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border3)'; e.currentTarget.style.color = 'var(--text4)' }}>
          {col ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 54, background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 12, flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text4)', flexShrink: 0 }}>
            <span style={{ letterSpacing: '-.01em' }}>Studio Mazzella</span>
            <ChevronRight size={11} style={{ opacity: .5 }} />
            <span style={{ color: 'var(--text2)', fontWeight: 600, letterSpacing: '-.01em' }}>{crumb}</span>
          </div>

          {/* Search */}
          <button onClick={() => setSOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'var(--bg)', border: '1px solid var(--border2)',
            borderRadius: 9, padding: '7px 13px', cursor: 'text',
            color: 'var(--text4)', fontSize: 12.5, flex: 1, maxWidth: 360,
            fontFamily: 'inherit', transition: 'all .15s', marginLeft: 14,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border3)'; e.currentTarget.style.color = 'var(--text3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text4)' }}>
            <Search size={13} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left', letterSpacing: '-.01em' }}>Cerca... ⌘K</span>
            <kbd style={{ fontSize: 10, background: 'var(--bg3)', border: '1px solid var(--border3)', padding: '2px 6px', borderRadius: 5, color: 'var(--text4)', fontFamily: 'inherit', letterSpacing: '.02em' }}>⌘K</kbd>
          </button>

          {/* Quick actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => navigate('/clienti')} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
              borderRadius: 7, background: 'transparent', border: '1px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text4)', fontSize: 12, fontWeight: 500,
              fontFamily: 'inherit', transition: 'all .12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text4)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
              <Plus size={12} /><span>Cliente</span>
            </button>
            <button onClick={() => navigate('/pratiche')} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
              borderRadius: 7, background: 'transparent', border: '1px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text4)', fontSize: 12, fontWeight: 500,
              fontFamily: 'inherit', transition: 'all .12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text4)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
              <Plus size={12} /><span>Pratica</span>
            </button>

            <button onClick={() => setNOpen(!nOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
              borderRadius: 7, background: nOpen ? 'var(--bg4)' : 'transparent',
              border: `1px solid ${nOpen ? 'var(--border3)' : 'var(--border2)'}`,
              cursor: 'pointer', color: nOpen ? 'var(--text2)' : 'var(--text4)',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'all .12s',
            }}>
              <StickyNote size={13} /><span>Note</span>
            </button>

            <NavLink to="/notifiche" style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 32, borderRadius: 7, textDecoration: 'none',
              background: notifN > 0 ? 'var(--red-dim)' : 'transparent',
              border: `1px solid ${notifN > 0 ? 'rgba(239,68,68,.2)' : 'var(--border2)'}`,
              transition: 'all .12s',
            }}>
              <Bell size={14} color={notifN > 0 ? '#f87171' : 'var(--text4)'} />
              {notifN > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--bg2)' }}>{notifN > 99 ? '99+' : notifN}</span>}
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <SpotlightSearch open={spotlight} onClose={() => setSpotlight(false)} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 26px', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>

      {/* ── SEARCH MODAL ── */}
      {sOpen && (
        <div className="overlay" onClick={() => { setSOpen(false); setSq(''); setSRes([]) }}>
          <div style={{ width: '100%', maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border3)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.75)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderBottom: '1px solid var(--border2)' }}>
                <Search size={14} color="var(--text4)" />
                <input ref={searchRef} value={sq} onChange={e => doSearch(e.target.value)}
                  placeholder="Cerca clienti, pratiche, codice fiscale..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text1)', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-.01em' }} />
                <kbd style={{ fontSize: 10, background: 'var(--bg2)', border: '1px solid var(--border3)', padding: '2px 7px', borderRadius: 5, color: 'var(--text4)' }}>ESC</kbd>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {sRes.length > 0 ? sRes.map((r, i) => (
                  <button key={i} onClick={() => goRes(r)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .08s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: r.type === 'cliente' ? 'var(--blue-dim)' : 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${r.type === 'cliente' ? 'var(--blue-glow)' : 'rgba(245,158,11,.2)'}` }}>
                      {r.type === 'cliente' ? <Users size={14} color="var(--blue2)" /> : <FolderOpen size={14} color="var(--amber)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--text1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{r.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 1 }}>{r.sub}</div>
                    </div>
                    <ChevronRight size={12} color="var(--text4)" />
                  </button>
                )) : sq.length >= 2 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text4)', fontSize: 13.5 }}>Nessun risultato per "<strong style={{ color: 'var(--text3)' }}>{sq}</strong>"</div>
                ) : (
                  <div style={{ padding: '18px 16px' }}>
                    <div className="nav-section-label" style={{ marginBottom: 10 }}>Ricerche rapide</div>
                    {['Cerca per nome o cognome', 'Cerca per codice fiscale', 'Cerca per P.IVA'].map((h, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: 'var(--text4)', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Search size={11} style={{ flexShrink: 0 }} />{h}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTE RAPIDE ── */}
      {nOpen && (
        <div style={{ position: 'fixed', right: 20, top: 62, width: 296, background: 'var(--bg3)', border: '1px solid var(--border3)', borderRadius: 14, zIndex: 40, animation: 'slideUp .15s cubic-bezier(.16,1,.3,1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border2)', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}><StickyNote size={13} /> Note Rapide</span>
            <button onClick={() => setNOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex', borderRadius: 4 }}><X size={13} /></button>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Appunti veloci..."
            style={{ width: '100%', height: 160, background: 'none', border: 'none', outline: 'none', padding: '12px 14px', color: 'var(--text2)', fontSize: 13, resize: 'none', fontFamily: 'inherit', display: 'block', lineHeight: 1.65 }} />
          <div style={{ padding: '4px 14px 9px', fontSize: 10.5, color: 'var(--text4)' }}>Auto-salvato · localStorage</div>
        </div>
      )}

      <LexAI />
      <FAB />
    </div>
  )
}
