import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Plus, Search, ChevronRight, User, Building2, X, Users, Filter } from 'lucide-react'

const VUOTO = { tipo: 'persona_fisica', ragione_sociale: '', nome: '', cognome: '', codice_fiscale: '', partita_iva: '', telefono: '', email: '', regime_fiscale: 'ordinario', stato: 'attivo', note: '' }

export default function Clienti() {
  const navigate = useNavigate()
  const toast = useToast()
  const [clienti, setClienti] = useState([])
  const [q, setQ] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(VUOTO)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const primoRef = useRef(null)

  useEffect(() => { load() }, [])
  useEffect(() => { if (modal) setTimeout(() => primoRef.current?.focus(), 80) }, [modal])

  async function load() {
    const { data } = await supabase.from('clienti')
      .select('id,ragione_sociale,nome,cognome,codice_fiscale,partita_iva,telefono,email,tipo,stato,regime_fiscale')
      .order('ragione_sociale,cognome')
    setClienti(data || [])
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setErr('')
    const nome = form.tipo === 'societa' ? form.ragione_sociale : (form.cognome || form.nome)
    if (!nome?.trim()) { setErr('Inserisci almeno il nome o la ragione sociale.'); return }
    setSaving(true)
    const { error } = await supabase.from('clienti').insert([{ ...form, codice_fiscale: (form.codice_fiscale || '').toUpperCase() }])
    if (error) { setErr('Errore: ' + error.message); setSaving(false); return }
    toast('Cliente aggiunto con successo', 'success')
    setSaving(false); setModal(false); setForm(VUOTO); load()
  }

  const label = c => c.ragione_sociale || `${c.nome||''} ${c.cognome||''}`.trim() || '—'

  const filtered = useMemo(() => {
    let res = clienti
    if (filtroTipo) res = res.filter(c => c.tipo === filtroTipo)
    if (!q) return res
    const s = q.toLowerCase()
    return res.filter(c =>
      label(c).toLowerCase().includes(s) ||
      (c.codice_fiscale||'').toLowerCase().includes(s) ||
      (c.partita_iva||'').toLowerCase().includes(s) ||
      (c.telefono||'').includes(s) ||
      (c.email||'').toLowerCase().includes(s)
    )
  }, [clienti, q, filtroTipo])

  const societaCount = clienti.filter(c => c.tipo === 'societa').length
  const personaCount = clienti.filter(c => c.tipo !== 'societa').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 className="page-title">Clienti</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text4)', marginTop: 3, letterSpacing: '-.01em' }}>
            {clienti.length} clienti totali · {filtered.length} mostrati
          </p>
        </div>
        <button onClick={() => { setForm(VUOTO); setErr(''); setModal(true) }} className="btn btn-gold" style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Nuovo cliente
        </button>
      </div>

      {/* Filtri + Ricerca */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
          <input className="inp" style={{ paddingLeft: 34 }} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cerca per nome, CF, P.IVA, email..." />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}><X size={13} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { v: '', l: `Tutti (${clienti.length})` },
            { v: 'societa', l: `Società (${societaCount})` },
            { v: 'persona_fisica', l: `Persone (${personaCount})` },
          ].map(f => (
            <button key={f.v} onClick={() => setFiltroTipo(f.v === filtroTipo ? '' : f.v)}
              className={`btn ${filtroTipo === f.v || (f.v === '' && !filtroTipo) ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '5px 11px' }}>{f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="th">Cliente</th>
              <th className="th">Tipo</th>
              <th className="th">CF / P.IVA</th>
              <th className="th">Contatti</th>
              <th className="th">Regime</th>
              <th className="th" style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="tr" style={{ cursor: 'pointer' }} onClick={() => navigate(`/clienti/${c.id}`)}>
                <td className="td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: c.tipo === 'societa' ? 'var(--blue-dim)' : 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${c.tipo === 'societa' ? 'var(--blue-glow)' : 'rgba(168,85,247,.2)'}` }}>
                      {c.tipo === 'societa' ? <Building2 size={14} color="var(--blue2)" /> : <User size={14} color="#d8b4fe" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>{label(c)}</div>
                      {c.email && <div style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 1 }}>{c.email}</div>}
                    </div>
                  </div>
                </td>
                <td className="td">
                  <span className={`badge ${c.tipo === 'societa' ? 'badge-blue' : 'badge-purple'}`}>
                    {c.tipo === 'societa' ? 'Società' : 'Persona fisica'}
                  </span>
                </td>
                <td className="td">
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                    {c.codice_fiscale && <div style={{ letterSpacing: '.04em' }}>{c.codice_fiscale}</div>}
                    {c.partita_iva && <div style={{ color: 'var(--text4)' }}>IVA {c.partita_iva}</div>}
                    {!c.codice_fiscale && !c.partita_iva && <span style={{ color: 'var(--text4)' }}>—</span>}
                  </div>
                </td>
                <td className="td" style={{ fontSize: 12.5, color: 'var(--text3)' }}>
                  {c.telefono && <div>{c.telefono}</div>}
                  {!c.telefono && !c.email && <span style={{ color: 'var(--text4)' }}>—</span>}
                </td>
                <td className="td">
                  {c.regime_fiscale ? <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{c.regime_fiscale}</span> : <span style={{ color: 'var(--text4)' }}>—</span>}
                </td>
                <td className="td">
                  <ChevronRight size={14} color="var(--text4)" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-state-icon"><Users size={32} /></div>
                  <div className="empty-state-title">{q ? 'Nessun cliente trovato' : 'Nessun cliente'}</div>
                  <div className="empty-state-sub">{q ? `Nessun risultato per "${q}"` : 'Aggiungi il primo cliente'}</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nuovo cliente */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text1)', letterSpacing: '-.03em' }}>Nuovo cliente</h2>
                <p style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>Compila i dati anagrafici</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 4, borderRadius: 6, display: 'flex' }}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ v: 'persona_fisica', l: '👤 Persona fisica' }, { v: 'societa', l: '🏢 Società' }].map(t => (
                  <button key={t.v} onClick={() => set('tipo', t.v)} style={{
                    flex: 1, padding: '9px', borderRadius: 9,
                    border: `1px solid ${form.tipo === t.v ? 'var(--blue)' : 'var(--border3)'}`,
                    background: form.tipo === t.v ? 'var(--blue-dim)' : 'transparent',
                    color: form.tipo === t.v ? 'var(--blue2)' : 'var(--text3)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}>{t.l}</button>
                ))}
              </div>
              {form.tipo === 'societa' ? (
                <div><label className="lbl">Ragione sociale *</label>
                  <input ref={primoRef} className="inp" value={form.ragione_sociale} onChange={e => set('ragione_sociale', e.target.value)} placeholder="Es. ROSSI S.R.L." />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label className="lbl">Nome</label><input ref={primoRef} className="inp" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Mario" /></div>
                  <div><label className="lbl">Cognome *</label><input className="inp" value={form.cognome} onChange={e => set('cognome', e.target.value)} placeholder="Rossi" /></div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="lbl">Codice Fiscale</label>
                  <input className="inp" value={form.codice_fiscale} onChange={e => set('codice_fiscale', e.target.value.toUpperCase())} placeholder="RSSMRA80A01H501Z" maxLength={16} style={{ fontFamily: 'monospace', letterSpacing: '.04em' }} />
                </div>
                <div><label className="lbl">Partita IVA</label>
                  <input className="inp" value={form.partita_iva} onChange={e => set('partita_iva', e.target.value)} placeholder="12345678901" maxLength={11} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="lbl">Telefono</label><input className="inp" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="333 1234567" /></div>
                <div><label className="lbl">Email</label><input className="inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mario@email.it" /></div>
              </div>
              <div><label className="lbl">Regime fiscale</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {['ordinario', 'forfettario', 'semplificato'].map(r => (
                    <button key={r} onClick={() => set('regime_fiscale', r)} style={{
                      padding: '5px 12px', borderRadius: 20,
                      border: `1px solid ${form.regime_fiscale === r ? 'var(--blue)' : 'var(--border3)'}`,
                      background: form.regime_fiscale === r ? 'var(--blue-dim)' : 'transparent',
                      color: form.regime_fiscale === r ? 'var(--blue2)' : 'var(--text4)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <div><label className="lbl">Note <span style={{ color: 'var(--text4)', fontWeight: 400, textTransform: 'none' }}>(opzionale)</span></label>
                <textarea className="inp" rows={2} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Informazioni aggiuntive..." style={{ resize: 'none' }} />
              </div>
              {err && <div style={{ padding: '9px 13px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, fontSize: 13, color: '#f87171' }}>{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-gold" onClick={save} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Salvo...</> : <><Plus size={13} /> Salva cliente</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
