import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar, Clock, Euro } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'

const EMPTY = { titolo:'', data_scadenza:'', tipo:'scadenza', importo:'', descrizione:'', cliente_id:'' }
const TIPO_COLOR = { scadenza:'#f59e0b', rata:'#3b82f6', dichiarazione:'#a855f7', versamento:'#22c55e', altro:'#64748b' }

export default function Calendario() {
  const [mese, setMese] = useState(new Date())
  const [scadenze, setScadenze] = useState([])
  const [clienti, setClienti] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selData, setSelData] = useState(null)

  useEffect(() => { load() }, [mese])

  async function load() {
    const inizio = format(startOfMonth(mese),'yyyy-MM-dd')
    const fine   = format(endOfMonth(mese),'yyyy-MM-dd')
    const [{ data:s },{ data:c }] = await Promise.all([
      supabase.from('scadenze').select('*').gte('data_scadenza',inizio).lte('data_scadenza',fine).order('data_scadenza'),
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome'),
    ])
    setScadenze(s||[]); setClienti(c||[])
  }

  async function salva() {
    setSaving(true)
    await supabase.from('scadenze').insert([{ ...form, importo:parseFloat(form.importo)||0, cliente_id:form.cliente_id||null, completata:false }])
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  async function togglCompleta(s) {
    await supabase.from('scadenze').update({ completata:!s.completata }).eq('id',s.id)
    load()
  }

  const oggi = new Date()
  const start = startOfWeek(startOfMonth(mese),{ weekStartsOn:1 })
  const end   = endOfWeek(endOfMonth(mese),{ weekStartsOn:1 })
  const giorni = eachDayOfInterval({ start, end })
  const scadenzeGiorno = d => scadenze.filter(s => isSameDay(new Date(s.data_scadenza),d))
  const selScadenze = selData ? scadenzeGiorno(selData) : []
  const pending = scadenze.filter(s => !s.completata)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div>
          <h1 className="page-title">Calendario</h1>
          <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3, letterSpacing:'-.01em' }}>
            {format(mese,'MMMM yyyy',{locale:it})} · {scadenze.length} scadenze
          </p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={() => setMese(m => subMonths(m,1))}><ChevronLeft size={15}/></button>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--text1)', minWidth:150, textAlign:'center', letterSpacing:'-.02em' }}>
            {format(mese,'MMMM yyyy',{locale:it})}
          </span>
          <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={() => setMese(m => addMonths(m,1))}><ChevronRight size={15}/></button>
          <div style={{ width:1, height:20, background:'var(--border2)', margin:'0 4px' }} />
          <button className="btn btn-ghost" style={{ fontSize:12.5 }} onClick={() => setMese(new Date())}>Oggi</button>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}><Plus size={14}/> Scadenza</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:16 }}>

        {/* Griglia calendario */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {/* Intestazione giorni */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
            {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map((g,i) => (
              <div key={g} style={{ padding:'10px 0', textAlign:'center', fontSize:11, fontWeight:700, color: i>=5 ? 'var(--text4)' : 'var(--text4)', textTransform:'uppercase', letterSpacing:'.07em' }}>{g}</div>
            ))}
          </div>
          {/* Celle */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {giorni.map((d,i) => {
              const mioMese = isSameMonth(d,mese)
              const isOggi  = isSameDay(d,oggi)
              const isSel   = selData && isSameDay(d,selData)
              const sc      = scadenzeGiorno(d)
              const hasUrgent = sc.some(s => {
                const days = Math.ceil((new Date(s.data_scadenza)-oggi)/86400000)
                return days<=2 && !s.completata
              })
              return (
                <div key={i} onClick={() => setSelData(isSel ? null : d)}
                  style={{
                    minHeight:80, padding:'7px 8px',
                    borderRight:(i+1)%7!==0?'1px solid var(--border)':'none',
                    borderBottom:'1px solid var(--border)',
                    cursor:'pointer',
                    background: isSel ? 'rgba(59,130,246,0.07)' : 'transparent',
                    transition:'background .1s',
                  }}
                  onMouseEnter={e => !isSel && (e.currentTarget.style.background='var(--bg4)')}
                  onMouseLeave={e => !isSel && (e.currentTarget.style.background='transparent')}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{
                      width:24, height:24, borderRadius:'50%',
                      background: isOggi ? 'var(--blue)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <span style={{ fontSize:12.5, fontWeight: isOggi ? 700 : 400, color: isOggi ? '#fff' : mioMese ? 'var(--text2)' : 'var(--text4)' }}>{format(d,'d')}</span>
                    </div>
                    {hasUrgent && <div style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444' }} />}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {sc.slice(0,3).map(s => {
                      const col = TIPO_COLOR[s.tipo] || '#64748b'
                      return (
                        <div key={s.id} style={{
                          fontSize:9.5, padding:'2px 5px', borderRadius:4,
                          background: s.completata ? 'rgba(34,197,94,0.08)' : col+'14',
                          color: s.completata ? '#4ade80' : col,
                          border:`1px solid ${s.completata ? 'rgba(34,197,94,.15)' : col+'25'}`,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          textDecoration: s.completata ? 'line-through' : 'none',
                          fontWeight:500,
                        }}>
                          {s.titolo}
                        </div>
                      )
                    })}
                    {sc.length > 3 && <div style={{ fontSize:9, color:'var(--text4)', paddingLeft:3 }}>+{sc.length-3} altri</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pannello laterale */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {selData ? (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={14} color="var(--blue2)" />
                <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em' }}>
                  {format(selData,'d MMMM yyyy',{locale:it})}
                </span>
                <span className="badge badge-blue" style={{ marginLeft:'auto' }}>{selScadenze.length}</span>
              </div>
              {selScadenze.length === 0 ? (
                <div style={{ padding:'28px', textAlign:'center', color:'var(--text4)', fontSize:13 }}>Nessuna scadenza</div>
              ) : selScadenze.map((s,i) => {
                const col = TIPO_COLOR[s.tipo] || '#64748b'
                return (
                  <div key={s.id} style={{ padding:'11px 16px', borderBottom: i<selScadenze.length-1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:3, borderRadius:99, background:col, alignSelf:'stretch', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color: s.completata ? 'var(--text4)' : 'var(--text1)', textDecoration: s.completata ? 'line-through':'none', letterSpacing:'-.01em' }}>{s.titolo}</div>
                      <div style={{ display:'flex', gap:8, marginTop:3 }}>
                        <span className="badge badge-gray" style={{ fontSize:10 }}>{s.tipo}</span>
                        {s.importo>0 && <span style={{ fontSize:11, color:'#fbbf24', fontWeight:600 }}>€{parseFloat(s.importo).toLocaleString('it-IT')}</span>}
                      </div>
                    </div>
                    <button onClick={() => togglCompleta(s)} className={`btn ${s.completata ? 'btn-ghost':'btn-green'}`} style={{ padding:'4px 8px', fontSize:11 }}>
                      <Check size={11}/>
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'32px 20px' }}>
              <Calendar size={28} color="var(--text4)" style={{ margin:'0 auto 10px', opacity:.4 }} />
              <div style={{ fontSize:13, color:'var(--text4)' }}>Clicca su un giorno per vedere le scadenze</div>
            </div>
          )}

          {/* Scadenze del mese */}
          <div>
            <div className="nav-section-label" style={{ marginBottom:8 }}>Scadenze del mese</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {pending.slice(0,10).map(s => {
                const col = TIPO_COLOR[s.tipo] || '#64748b'
                return (
                  <div key={s.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 12px', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border2)', cursor:'pointer', transition:'background .1s' }}
                    onClick={() => setSelData(new Date(s.data_scadenza))}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg4)'}
                    onMouseLeave={e => e.currentTarget.style.background='var(--bg3)'}>
                    <div style={{ width:3, height:28, borderRadius:99, background:col, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{s.titolo}</div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text4)', whiteSpace:'nowrap' }}>{format(new Date(s.data_scadenza),'d MMM',{locale:it})}</div>
                  </div>
                )
              })}
              {pending.length === 0 && <div style={{ fontSize:12.5, color:'var(--text4)', textAlign:'center', padding:'16px 0' }}>Nessuna scadenza pendente 🎉</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:15.5, fontWeight:700, color:'var(--text1)', letterSpacing:'-.03em' }}>Nuova scadenza</h2>
                <p style={{ fontSize:12, color:'var(--text4)', marginTop:2 }}>Aggiungi al calendario</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex', borderRadius:6 }}><X size={15}/></button>
            </div>
            <div className="modal-body">
              <div><label className="lbl">Titolo *</label><input className="inp" autoFocus value={form.titolo} onChange={e => setForm(f=>({...f,titolo:e.target.value}))} placeholder="Es. Versamento IVA trimestrale" /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="lbl">Data *</label><input className="inp" type="date" value={form.data_scadenza} onChange={e => setForm(f=>({...f,data_scadenza:e.target.value}))} /></div>
                <div><label className="lbl">Tipo</label>
                  <select className="inp" value={form.tipo} onChange={e => setForm(f=>({...f,tipo:e.target.value}))}>
                    {['scadenza','rata','dichiarazione','versamento','altro'].map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="lbl">Importo (€)</label><input className="inp" type="number" step="0.01" value={form.importo} onChange={e => setForm(f=>({...f,importo:e.target.value}))} placeholder="0.00" /></div>
                <div><label className="lbl">Cliente</label>
                  <select className="inp" value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))}>
                    <option value="">— Nessuno —</option>
                    {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale||`${c.nome||''} ${c.cognome||''}`.trim()}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Descrizione</label><textarea className="inp" rows={2} value={form.descrizione} onChange={e => setForm(f=>({...f,descrizione:e.target.value}))} style={{ resize:'none' }} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={salva} disabled={saving||!form.titolo||!form.data_scadenza}>
                {saving ? 'Salvo...' : <><Plus size={13}/> Salva scadenza</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
