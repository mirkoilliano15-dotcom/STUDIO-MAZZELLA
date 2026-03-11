import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Info, CheckCircle, ChevronDown, Trash2, AlertCircle } from 'lucide-react'
import { format, addMonths, parseISO } from 'date-fns'

const OPT_PROSPETTO    = ['—', 'Da richiedere', 'Ricevuto ✓']
const OPT_CARTELLA     = ['—', 'Da fare', 'In corso', 'Completato ✓']
const OPT_ROTTAMAZIONE = ['—', 'Da fare', 'Presentata', 'Accettata ✓', 'Rifiutata']
const OPT_RATE         = ['—', 'Da fare', 'In pagamento', 'Completate ✓']

function coloreStatus(v) {
  if (!v || v === '—')
    return { bg: '#f0f4fa', color: '#7a95b0', border: '#e2eaf4' }
  if (v.includes('✓'))
    return { bg: 'rgba(5,150,105,0.08)', color: '#065f46', border: 'rgba(5,150,105,0.2)' }
  if (v === 'In pagamento')
    return { bg: 'rgba(234,88,12,0.08)', color: '#9a3412', border: 'rgba(234,88,12,0.2)' }
  if (v === 'Presentata')
    return { bg: 'rgba(37,99,235,0.08)', color: '#1e40af', border: 'rgba(37,99,235,0.2)' }
  if (v === 'Rifiutata')
    return { bg: 'rgba(220,38,38,0.08)', color: '#991b1b', border: 'rgba(220,38,38,0.2)' }
  return { bg: '#f7f9fc', color: 'var(--text4)', border: '#e2eaf4' }
}

function DropSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const c = coloreStatus(value)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        padding: '5px 10px', borderRadius: 8, width: '100%',
        background: c.bg, color: c.color, border: `1.5px solid ${c.border}`,
        cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        transition: 'all .12s',
      }}>
        <span>{value || '—'}</span>
        <ChevronDown size={10} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4,
            background: '#ffffff', border: '1.5px solid #c8d8ec', borderRadius: 12,
            padding: 5, minWidth: 180,
            boxShadow: '0 8px 28px rgba(13,27,46,0.14)',
          }}>
            {options.map(o => {
              const oc = coloreStatus(o)
              return (
                <button key={o} onClick={() => { onChange(o); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 11px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, color: oc.color, borderRadius: 8,
                    fontFamily: 'inherit', transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = oc.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  {o}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

const VUOTO = { cliente_id: '', importo_totale: '', numero_rate: '18', data_prima_rata: '', note: '' }

function nomeC(c) {
  if (!c) return '—'
  return c.ragione_sociale || `${c.nome || ''} ${c.cognome || ''}`.trim() || '—'
}

function generaRate(form) {
  const nr = parseInt(form.numero_rate) || 18
  const tot = parseFloat(form.importo_totale) || 0
  const imp = Math.round(tot / nr * 100) / 100
  if (!form.data_prima_rata) return []
  const prima = parseISO(form.data_prima_rata)
  return Array.from({ length: nr }, (_, i) => ({
    numero: i + 1, importo: imp,
    data_scadenza: format(addMonths(prima, i * 2), 'yyyy-MM-dd'), pagata: false,
  }))
}

// Calcola progresso (% campi completati)
function progressoRiga(r) {
  const campi = [r.prospetto, r.cartella, r.rottamazione_stato]
  const completati = campi.filter(v => v && v.includes('✓')).length
  return Math.round((completati / campi.length) * 100)
}

export default function Rottamazioni({ clienteId = null }) {
  const [tab, setTab] = useState('lavorazione')
  const [righe, setRighe] = useState([])
  const [clienti, setClienti] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(VUOTO)
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')

  useEffect(() => { load() }, [clienteId])

  async function load() {
    let q = supabase.from('rottamazioni')
      .select('*, clienti(id,ragione_sociale,nome,cognome,codice_fiscale)')
      .order('created_at', { ascending: false })
    if (clienteId) q = q.eq('cliente_id', clienteId)
    const [{ data: r }, { data: c }] = await Promise.all([
      q,
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome,codice_fiscale').order('ragione_sociale,cognome'),
    ])
    setRighe(r || [])
    setClienti(c || [])
  }

  async function aggiorna(id, campo, valore) {
    await supabase.from('rottamazioni').update({ [campo]: valore }).eq('id', id)
    setRighe(rs => rs.map(r => r.id === id ? { ...r, [campo]: valore } : r))
  }

  async function salva() {
    setErrore('')
    setSaving(true)
    const clienteSel = clienti.find(c => c.id === (form.cliente_id || clienteId))
    const rateArr = generaRate({ ...form, cliente_id: form.cliente_id || clienteId })
    const { error } = await supabase.from('rottamazioni').insert([{
      titolo: nomeC(clienteSel),
      cliente_id: form.cliente_id || clienteId || null,
      importo_totale: parseFloat(form.importo_totale) || 0,
      data_presentazione: form.data_prima_rata || null,
      stato: 'bozza', note: form.note, rate: rateArr,
      prospetto: '—', cartella: '—', rottamazione_stato: '—', rate_stato: '—',
    }])
    if (!error) {
      const nr = parseInt(form.numero_rate) || 18
      if (nr >= 10 && form.data_prima_rata) {
        const dataDecima = format(addMonths(parseISO(form.data_prima_rata), 18), 'yyyy-MM-dd')
        const imp = Math.round((parseFloat(form.importo_totale) || 0) / nr * 100) / 100
        await supabase.from('scadenze').insert([{
          titolo: `⚠️ 10ª Rata Quinquies — ${nomeC(clienteSel)}`,
          data_scadenza: dataDecima, tipo: 'rata', importo: imp,
          descrizione: `10ª rata rottamazione di ${nomeC(clienteSel)}.`,
          completata: false, cliente_id: form.cliente_id || clienteId || null,
        }])
      }
      setModal(false); setForm(VUOTO); load()
    } else {
      setErrore('Errore nel salvataggio: ' + error.message)
    }
    setSaving(false)
  }

  async function elimina(id) {
    if (!confirm('Eliminare questa rottamazione?')) return
    const { error } = await supabase.from('rottamazioni').delete().eq('id', id)
    if (!error) load()
  }

  const inLavorazione = righe.filter(r => !r.rottamazione_stato?.includes('Accettata'))
  const inQuinquies   = righe.filter(r =>  r.rottamazione_stato?.includes('Accettata'))
  const displayRighe  = tab === 'lavorazione' ? inLavorazione : inQuinquies
  const totale = displayRighe.reduce((s, r) => s + (parseFloat(r.importo_totale) || 0), 0)
  const isEmbed = !!clienteId

  // Colonne della tabella corrente
  const showRate = tab === 'quinquies'
  const numColonne = (isEmbed ? 0 : 1) + 3 + (showRate ? 1 : 0) + 1 + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header standalone ── */}
      {!isEmbed && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}>
                <Trash2 size={16} color="#fff" />
              </div>
              <div>
                <h1 className="page-title">Rottamazione Cartelle</h1>
                <p style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 1 }}>
                  {inLavorazione.length} in lavorazione · {inQuinquies.length} in Quinquies
                </p>
              </div>
            </div>
          </div>
          <button className="btn btn-gold" onClick={() => { setForm(VUOTO); setErrore(''); setModal(true) }} style={{ marginLeft: 'auto' }}>
            <Plus size={14} /> Aggiungi Cliente
          </button>
        </div>
      )}

      {/* ── Header embed ── */}
      {isEmbed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{righe.length} pratiche rottamazione</span>
          <button className="btn btn-gold" style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => { setForm({ ...VUOTO, cliente_id: clienteId }); setErrore(''); setModal(true) }}>
            <Plus size={13} /> Aggiungi
          </button>
        </div>
      )}

      {/* ── KPI strip (solo standalone) ── */}
      {!isEmbed && righe.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Totale pratiche', value: righe.length, color: '#1e40af', bg: 'rgba(37,99,235,0.07)', border: 'rgba(37,99,235,0.14)' },
            { label: 'In lavorazione', value: inLavorazione.length, color: '#9a3412', bg: 'rgba(234,88,12,0.07)', border: 'rgba(234,88,12,0.14)' },
            { label: 'Quinquies', value: inQuinquies.length, color: '#065f46', bg: 'rgba(5,150,105,0.07)', border: 'rgba(5,150,105,0.14)' },
          ].map((k, i) => (
            <div key={i} style={{
              background: k.bg, border: `1.5px solid ${k.border}`,
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.04em' }}>{k.value}</div>
              <div style={{ fontSize: 12, color: k.color, fontWeight: 600, opacity: 0.8 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', background: 'var(--bg3)',
        border: '1.5px solid var(--border)', borderRadius: 12, padding: 4, gap: 4,
      }}>
        {[
          { key: 'lavorazione', label: 'Documenti Rottamazione', n: inLavorazione.length },
          { key: 'quinquies',   label: 'Rottamazione Quinquies',  n: inQuinquies.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 9,
            background: tab === t.key ? '#ffffff' : 'transparent',
            border: tab === t.key ? '1.5px solid var(--border2)' : '1.5px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? 'var(--accent)' : 'var(--text3)',
            boxShadow: tab === t.key ? '0 1px 4px rgba(30,58,138,0.08)' : 'none',
            transition: 'all .15s',
          }}>
            <CheckCircle size={13} color={tab === t.key ? 'var(--accent2)' : 'var(--text4)'} />
            {t.label}
            <span style={{
              background: tab === t.key ? 'var(--accent-dim)' : 'var(--bg5)',
              color: tab === t.key ? 'var(--accent)' : 'var(--text3)',
              fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99,
              border: `1px solid ${tab === t.key ? 'var(--accent-glow)' : 'var(--border)'}`,
            }}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* ── Info banner ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10,
        background: tab === 'lavorazione' ? 'rgba(37,99,235,0.05)' : 'rgba(5,150,105,0.05)',
        border: `1.5px solid ${tab === 'lavorazione' ? 'rgba(37,99,235,0.14)' : 'rgba(5,150,105,0.14)'}`,
      }}>
        <Info size={14} color={tab === 'lavorazione' ? '#2563eb' : '#059669'} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12.5, color: tab === 'lavorazione' ? '#1e40af' : '#065f46', lineHeight: 1.5 }}>
          {tab === 'lavorazione'
            ? <span>Quando tutti i check sono completati, il cliente passa in <strong>Rottamazione Quinquies</strong> (imposta Rottamazione = Accettata ✓).</span>
            : 'Clienti con documentazione completa. Gestisci le rate della Rottamazione Quinquies.'}
        </span>
      </div>

      {/* ── Tabella ── */}
      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
              {!isEmbed && <th className="th" style={{ borderRadius: '14px 0 0 0' }}>Cliente</th>}
              <th className="th">Prospetto Informativo</th>
              <th className="th">Cartella Esattoriale</th>
              <th className="th">Rottamazione</th>
              {showRate && <th className="th">Rate</th>}
              <th className="th" style={{ textAlign: 'right' }}>Importo</th>
              <th className="th" style={{ width: 50, borderRadius: '0 14px 0 0' }}></th>
            </tr>
          </thead>
          <tbody>
            {displayRighe.map(r => {
              const prog = progressoRiga(r)
              return (
                <tr key={r.id} className="tr">
                  {!isEmbed && (
                    <td className="td">
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text1)' }}>
                        {r.clienti ? nomeC(r.clienti) : r.titolo}
                      </div>
                      {r.note && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {r.note}
                        </div>
                      )}
                      {/* Mini progress bar */}
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden', maxWidth: 100 }}>
                          <div style={{ height: '100%', width: `${prog}%`, borderRadius: 99, background: prog === 100 ? '#059669' : '#2563eb', transition: 'width .4s' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{prog}%</span>
                      </div>
                    </td>
                  )}
                  <td className="td" style={{ minWidth: 155 }}>
                    <DropSelect value={r.prospetto || '—'} options={OPT_PROSPETTO} onChange={v => aggiorna(r.id, 'prospetto', v)} />
                  </td>
                  <td className="td" style={{ minWidth: 155 }}>
                    <DropSelect value={r.cartella || '—'} options={OPT_CARTELLA} onChange={v => aggiorna(r.id, 'cartella', v)} />
                  </td>
                  <td className="td" style={{ minWidth: 155 }}>
                    <DropSelect value={r.rottamazione_stato || '—'} options={OPT_ROTTAMAZIONE} onChange={v => aggiorna(r.id, 'rottamazione_stato', v)} />
                  </td>
                  {showRate && (
                    <td className="td" style={{ minWidth: 155 }}>
                      <DropSelect value={r.rate_stato || '—'} options={OPT_RATE} onChange={v => aggiorna(r.id, 'rate_stato', v)} />
                    </td>
                  )}
                  <td className="td" style={{ textAlign: 'right', fontWeight: 700, color: r.importo_totale ? 'var(--text1)' : 'var(--text4)', fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>
                    {r.importo_totale ? `€ ${parseFloat(r.importo_totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="td">
                    <button onClick={() => elimina(r.id)} title="Elimina" style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text4)', padding: 5, display: 'flex', borderRadius: 7,
                      transition: 'all .12s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#b91c1c' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text4)' }}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {displayRighe.length === 0 && (
              <tr>
                <td colSpan={numColonne} style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text4)', fontSize: 32, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 600 }}>Nessun cliente in questa sezione</div>
                  <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 4 }}>
                    {tab === 'lavorazione' ? 'Aggiungi un cliente per iniziare.' : 'I clienti con Rottamazione Accettata ✓ appariranno qui.'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {displayRighe.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)' }}>
                <td className="td" colSpan={numColonne - 2}
                  style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 12.5 }}>
                  Totale {tab === 'lavorazione' ? 'lavorazione' : 'Quinquies'} — {displayRighe.length} pratiche
                </td>
                <td className="td" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                  € {totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Modal aggiungi ── */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 750, color: 'var(--text1)' }}>Aggiungi rottamazione</h2>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Compila i dati del cliente da aggiungere</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', borderRadius: 8 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isEmbed && (
                <div>
                  <label className="lbl">Cliente *</label>
                  <select className="inp" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">— Seleziona cliente —</option>
                    {clienti.map(c => <option key={c.id} value={c.id}>{nomeC(c)}{c.codice_fiscale ? ` — ${c.codice_fiscale}` : ''}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="lbl">Importo totale (€) *</label>
                  <input className="inp" type="number" step="0.01" min="0" value={form.importo_totale}
                    onChange={e => setForm(f => ({ ...f, importo_totale: e.target.value }))}
                    placeholder="es. 5000.00" />
                </div>
                <div>
                  <label className="lbl">N. rate bimestrali</label>
                  <input className="inp" type="number" min="1" max="36" value={form.numero_rate}
                    onChange={e => setForm(f => ({ ...f, numero_rate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="lbl">Data prima rata</label>
                <input className="inp" type="date" value={form.data_prima_rata}
                  onChange={e => setForm(f => ({ ...f, data_prima_rata: e.target.value }))} />
              </div>
              {form.importo_totale && form.numero_rate && (
                <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)', borderRadius: 10, fontSize: 12.5, color: 'var(--accent)' }}>
                  📊 Rata stimata: <strong>€ {(parseFloat(form.importo_totale || 0) / parseInt(form.numero_rate || 1)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong> ogni 2 mesi
                </div>
              )}
              <div>
                <label className="lbl">Note</label>
                <textarea className="inp" rows={2} value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  style={{ resize: 'none' }} placeholder="Annotazioni opzionali..." />
              </div>
              {errore && (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.06)', border: '1.5px solid rgba(220,38,38,0.16)', borderRadius: 10, fontSize: 12.5, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {errore}
                </div>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1.5px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-gold" onClick={salva}
                disabled={saving || (!isEmbed && !form.cliente_id) || !form.importo_totale}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Salvo...</> : <><Plus size={14} /> Aggiungi</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
