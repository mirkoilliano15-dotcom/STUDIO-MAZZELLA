import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, User, Building2, FileText, Calendar, X, ArrowRight, Hash } from 'lucide-react'

const SCORCIATOIE = [
  { label: 'Dashboard',       path: '/',             icon: Hash,       color: '#60a5fa' },
  { label: 'Nuova pratica',   path: '/pratiche',     icon: FileText,   color: '#f59e0b' },
  { label: 'Calendario',      path: '/calendario',   icon: Calendar,   color: '#a855f7' },
  { label: 'Notifiche',       path: '/notifiche',    icon: Hash,       color: '#ef4444' },
]

export default function SpotlightSearch({ open, onClose }) {
  const [q, setQ]         = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sel, setSel]     = useState(0)
  const inputRef          = useRef(null)
  const navigate          = useNavigate()

  useEffect(() => {
    if (open) { setQ(''); setResults([]); setSel(0); setTimeout(() => inputRef.current?.focus(), 60) }
  }, [open])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(() => cerca(q.trim()), 200)
    return () => clearTimeout(t)
  }, [q])

  async function cerca(query) {
    setLoading(true)
    const like = `%${query}%`
    const [{ data: clienti }, { data: pratiche }, { data: scadenze }] = await Promise.all([
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome,tipo').or(`ragione_sociale.ilike.${like},nome.ilike.${like},cognome.ilike.${like},codice_fiscale.ilike.${like}`).limit(5),
      supabase.from('pratiche').select('id,titolo,stato').ilike('titolo', like).limit(4),
      supabase.from('scadenze').select('id,titolo,data_scadenza').ilike('titolo', like).eq('completata', false).limit(3),
    ])
    const res = [
      ...(clienti||[]).map(c => ({ tipo: 'cliente', id: c.id, label: c.ragione_sociale || `${c.nome||''} ${c.cognome||''}`.trim(), sub: c.tipo === 'societa' ? 'Società' : 'Persona fisica', path: `/clienti/${c.id}`, Icon: c.tipo === 'societa' ? Building2 : User, color: '#60a5fa' })),
      ...(pratiche||[]).map(p => ({ tipo: 'pratica', id: p.id, label: p.titolo, sub: `Pratica · ${p.stato?.replace('_',' ')}`, path: '/pratiche', Icon: FileText, color: '#f59e0b' })),
      ...(scadenze||[]).map(s => ({ tipo: 'scadenza', id: s.id, label: s.titolo, sub: `Scadenza · ${new Date(s.data_scadenza).toLocaleDateString('it-IT')}`, path: '/notifiche', Icon: Calendar, color: '#a855f7' })),
    ]
    setResults(res)
    setSel(0)
    setLoading(false)
  }

  const items = q.trim() ? results : SCORCIATOIE.map(s => ({ ...s, Icon: s.icon, sub: 'Scorciatoia' }))

  const vai = useCallback((item) => {
    navigate(item.path)
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    function onKey(e) {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s+1, items.length-1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s-1, 0)) }
      if (e.key === 'Enter' && items[sel]) vai(items[sel])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items, sel, vai, onClose])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(5,10,24,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'18vh' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:560, background:'var(--bg3)', border:'1px solid var(--border3)', borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,0.6)', overflow:'hidden', animation:'spotlightIn .15s cubic-bezier(.16,1,.3,1)' }}>

        {/* Input */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid var(--border2)' }}>
          <Search size={16} color="var(--text4)" style={{ flexShrink:0 }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cerca clienti, pratiche, scadenze..."
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:15, color:'var(--text1)', fontFamily:'inherit', letterSpacing:'-.01em' }} />
          {loading && <div className="spinner" style={{ width:14, height:14, flexShrink:0 }} />}
          {q && !loading && <button onClick={() => setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex', flexShrink:0 }}><X size={13}/></button>}
          <kbd style={{ fontSize:10.5, color:'var(--text4)', background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:5, padding:'2px 6px', flexShrink:0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:340, overflowY:'auto', padding:'6px' }}>
          {!q.trim() && <div className="nav-section-label" style={{ padding:'6px 12px 4px' }}>Scorciatoie</div>}
          {q.trim() && results.length === 0 && !loading && (
            <div style={{ padding:'28px', textAlign:'center', color:'var(--text4)', fontSize:13 }}>
              Nessun risultato per "{q}"
            </div>
          )}
          {items.map((item, i) => (
            <button key={`${item.tipo||'sc'}-${item.id||item.label}`}
              onClick={() => vai(item)}
              onMouseEnter={() => setSel(i)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderRadius:9, background: sel===i ? 'var(--bg4)' : 'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'background .08s' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:item.color+'14', border:`1px solid ${item.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <item.Icon size={15} color={item.color} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                <div style={{ fontSize:11.5, color:'var(--text4)', marginTop:1 }}>{item.sub}</div>
              </div>
              {sel===i && <ArrowRight size={13} color="var(--text4)" style={{ flexShrink:0 }} />}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:14 }}>
          {[['↑↓','Naviga'], ['↵','Apri'], ['ESC','Chiudi']].map(([k,l]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <kbd style={{ fontSize:10, color:'var(--text4)', background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:4, padding:'1px 5px' }}>{k}</kbd>
              <span style={{ fontSize:11, color:'var(--text4)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
