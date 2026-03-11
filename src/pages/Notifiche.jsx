import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Bell, Check, AlertTriangle, Clock, Info, Calendar, ChevronRight, CheckCircle2, Euro } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Notifiche() {
  const toast = useToast()
  const [scadenze, setScadenze] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('tutte')

  useEffect(() => { load() }, [])

  async function load() {
    const oggi = new Date().toISOString().split('T')[0]
    const fra30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const { data } = await supabase.from('scadenze')
      .select('*, clienti(id,ragione_sociale,nome,cognome)')
      .gte('data_scadenza', oggi).lte('data_scadenza', fra30)
      .eq('completata', false)
      .order('data_scadenza')
    setScadenze(data || [])
    setLoading(false)
  }

  async function segnaCompletata(id, titolo) {
    await supabase.from('scadenze').update({ completata: true }).eq('id', id)
    toast(`"${titolo}" segnata come completata`, 'success')
    load()
  }

  function urgenza(data_scadenza) {
    const oggi = new Date(); oggi.setHours(0,0,0,0)
    const giorni = Math.ceil((new Date(data_scadenza) - oggi) / 86400000)
    if (giorni <= 2)  return { label: 'Urgente',           key: 'urgenti',  color: '#ef4444', dim: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   Icon: AlertTriangle, giorni }
    if (giorni <= 7)  return { label: 'Questa settimana',  key: 'prossime', color: '#f97316', dim: 'rgba(249,115,22,0.07)',  border: 'rgba(249,115,22,0.18)', Icon: Clock,         giorni }
    return              { label: 'In arrivo',              key: 'arrivo',   color: '#3b82f6', dim: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.15)', Icon: Info,          giorni }
  }

  const nomeC = c => c ? (c.ragione_sociale || `${c.nome||''} ${c.cognome||''}`.trim()) : null
  const filtered = filtro === 'tutte' ? scadenze : scadenze.filter(s => urgenza(s.data_scadenza).key === filtro)
  const urgenti  = scadenze.filter(s => urgenza(s.data_scadenza).key === 'urgenti').length
  const prossime = scadenze.filter(s => urgenza(s.data_scadenza).key === 'prossime').length
  const inArrivo = scadenze.filter(s => urgenza(s.data_scadenza).key === 'arrivo').length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height: 240 }}>
      <div className="spinner" style={{ width:28, height:28 }} />
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Notifiche</h1>
          <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3, letterSpacing:'-.01em' }}>
            Scadenze nei prossimi 30 giorni · {scadenze.length} attive
          </p>
        </div>
        {urgenti > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'8px 14px' }}>
            <AlertTriangle size={13} color="#f87171" />
            <span style={{ fontSize:12.5, fontWeight:700, color:'#f87171' }}>
              {urgenti} {urgenti === 1 ? 'scadenza urgente' : 'scadenze urgenti'}
            </span>
          </div>
        )}
      </div>

      {/* KPI mini row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          { key:'urgenti',  label:'Urgenti (≤2gg)',        count:urgenti,  color:'#ef4444', Icon:AlertTriangle },
          { key:'prossime', label:'Questa settimana',      count:prossime, color:'#f97316', Icon:Clock },
          { key:'arrivo',   label:'Arrivo (fino 30gg)',    count:inArrivo, color:'#3b82f6', Icon:Calendar },
        ].map(k => (
          <button key={k.key} onClick={() => setFiltro(filtro === k.key ? 'tutte' : k.key)} style={{
            display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
            background: filtro === k.key ? k.color+'14' : 'var(--bg3)',
            border:`1px solid ${filtro === k.key ? k.color+'35' : 'var(--border2)'}`,
            borderRadius:12, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', textAlign:'left',
          }}>
            <div style={{ width:36, height:36, borderRadius:9, background:k.color+'14', border:`1px solid ${k.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <k.Icon size={16} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:k.count>0?k.color:'var(--text1)', letterSpacing:'-.05em', lineHeight:1 }}>{k.count}</div>
              <div style={{ fontSize:11.5, color:'var(--text4)', marginTop:3 }}>{k.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filtri tab */}
      <div className="tab-bar">
        {[
          { k:'tutte',   l:`Tutte (${scadenze.length})` },
          { k:'urgenti', l:`Urgenti (${urgenti})` },
          { k:'prossime',l:`Questa settimana (${prossime})` },
          { k:'arrivo',  l:`In arrivo (${inArrivo})` },
        ].map(f => (
          <button key={f.k} className={`tab-item${filtro===f.k?' tab-active':''}`} onClick={() => setFiltro(f.k)}>{f.l}</button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CheckCircle2 size={36} color="#22c55e" style={{ opacity:1 }} /></div>
            <div className="empty-state-title">Nessuna scadenza in questa categoria</div>
            <div className="empty-state-sub">Tutto in ordine 🎉</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(s => {
            const u = urgenza(s.data_scadenza)
            const cliente = nomeC(s.clienti)
            return (
              <div key={s.id} style={{
                background: u.dim, border:`1px solid ${u.border}`,
                borderRadius:12, padding:'15px 18px',
                display:'flex', alignItems:'center', gap:15,
                transition:'transform .12s, box-shadow .12s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateX(2px)'; e.currentTarget.style.boxShadow=`0 4px 20px ${u.color}18` }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>

                {/* Data badge */}
                <div style={{ width:46, height:46, borderRadius:11, background:u.color+'15', border:`1px solid ${u.color}25`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:16, fontWeight:800, color:u.color, lineHeight:1 }}>{new Date(s.data_scadenza).getDate()}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:u.color, textTransform:'uppercase', letterSpacing:'.05em', opacity:.8 }}>
                    {new Date(s.data_scadenza).toLocaleString('it-IT',{month:'short'})}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em' }}>{s.titolo}</span>
                    <span style={{ fontSize:10.5, fontWeight:700, color:u.color, background:u.color+'18', padding:'2px 8px', borderRadius:99, border:`1px solid ${u.color}25` }}>
                      {u.giorni === 0 ? 'Oggi!' : u.giorni === 1 ? 'Domani' : `${u.giorni} giorni`}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:14, fontSize:11.5, color:'var(--text4)', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={11} />{format(new Date(s.data_scadenza),'EEEE d MMMM',{locale:it})}
                    </span>
                    {s.importo > 0 && (
                      <span style={{ display:'flex', alignItems:'center', gap:4, color:'#fbbf24', fontWeight:600 }}>
                        <Euro size={11} />€{parseFloat(s.importo).toLocaleString('it-IT')}
                      </span>
                    )}
                    {cliente && <span style={{ display:'flex', alignItems:'center', gap:4 }}><ChevronRight size={10}/>{cliente}</span>}
                    {s.descrizione && <span style={{ color:'var(--text4)', fontStyle:'italic' }}>{s.descrizione}</span>}
                  </div>
                </div>

                <button onClick={() => segnaCompletata(s.id, s.titolo)} className="btn btn-green" style={{ padding:'7px 16px', fontSize:12.5, flexShrink:0 }}>
                  <Check size={13} /> Completata
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
