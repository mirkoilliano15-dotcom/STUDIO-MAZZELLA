import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, ChevronDown, ChevronUp, Check, X, Trash2 } from 'lucide-react'
import { format, addMonths, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

const VUOTO = { titolo: '', cliente_id: '', importo_totale: '', numero_rate: '12', data_prima_rata: '', stato: 'attiva', note: '' }

export default function Rateizzi() {
  const [lista, setLista] = useState([])
  const [clienti, setClienti] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(VUOTO)
  const [saving, setSaving] = useState(false)
  const [aperto, setAperto] = useState(null)
  const [rate, setRate] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from('rateizzazioni').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at', { ascending: false }),
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome').order('ragione_sociale,cognome'),
    ])
    setLista(r || [])
    setClienti(c || [])
  }

  async function apriRate(id) {
    if (aperto === id) { setAperto(null); return }
    setAperto(id)
    if (!rate[id]) {
      const { data } = await supabase.from('rate').select('*').eq('rateizzazione_id', id).order('numero')
      setRate(r => ({ ...r, [id]: data || [] }))
    }
  }

  async function togglePagata(rata) {
    const { data: updated } = await supabase.from('rate').update({
      pagata: !rata.pagata,
      data_pagamento: !rata.pagata ? new Date().toISOString().split('T')[0] : null
    }).eq('id', rata.id).select().single()
    if (updated) {
      setRate(r => ({
        ...r,
        [rata.rateizzazione_id]: r[rata.rateizzazione_id].map(x => x.id === rata.id ? updated : x)
      }))
    }
  }

  async function salva() {
    setSaving(true)
    const nr = parseInt(form.numero_rate)
    const totale = parseFloat(form.importo_totale)
    const importoRata = Math.round((totale / nr) * 100) / 100
    const primaData = form.data_prima_rata ? parseISO(form.data_prima_rata) : new Date()

    const { data: rat, error } = await supabase.from('rateizzazioni').insert([{
      titolo: form.titolo,
      cliente_id: form.cliente_id || null,
      importo_totale: totale,
      numero_rate: nr,
      data_prima_rata: form.data_prima_rata || null,
      stato: form.stato,
      note: form.note,
    }]).select().single()

    if (!error && rat) {
      // Genera rate mensili
      const rateArr = Array.from({ length: nr }, (_, i) => ({
        rateizzazione_id: rat.id,
        numero: i + 1,
        importo: importoRata,
        data_scadenza: format(addMonths(primaData, i), 'yyyy-MM-dd'),
        pagata: false,
      }))
      await supabase.from('rate').insert(rateArr)

      // ⚠️ Crea scadenza automatica per la 10ª rata
      if (nr >= 10) {
        const dataDecima = format(addMonths(primaData, 9), 'yyyy-MM-dd')
        await supabase.from('scadenze').insert([{
          titolo: `⚠️ 10ª Rata — ${form.titolo}`,
          data_scadenza: dataDecima,
          tipo: 'rata',
          importo: importoRata,
          descrizione: `Attenzione: 10ª rata della rateizzazione "${form.titolo}". Verificare il pagamento per evitare decadenza del piano.`,
          completata: false,
          cliente_id: form.cliente_id || null,
        }])
      }

      setModal(false)
      setForm(VUOTO)
      load()
    }
    setSaving(false)
  }

  async function elimina(id) {
    if (!confirm('Eliminare questa rateizzazione e tutte le sue rate?')) return
    await supabase.from('rate').delete().eq('rateizzazione_id', id)
    await supabase.from('rateizzazioni').delete().eq('id', id)
    load()
  }

  const nomeCliente = c => c.clienti ? (c.clienti.ragione_sociale || `${c.clienti.nome || ''} ${c.clienti.cognome || ''}`.trim()) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 className="page-title">Rateizzi</h1>
          <p style={{ fontSize: 13, color: 'var(--text4)', marginTop: 2 }}>{lista.length} piani di rateizzazione</p>
        </div>
        <button className="btn btn-gold" onClick={() => setModal(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> Nuovo rateizzi
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lista.map(r => {
          const rateList = rate[r.id] || []
          const pagate = rateList.filter(x => x.pagata).length
          const perc = rateList.length > 0 ? Math.round((pagate / rateList.length) * 100) : 0
          const isOpen = aperto === r.id

          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', transition: 'border-color .15s' }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => apriRate(r.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{r.titolo}</span>
                    <span className={`badge ${r.stato === 'attiva' ? 'badge-green' : 'badge-gray'}`}>{r.stato}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text4)' }}>{nomeCliente(r)} · €{parseFloat(r.importo_totale || 0).toLocaleString('it-IT')} · {r.numero_rate} rate</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress" style={{ flex: 1 }}>
                      <div className="progress-inner" style={{ width: `${perc}%` }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text4)', whiteSpace: 'nowrap' }}>{pagate}/{r.numero_rate} ({perc}%)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); elimina(r.id) }} className="btn btn-red" style={{ padding: '5px 8px' }}><Trash2 size={13} /></button>
                  {isOpen ? <ChevronUp size={16} color="var(--text4)" /> : <ChevronDown size={16} color="var(--text4)" />}
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #111c2e' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid #111c2e' }}>
                      <th className="th">#</th>
                      <th className="th">Importo</th>
                      <th className="th">Scadenza</th>
                      <th className="th">Stato</th>
                      <th className="th">Pagato il</th>
                      <th className="th" style={{ width: 50 }}></th>
                    </tr></thead>
                    <tbody>
                      {(rate[r.id] || []).map(rata => (
                        <tr key={rata.id} className="tr" style={{ background: rata.numero === 10 ? 'rgba(249,115,22,0.04)' : undefined }}>
                          <td className="td">
                            <span style={{ fontWeight: rata.numero === 10 ? 700 : 400, color: rata.numero === 10 ? '#fb923c' : 'var(--text3)' }}>
                              {rata.numero === 10 ? '⚠ 10' : rata.numero}
                            </span>
                          </td>
                          <td className="td">€{parseFloat(rata.importo).toLocaleString('it-IT')}</td>
                          <td className="td" style={{ fontSize: 12 }}>{new Date(rata.data_scadenza).toLocaleDateString('it-IT')}</td>
                          <td className="td"><span className={`badge ${rata.pagata ? 'badge-green' : 'badge-gray'}`}>{rata.pagata ? 'Pagata' : 'Da pagare'}</span></td>
                          <td className="td" style={{ fontSize: 12 }}>{rata.data_pagamento ? new Date(rata.data_pagamento).toLocaleDateString('it-IT') : '—'}</td>
                          <td className="td">
                            <button onClick={() => togglePagata(rata)} className={`btn ${rata.pagata ? 'btn-ghost' : 'btn-green'}`} style={{ padding: '4px 8px', fontSize: 11 }}>
                              {rata.pagata ? <X size={12} /> : <Check size={12} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
        {lista.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text4)' }}>Nessun piano di rateizzazione. Crea il primo!</div>}
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #111c2e' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Nuovo piano rateizzi</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="lbl">Titolo</label><input className="inp" value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} placeholder="Es. Rateizzazione IRPEF 2023" /></div>
              <div><label className="lbl">Cliente</label>
                <select className="inp" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                  <option value="">— Seleziona cliente —</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale || `${c.nome || ''} ${c.cognome || ''}`.trim()}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="lbl">Importo totale (€)</label><input className="inp" type="number" value={form.importo_totale} onChange={e => setForm(f => ({ ...f, importo_totale: e.target.value }))} /></div>
                <div><label className="lbl">Numero rate</label><input className="inp" type="number" min="1" max="72" value={form.numero_rate} onChange={e => setForm(f => ({ ...f, numero_rate: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="lbl">Prima rata</label><input className="inp" type="date" value={form.data_prima_rata} onChange={e => setForm(f => ({ ...f, data_prima_rata: e.target.value }))} /></div>
                <div><label className="lbl">Stato</label>
                  <select className="inp" value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))}>
                    <option value="attiva">Attiva</option>
                    <option value="sospesa">Sospesa</option>
                    <option value="conclusa">Conclusa</option>
                    <option value="decaduta">Decaduta</option>
                  </select>
                </div>
              </div>
              {parseInt(form.numero_rate) >= 10 && (
                <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 9, padding: '10px 12px', fontSize: 12, color: '#fb923c' }}>
                  ⚠️ Con {form.numero_rate} rate, verrà creata automaticamente una scadenza di avviso per la 10ª rata.
                </div>
              )}
              <div><label className="lbl">Note</label><textarea className="inp" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #111c2e', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-gold" onClick={salva} disabled={saving || !form.titolo || !form.importo_totale}>{saving ? 'Salvo...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
