import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Globe, Plus, Eye, EyeOff, Copy, Check, Trash2, X, Lock, ExternalLink, Search } from 'lucide-react'

const EMPTY = { nome_portale:'', cliente_id:'', username:'', password:'', pin:'', url:'', note:'' }

const PORTALI_NOTI = [
  { nome:'AdE - Agenzia Entrate', url:'https://telematici.agenziaentrate.gov.it', icon:'🏛️' },
  { nome:'INPS', url:'https://www.inps.it', icon:'🔵' },
  { nome:'INAIL', url:'https://servizi.inail.it', icon:'🟠' },
  { nome:'Camera di Commercio', url:'https://www.registroimprese.it', icon:'🏢' },
  { nome:'F24 Online', url:'https://telematici.agenziaentrate.gov.it', icon:'📄' },
]

export default function AccessiPortali() {
  const [portali, setPortali] = useState([])
  const [clienti, setClienti] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState({})
  const [copiato, setCopiato] = useState({})
  const [q, setQ] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data:p },{ data:c }] = await Promise.all([
      supabase.from('accessi_portali').select('*, clienti(ragione_sociale,nome,cognome)').order('nome_portale'),
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome').order('ragione_sociale'),
    ])
    setPortali(p||[]); setClienti(c||[])
  }

  async function salva() {
    setSaving(true)
    await supabase.from('accessi_portali').insert([{ ...form, cliente_id:form.cliente_id||null }])
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  async function elimina(id) {
    if (!confirm('Eliminare questo accesso?')) return
    await supabase.from('accessi_portali').delete().eq('id',id); load()
  }

  async function copia(text, key) {
    await navigator.clipboard.writeText(text)
    setCopiato(c => ({...c,[key]:true}))
    setTimeout(() => setCopiato(c => ({...c,[key]:false})), 1800)
  }

  const nomeC = p => p.clienti ? (p.clienti.ragione_sociale||`${p.clienti.nome||''} ${p.clienti.cognome||''}`.trim()) : '—'
  const filtered = portali.filter(p => !q || p.nome_portale?.toLowerCase().includes(q.toLowerCase()) || nomeC(p).toLowerCase().includes(q.toLowerCase()))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div>
          <h1 className="page-title">Accessi Portali</h1>
          <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3, letterSpacing:'-.01em' }}>{portali.length} accessi salvati · dati cifrati</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }} style={{ marginLeft:'auto' }}><Plus size={14}/> Nuovo accesso</button>
      </div>

      <div style={{ position:'relative', maxWidth:420 }}>
        <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text4)', pointerEvents:'none' }}/>
        <input className="inp" style={{ paddingLeft:34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca portale o cliente..." />
        {q && <button onClick={() => setQ('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex' }}><X size={13}/></button>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:12 }}>
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ padding:0, overflow:'hidden' }}>
            {/* Card header */}
            <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'var(--blue-dim)', border:'1px solid var(--blue-glow)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Globe size={16} color="var(--blue2)"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text1)', letterSpacing:'-.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nome_portale}</div>
                <div style={{ fontSize:11.5, color:'var(--text4)', marginTop:1 }}>{nomeC(p)}</div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding:'4px 8px' }}><ExternalLink size={12}/></a>}
                <button className="btn btn-red" style={{ padding:'4px 8px' }} onClick={() => elimina(p.id)}><Trash2 size={12}/></button>
              </div>
            </div>
            {/* Credenziali */}
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:5 }}>
              {[
                { key:'username', label:'USER', value:p.username, mono:false },
                { key:'password', label:'PASS', value:p.password, secret:true },
                { key:'pin',      label:'PIN',  value:p.pin,      mono:true },
              ].filter(f => f.value).map(f => (
                <div key={f.key} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg2)', borderRadius:7, padding:'7px 10px', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:9.5, fontWeight:700, color:'var(--text4)', letterSpacing:'.07em', width:32, flexShrink:0 }}>{f.label}</span>
                  <span style={{ flex:1, fontSize:12.5, color:'var(--text2)', fontFamily: f.secret && !show[`${p.id}_${f.key}`] ? 'monospace':'inherit', letterSpacing:f.secret && !show[`${p.id}_${f.key}`]?'.1em':'normal', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {f.secret && !show[`${p.id}_${f.key}`] ? '••••••••' : f.value}
                  </span>
                  {f.secret && (
                    <button onClick={() => setShow(s => ({...s,[`${p.id}_${f.key}`]:!s[`${p.id}_${f.key}`]}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex', flexShrink:0 }}>
                      {show[`${p.id}_${f.key}`] ? <EyeOff size={12}/> : <Eye size={12}/>}
                    </button>
                  )}
                  <button onClick={() => copia(f.value, `${p.id}_${f.key}`)} style={{ background:'none', border:'none', cursor:'pointer', color:copiato[`${p.id}_${f.key}`]?'#4ade80':'var(--text4)', display:'flex', flexShrink:0, transition:'color .15s' }}>
                    {copiato[`${p.id}_${f.key}`] ? <Check size={12}/> : <Copy size={12}/>}
                  </button>
                </div>
              ))}
              {p.note && <div style={{ fontSize:11.5, color:'var(--text4)', marginTop:2, lineHeight:1.5 }}>{p.note}</div>}
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="card" style={{ textAlign:'center', padding:'48px 24px', gridColumn:'1/-1' }}>
            <Lock size={30} color="var(--text4)" style={{ margin:'0 auto 12px', opacity:.4 }}/>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text3)' }}>Nessun portale salvato</div>
            <div style={{ fontSize:12.5, color:'var(--text4)', marginTop:4 }}>Aggiungi il primo accesso con il pulsante in alto</div>
          </div>
        )}
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:15.5, fontWeight:700, color:'var(--text1)', letterSpacing:'-.03em' }}>Nuovo accesso portale</h2>
                <p style={{ fontSize:12, color:'var(--text4)', marginTop:2 }}>Salva le credenziali in modo sicuro</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex', borderRadius:6 }}><X size={15}/></button>
            </div>
            <div className="modal-body">
              {/* Portali suggeriti */}
              <div>
                <label className="lbl">Portali frequenti</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                  {PORTALI_NOTI.map(pn => (
                    <button key={pn.nome} onClick={() => setForm(f=>({...f,nome_portale:pn.nome,url:pn.url}))}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, border:`1px solid ${form.nome_portale===pn.nome?'var(--blue)':'var(--border3)'}`, background:form.nome_portale===pn.nome?'var(--blue-dim)':'transparent', color:form.nome_portale===pn.nome?'var(--blue2)':'var(--text4)', fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                      <span>{pn.icon}</span>{pn.nome.split(' - ')[0].split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="lbl">Nome portale *</label><input className="inp" autoFocus value={form.nome_portale} onChange={e => setForm(f=>({...f,nome_portale:e.target.value}))} placeholder="AdE, INPS, F24..." /></div>
                <div><label className="lbl">Cliente</label>
                  <select className="inp" value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))}>
                    <option value="">— Nessuno —</option>
                    {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale||`${c.nome||''} ${c.cognome||''}`.trim()}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">URL</label><input className="inp" value={form.url} onChange={e => setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="lbl">Username / Email</label><input className="inp" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} /></div>
                <div><label className="lbl">Password</label><input className="inp" type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} /></div>
              </div>
              <div><label className="lbl">PIN</label><input className="inp" value={form.pin} onChange={e => setForm(f=>({...f,pin:e.target.value}))} /></div>
              <div><label className="lbl">Note</label><textarea className="inp" rows={2} value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} style={{ resize:'none' }} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={salva} disabled={saving||!form.nome_portale}>
                {saving ? 'Salvo...' : <><Lock size={13}/> Salva accesso</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
