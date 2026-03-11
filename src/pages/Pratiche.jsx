import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Plus, Trash2, X, Search, Filter, Clock } from 'lucide-react'

const STATI = ['aperta', 'in_corso', 'in_attesa', 'completata', 'archiviata']
const STATI_LABEL = { aperta: 'Aperta', in_corso: 'In corso', in_attesa: 'In attesa', completata: 'Completata', archiviata: 'Archiviata' }
const STATI_BADGE = { aperta: 'badge-blue', in_corso: 'badge-gold', in_attesa: 'badge-purple', completata: 'badge-green', archiviata: 'badge-gray' }
const PRIOR_BADGE = { bassa: 'badge-gray', normale: 'badge-blue', alta: 'badge-amber', urgente: 'badge-red' }
const PRIOR_LABEL = { bassa: 'Bassa', normale: 'Normale', alta: 'Alta', urgente: 'Urgente' }

const EMPTY = { titolo: '', cliente_id: '', stato: 'aperta', priorita: 'normale', categoria: '', data_scadenza: '', descrizione: '', note: '' }

export default function Pratiche() {
  const toast = useToast()
  const [pratiche, setPratiche] = useState([])
  const [clienti, setClienti] = useState([])
  const [filtroStato, setFiltroStato] = useState('')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('pratiche').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at', { ascending: false }),
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome').order('ragione_sociale,cognome'),
    ])
    setPratiche(p || [])
    setClienti(c || [])
  }

  async function salva() {
    if (!form.titolo.trim()) return
    setSaving(true)
    const { error } = await supabase.from('pratiche').insert([{
      titolo: form.titolo, cliente_id: form.cliente_id || null,
      stato: form.stato, priorita: form.priorita, categoria: form.categoria,
      data_scadenza: form.data_scadenza || null, descrizione: form.descrizione, note: form.note,
    }])
    setSaving(false)
    if (!error) { toast('Pratica creata', 'success'); setModal(false); setForm(EMPTY); load() }
    else toast('Errore nella creazione', 'error')
  }

  async function elimina(id) {
    if (!confirm('Eliminare questa pratica?')) return
    await supabase.from('pratiche').delete().eq('id', id)
    toast('Pratica eliminata', 'info')
    load()
  }

  async function cambiaStato(id, stato) {
    await supabase.from('pratiche').update({ stato }).eq('id', id)
    setPratiche(ps => ps.map(p => p.id === id ? { ...p, stato } : p))
    toast(`Stato aggiornato: ${STATI_LABEL[stato]}`, 'success')
  }

  const nomeC = p => p.clienti ? (p.clienti.ragione_sociale || `${p.clienti.nome||''} ${p.clienti.cognome||''}`.trim()) : '—'

  const filtered = useMemo(() => {
    let res = pratiche
    if (filtroStato) res = res.filter(p => p.stato === filtroStato)
    if (q) {
      const sq = q.toLowerCase()
      res = res.filter(p => p.titolo?.toLowerCase().includes(sq) || nomeC(p).toLowerCase().includes(sq))
    }
    return res
  }, [pratiche, filtroStato, q])

  const oggi = new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 className="page-title">Pratiche</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text4)', marginTop: 2 }}>{filtered.length} pratiche{filtroStato ? ` · ${STATI_LABEL[filtroStato]}` : ''}</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setForm(EMPTY); setModal(true) }} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Nuova pratica
        </button>
      </div>

      {/* Filtri + Ricerca */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
          <input className="inp" style={{ paddingLeft: 32 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca per titolo o cliente..." />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setFiltroStato('')} className={`btn ${!filtroStato ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 12, padding: '5px 11px' }}>Tutte <span style={{ opacity: .5 }}>({pratiche.length})</span></button>
          {STATI.map(s => (
            <button key={s} onClick={() => setFiltroStato(s === filtroStato ? '' : s)}
              className={`btn ${filtroStato === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '5px 11px' }}>
              {STATI_LABEL[s]} <span style={{ opacity: .5 }}>({pratiche.filter(p => p.stato === s).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="th">Titolo</th>
              <th className="th">Cliente</th>
              <th className="th">Priorità</th>
              <th className="th">Stato</th>
              <th className="th">Scadenza</th>
              <th className="th" style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const isScaduta = p.data_scadenza && p.data_scadenza < oggi && p.stato !== 'completata'
              return (
                <tr key={p.id} className="tr">
                  <td className="td">
                    <div style={{ fontWeight: 500, color: 'var(--text1)', fontSize: 13 }}>{p.titolo}</div>
                    {p.categoria && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1 }}>{p.categoria}</div>}
                  </td>
                  <td className="td" style={{ fontSize: 12.5, color: 'var(--text3)' }}>{nomeC(p)}</td>
                  <td className="td"><span className={`badge ${PRIOR_BADGE[p.priorita] || 'badge-gray'}`}>{PRIOR_LABEL[p.priorita] || p.priorita}</span></td>
                  <td className="td">
                    <select value={p.stato} onChange={e => cambiaStato(p.id, e.target.value)}
                      className={`badge ${STATI_BADGE[p.stato] || 'badge-gray'}`}
                      style={{ cursor: 'pointer', fontFamily: 'inherit', border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, fontSize: 11 }}>
                      {STATI.map(s => <option key={s} value={s}>{STATI_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="td">
                    {p.data_scadenza ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isScaduta && <Clock size={11} color="#ef4444" />}
                        <span style={{ fontSize: 12, color: isScaduta ? '#f87171' : 'var(--text3)', fontWeight: isScaduta ? 600 : 400 }}>
                          {new Date(p.data_scadenza).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    ) : <span style={{ color: 'var(--text4)' }}>—</span>}
                  </td>
                  <td className="td">
                    <button onClick={() => elimina(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 4, borderRadius: 5, display: 'flex', transition: 'color .1s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text4)'}>
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-state-icon"><FolderOpen size={32} /></div>
                  <div className="empty-state-title">{q || filtroStato ? 'Nessuna pratica trovata' : 'Nessuna pratica'}</div>
                  <div className="empty-state-sub">{q || filtroStato ? 'Prova a modificare i filtri' : 'Crea la prima pratica'}</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>Nuova pratica</h2>
                <p style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>Compila i campi obbligatori</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 4, borderRadius: 6, display: 'flex' }}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div><label className="lbl">Titolo *</label>
                <input className="inp" autoFocus value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} placeholder="Es. Dichiarazione redditi 2024" />
              </div>
              <div><label className="lbl">Cliente</label>
                <select className="inp" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                  <option value="">— Nessun cliente —</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale || `${c.nome||''} ${c.cognome||''}`.trim()}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label className="lbl">Stato</label>
                  <select className="inp" value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))}>
                    {STATI.map(s => <option key={s} value={s}>{STATI_LABEL[s]}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Priorità</label>
                  <select className="inp" value={form.priorita} onChange={e => setForm(f => ({ ...f, priorita: e.target.value }))}>
                    {Object.entries(PRIOR_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Scadenza</label>
                  <input className="inp" type="date" value={form.data_scadenza} onChange={e => setForm(f => ({ ...f, data_scadenza: e.target.value }))} />
                </div>
              </div>
              <div><label className="lbl">Categoria</label>
                <input className="inp" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Es. Dichiarazioni, Contabilità..." />
              </div>
              <div><label className="lbl">Note</label>
                <textarea className="inp" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ resize: 'none' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-gold" onClick={salva} disabled={saving || !form.titolo.trim()}>
                {saving ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Salvo...</> : <><Plus size={13} /> Crea pratica</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FolderOpen({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1"/><path d="M3 15h18"/><path d="M7 19l5-8 5 8"/></svg>
}
