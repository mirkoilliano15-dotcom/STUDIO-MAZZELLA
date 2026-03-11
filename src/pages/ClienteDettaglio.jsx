import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import {
  ArrowLeft, Edit, Save, X, Trash2, Phone, Mail,
  FileText, Globe, Building2, User, ChevronRight, Plus,
  Activity, Clock, TrendingUp
} from 'lucide-react'
import Rottamazioni from './Rottamazioni'
import NoteCliente from '../components/NoteCliente'

const TABS = ['Dati', 'Pratiche', 'Rateizzi', 'Rottamazione', 'Documenti', 'Portali', 'Note', 'Attività']
const STATI_BADGE = { aperta: 'badge-blue', in_corso: 'badge-gold', completata: 'badge-green', sospesa: 'badge-orange', in_attesa: 'badge-purple', archiviata: 'badge-gray' }
const STATI_LABEL = { aperta: 'Aperta', in_corso: 'In corso', completata: 'Completata', sospesa: 'Sospesa', in_attesa: 'In attesa', archiviata: 'Archiviata' }

export default function ClienteDettaglio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [c, setC] = useState(null)
  const [tab, setTab] = useState('Dati')
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({})
  const [pratiche, setPratiche] = useState([])
  const [rateizzi, setRateizzi] = useState([])
  const [documenti, setDocumenti] = useState([])
  const [portali, setPortali] = useState([])
  const [nuovaPratica, setNuovaPratica] = useState(false)
  const [formPratica, setFormPratica] = useState({ titolo: '', stato: 'aperta', priorita: 'normale', data_scadenza: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data } = await supabase.from('clienti').select('*').eq('id', id).single()
    setC(data); setForm(data || {})
    const [{ data: pr }, { data: ra }, { data: do_ }, { data: po }] = await Promise.all([
      supabase.from('pratiche').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('rateizzazioni').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('documenti').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('accessi_portali').select('*').eq('cliente_id', id),
    ])
    setPratiche(pr || []); setRateizzi(ra || []); setDocumenti(do_ || []); setPortali(po || [])
  }

  async function saveEdit() {
    setSaving(true)
    await supabase.from('clienti').update(form).eq('id', id)
    setSaving(false); setEdit(false); load()
    toast('Cliente aggiornato', 'success')
  }

  async function salvaPratica() {
    if (!formPratica.titolo.trim()) return
    setSaving(true)
    await supabase.from('pratiche').insert([{ ...formPratica, cliente_id: id }])
    setSaving(false); setNuovaPratica(false)
    setFormPratica({ titolo: '', stato: 'aperta', priorita: 'normale', data_scadenza: '', note: '' })
    toast('Pratica aggiunta', 'success')
    load()
  }

  async function del() {
    if (!confirm('Eliminare questo cliente e tutti i suoi dati?')) return
    await supabase.from('clienti').delete().eq('id', id)
    toast('Cliente eliminato', 'info')
    navigate('/clienti')
  }

  if (!c) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><div className="spinner" /></div>

  const label = c.ragione_sociale || `${c.nome || ''} ${c.cognome || ''}`.trim()
  const initials = label.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const isSocieta = c.tipo === 'societa'
  const counts = { Pratiche: pratiche.length, Rateizzi: rateizzi.length, Documenti: documenti.length, Portali: portali.length, Attività: pratiche.length + rateizzi.length }
  const pratAperte = pratiche.filter(p => p.stato !== 'completata' && p.stato !== 'archiviata').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <button onClick={() => navigate('/clienti')} className="btn btn-ghost" style={{ padding: '7px 9px', marginTop: 2, flexShrink: 0 }}>
          <ArrowLeft size={15} />
        </button>

        {/* Avatar */}
        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: isSocieta ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: `0 4px 14px ${isSocieta ? 'rgba(59,130,246,.3)' : 'rgba(168,85,247,.3)'}` }}>
          {initials || (isSocieta ? <Building2 size={20} /> : <User size={20} />)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ fontSize: 22 }}>{label}</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge ${isSocieta ? 'badge-blue' : 'badge-purple'}`}>{isSocieta ? 'Società' : 'Persona Fisica'}</span>
            <span className={`badge ${c.stato === 'attivo' ? 'badge-green' : 'badge-gray'}`}>{c.stato || 'attivo'}</span>
            {c.regime_fiscale && <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{c.regime_fiscale}</span>}
            {c.codice_fiscale && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text4)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border2)' }}>{c.codice_fiscale}</span>}
            {c.partita_iva && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text4)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border2)' }}>P.IVA {c.partita_iva}</span>}
          </div>
        </div>

        {/* Azioni rapide */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {c.telefono && (
            <a href={`tel:${c.telefono}`} className="btn btn-ghost" style={{ padding: '7px 10px', fontSize: 12 }}>
              <Phone size={13} /> {c.telefono}
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="btn btn-ghost" style={{ padding: '7px 10px' }}>
              <Mail size={13} />
            </a>
          )}
          {edit ? (
            <>
              <button className="btn btn-ghost" onClick={() => { setEdit(false); setForm(c) }}><X size={13} /> Annulla</button>
              <button className="btn btn-gold" onClick={saveEdit} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 13, height: 13 }} />Salvo...</> : <><Save size={13} />Salva</>}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setEdit(true)}><Edit size={13} /> Modifica</button>
              <button onClick={del} className="btn btn-red"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-item${tab === t ? ' tab-active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {counts[t] > 0 && (
              <span style={{ background: tab === t ? 'var(--blue-dim)' : 'var(--bg4)', color: tab === t ? 'var(--blue2)' : 'var(--text4)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, border: `1px solid ${tab === t ? 'var(--blue-glow)' : 'var(--border2)'}` }}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB DATI ── */}
      {tab === 'Dati' && (
        <div className="card">
          {edit ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {c.tipo === 'persona_fisica' ? (
                <>
                  <div><label className="lbl">Nome</label><input className="inp" value={form.nome||''} onChange={e => setForm(f=>({...f,nome:e.target.value}))} /></div>
                  <div><label className="lbl">Cognome</label><input className="inp" value={form.cognome||''} onChange={e => setForm(f=>({...f,cognome:e.target.value}))} /></div>
                </>
              ) : (
                <div style={{ gridColumn: '1/-1' }}><label className="lbl">Ragione sociale</label><input className="inp" value={form.ragione_sociale||''} onChange={e => setForm(f=>({...f,ragione_sociale:e.target.value}))} /></div>
              )}
              <div><label className="lbl">Codice Fiscale</label><input className="inp" value={form.codice_fiscale||''} onChange={e => setForm(f=>({...f,codice_fiscale:e.target.value.toUpperCase()}))} style={{ fontFamily: 'monospace' }} /></div>
              <div><label className="lbl">Partita IVA</label><input className="inp" value={form.partita_iva||''} onChange={e => setForm(f=>({...f,partita_iva:e.target.value}))} style={{ fontFamily: 'monospace' }} /></div>
              <div><label className="lbl">Telefono</label><input className="inp" value={form.telefono||''} onChange={e => setForm(f=>({...f,telefono:e.target.value}))} /></div>
              <div><label className="lbl">Email</label><input className="inp" value={form.email||''} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
              <div><label className="lbl">Regime fiscale</label>
                <select className="inp" value={form.regime_fiscale||''} onChange={e => setForm(f=>({...f,regime_fiscale:e.target.value}))}>
                  <option value="">—</option>
                  {['ordinario','forfettario','semplificato'].map(r=><option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
                </select>
              </div>
              <div><label className="lbl">Stato</label>
                <select className="inp" value={form.stato||'attivo'} onChange={e => setForm(f=>({...f,stato:e.target.value}))}>
                  {['attivo','inattivo','sospeso'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}><label className="lbl">Note</label><textarea className="inp" rows={3} value={form.note||''} onChange={e => setForm(f=>({...f,note:e.target.value}))} style={{ resize: 'none' }} /></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { l: 'Codice Fiscale', v: c.codice_fiscale, mono: true },
                { l: 'Partita IVA', v: c.partita_iva, mono: true },
                { l: 'Telefono', v: c.telefono },
                { l: 'Email', v: c.email },
                { l: 'Regime Fiscale', v: c.regime_fiscale },
                { l: 'Indirizzo', v: c.indirizzo },
              ].filter(f => f.v).map(f => (
                <div key={f.l} style={{ padding: '12px', background: 'var(--bg2)', borderRadius: 9, border: '1px solid var(--border)' }}>
                  <div className="lbl" style={{ marginBottom: 5 }}>{f.l}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', fontFamily: f.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{f.v}</div>
                </div>
              ))}
              {c.note && (
                <div style={{ gridColumn: '1/-1', padding: '12px', background: 'rgba(245,158,11,.04)', borderRadius: 9, border: '1px solid rgba(245,158,11,.12)' }}>
                  <div className="lbl">Note</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 5, lineHeight: 1.6 }}>{c.note}</div>
                </div>
              )}
              {[c.codice_fiscale, c.partita_iva, c.telefono, c.email, c.indirizzo, c.note].every(v => !v) && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="empty-state"><div className="empty-state-title">Nessun dato aggiuntivo</div><div className="empty-state-sub">Clicca Modifica per aggiungere informazioni</div></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB PRATICHE ── */}
      {tab === 'Pratiche' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-gold" style={{ fontSize: 12 }} onClick={() => setNuovaPratica(true)}><Plus size={13} /> Nuova pratica</button>
          </div>
          {nuovaPratica && (
            <div className="card" style={{ border: '1px solid var(--blue-glow)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label className="lbl">Titolo *</label><input className="inp" autoFocus value={formPratica.titolo} onChange={e => setFormPratica(f=>({...f,titolo:e.target.value}))} placeholder="Es. Dichiarazione redditi 2024" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div><label className="lbl">Stato</label>
                    <select className="inp" value={formPratica.stato} onChange={e => setFormPratica(f=>({...f,stato:e.target.value}))}>
                      {Object.entries(STATI_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className="lbl">Priorità</label>
                    <select className="inp" value={formPratica.priorita} onChange={e => setFormPratica(f=>({...f,priorita:e.target.value}))}>
                      {['bassa','normale','alta','urgente'].map(p=><option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                    </select>
                  </div>
                  <div><label className="lbl">Scadenza</label><input className="inp" type="date" value={formPratica.data_scadenza} onChange={e => setFormPratica(f=>({...f,data_scadenza:e.target.value}))} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setNuovaPratica(false)}>Annulla</button>
                  <button className="btn btn-gold" onClick={salvaPratica} disabled={saving||!formPratica.titolo.trim()}><Plus size={13} />Salva</button>
                </div>
              </div>
            </div>
          )}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {pratiche.length === 0 ? (
              <div className="empty-state"><div className="empty-state-title">Nessuna pratica</div></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th className="th">Titolo</th><th className="th">Priorità</th><th className="th">Stato</th><th className="th">Scadenza</th></tr></thead>
                <tbody>
                  {pratiche.map(p => (
                    <tr key={p.id} className="tr">
                      <td className="td" style={{ fontWeight: 500, color: 'var(--text1)' }}>{p.titolo}</td>
                      <td className="td"><span className={`badge ${p.priorita === 'urgente' ? 'badge-red' : p.priorita === 'alta' ? 'badge-orange' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{p.priorita}</span></td>
                      <td className="td"><span className={`badge ${STATI_BADGE[p.stato] || 'badge-gray'}`}>{STATI_LABEL[p.stato] || p.stato}</span></td>
                      <td className="td" style={{ fontSize: 12, color: 'var(--text3)' }}>{p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString('it-IT') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB RATEIZZI ── */}
      {tab === 'Rateizzi' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {rateizzi.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">Nessuna rateizzazione</div>
              <div className="empty-state-sub">Vai alla sezione <strong style={{ color: 'var(--blue2)' }}>Rateizzi</strong> per crearne una</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th className="th">Titolo</th><th className="th">Importo</th><th className="th">Rate</th><th className="th">Stato</th></tr></thead>
              <tbody>
                {rateizzi.map(r => (
                  <tr key={r.id} className="tr">
                    <td className="td" style={{ fontWeight: 500, color: 'var(--text1)' }}>{r.titolo}</td>
                    <td className="td" style={{ fontWeight: 600, color: '#fbbf24' }}>€ {parseFloat(r.importo_totale||0).toLocaleString('it-IT')}</td>
                    <td className="td" style={{ fontSize: 12, color: 'var(--text3)' }}>{r.numero_rate} rate</td>
                    <td className="td"><span className={`badge ${r.stato === 'attiva' ? 'badge-green' : r.stato === 'decaduta' ? 'badge-red' : 'badge-gray'}`}>{r.stato}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB ROTTAMAZIONE ── */}
      {tab === 'Rottamazione' && <Rottamazioni clienteId={id} />}

      {/* ── TAB DOCUMENTI ── */}
      {tab === 'Documenti' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {documenti.length === 0 ? (
            <div className="empty-state"><div className="empty-state-title">Nessun documento</div></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th className="th">Nome</th><th className="th">Categoria</th><th className="th">Data</th></tr></thead>
              <tbody>
                {documenti.map(d => (
                  <tr key={d.id} className="tr">
                    <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={13} color="var(--blue2)" /><span style={{ color: 'var(--text1)', fontWeight: 500 }}>{d.nome}</span></div></td>
                    <td className="td"><span className="badge badge-gray">{d.categoria || '—'}</span></td>
                    <td className="td" style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(d.created_at).toLocaleDateString('it-IT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}


      {/* ── TAB NOTE ── */}
      {tab === 'Note' && (
        <NoteCliente clienteId={id} />
      )}

      {/* ── TAB ATTIVITÀ ── */}
      {tab === 'Attività' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="card" style={{ padding: '16px 20px', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.05em' }}>{pratiche.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>Pratiche totali</div>
              </div>
              <div style={{ width: 1, background: 'var(--border2)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: pratAperte > 0 ? 'var(--amber2)' : 'var(--text1)', letterSpacing: '-.05em' }}>{pratAperte}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>In lavorazione</div>
              </div>
              <div style={{ width: 1, background: 'var(--border2)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.05em' }}>{rateizzi.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>Rateizzazioni</div>
              </div>
              <div style={{ width: 1, background: 'var(--border2)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.05em' }}>{documenti.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>Documenti</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={14} color="var(--blue2)" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>Timeline attività</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ...pratiche.map(p => ({ tipo: 'pratica', titolo: p.titolo, stato: p.stato, data: p.created_at, sub: `Pratica · ${p.stato?.replace('_',' ')}`, color: '#f59e0b' })),
                ...rateizzi.map(r => ({ tipo: 'rateizzi', titolo: r.titolo, stato: r.stato, data: r.created_at, sub: `Rateizzazione · €${parseFloat(r.importo_totale||0).toLocaleString('it-IT')}`, color: '#a855f7' })),
                ...documenti.map(d => ({ tipo: 'documento', titolo: d.nome, data: d.created_at, sub: `Documento · ${d.categoria||'Generico'}`, color: '#3b82f6' })),
              ].sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0,20).map((ev, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length-1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, border: '2px solid var(--bg)', marginTop: 4, flexShrink: 0 }} />
                    {i < arr.length-1 && <div style={{ width: 2, flex: 1, background: 'var(--border2)', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < arr.length-1 ? 0 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.01em' }}>{ev.titolo}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: ev.color, fontWeight: 600, background: ev.color+'14', padding: '1px 7px', borderRadius: 99, border: `1px solid ${ev.color}22` }}>{ev.sub}</span>
                      <span style={{ fontSize: 11, color: 'var(--text4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={9} />{new Date(ev.data).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {pratiche.length === 0 && rateizzi.length === 0 && documenti.length === 0 && (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-state-title">Nessuna attività registrata</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB PORTALI ── */}
      {tab === 'Portali' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {portali.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="empty-state-title">Nessun portale salvato</div></div></div>
          ) : portali.map(p => (
            <div key={p.id} className="card" style={{ padding: '13px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--blue-glow)' }}>
                  <Globe size={15} color="var(--blue2)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{p.nome_portale}</div>
                  <div style={{ fontSize: 12, color: 'var(--text4)' }}>{p.username}</div>
                </div>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: 11, padding: '5px 11px' }}>Apri <ChevronRight size={10} /></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
