import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download, FileSpreadsheet, FileText, BarChart2, Users, FolderOpen, CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'

// ── CSV helpers ─────────────────────────────────────────────────────────────

function csvRow(arr) {
  return arr.map(v => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')
}

function downloadCSV(rows, filename) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── JSON→HTML→PDF helper ────────────────────────────────────────────────────

function downloadHTML(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Color helpers ───────────────────────────────────────────────────────────

const EUR = v => `€ ${parseFloat(v || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ════════════════════════════════════════════════════════════════════════════
// REPORT GENERATORS
// ════════════════════════════════════════════════════════════════════════════

async function exportClientiCSV(toast) {
  toast('Caricamento clienti...', 'loading')
  const { data, error } = await supabase
    .from('clienti')
    .select('*')
    .order('ragione_sociale,cognome')
  if (error) { toast('Errore: ' + error.message, 'error'); return }

  const header = csvRow(['Tipo', 'Ragione Sociale / Nome', 'Cognome', 'Codice Fiscale', 'Partita IVA', 'Telefono', 'Email', 'Indirizzo', 'Regime Fiscale', 'Stato', 'Note'])
  const rows = (data || []).map(c => csvRow([
    c.tipo === 'azienda' ? 'Azienda' : 'Persona Fisica',
    c.ragione_sociale || c.nome || '',
    c.cognome || '',
    c.codice_fiscale || '',
    c.partita_iva || '',
    c.telefono || '',
    c.email || '',
    c.indirizzo || '',
    c.regime_fiscale || '',
    c.stato || '',
    c.note || ''
  ]))
  downloadCSV([header, ...rows], `clienti_${format(new Date(), 'yyyyMMdd')}.csv`)
  toast(`${data.length} clienti esportati`, 'success')
}

async function exportPraticheCSV(toast) {
  toast('Caricamento pratiche...', 'loading')
  const { data, error } = await supabase
    .from('pratiche')
    .select('*, clienti(ragione_sociale,nome,cognome)')
    .order('created_at', { ascending: false })
  if (error) { toast('Errore: ' + error.message, 'error'); return }

  const nomeC = p => p.clienti ? (p.clienti.ragione_sociale || `${p.clienti.nome || ''} ${p.clienti.cognome || ''}`.trim()) : ''
  const header = csvRow(['Titolo', 'Cliente', 'Stato', 'Priorità', 'Categoria', 'Scadenza', 'Descrizione', 'Note', 'Creata il'])
  const rows = (data || []).map(p => csvRow([
    p.titolo || '',
    nomeC(p),
    p.stato || '',
    p.priorita || '',
    p.categoria || '',
    p.data_scadenza || '',
    p.descrizione || '',
    p.note || '',
    p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy') : ''
  ]))
  downloadCSV([header, ...rows], `pratiche_${format(new Date(), 'yyyyMMdd')}.csv`)
  toast(`${data.length} pratiche esportate`, 'success')
}

async function exportRateizziCSV(toast) {
  toast('Caricamento rateizzi...', 'loading')
  const { data: rateizzi, error: e1 } = await supabase
    .from('rateizzazioni')
    .select('*, clienti(ragione_sociale,nome,cognome)')
    .order('created_at', { ascending: false })
  if (e1) { toast('Errore: ' + e1.message, 'error'); return }

  const { data: rate, error: e2 } = await supabase
    .from('rate')
    .select('*')
    .order('numero')
  if (e2) { toast('Errore rate: ' + e2.message, 'error'); return }

  const nomeC = r => r.clienti ? (r.clienti.ragione_sociale || `${r.clienti.nome || ''} ${r.clienti.cognome || ''}`.trim()) : ''
  const ratePerRateizzazione = {}
  ;(rate || []).forEach(r => {
    if (!ratePerRateizzazione[r.rateizzazione_id]) ratePerRateizzazione[r.rateizzazione_id] = []
    ratePerRateizzazione[r.rateizzazione_id].push(r)
  })

  const header = csvRow(['Titolo', 'Cliente', 'Importo Totale', 'N° Rate', 'Rate Pagate', 'Importo Pagato', 'Importo Residuo', 'Stato', 'Note'])
  const rows = (rateizzi || []).map(r => {
    const mieRate = ratePerRateizzazione[r.id] || []
    const pagate = mieRate.filter(x => x.pagata).length
    const importoPagato = mieRate.filter(x => x.pagata).reduce((s, x) => s + parseFloat(x.importo || 0), 0)
    return csvRow([
      r.titolo || '',
      nomeC(r),
      r.importo_totale || 0,
      r.numero_rate || 0,
      pagate,
      importoPagato.toFixed(2),
      (parseFloat(r.importo_totale || 0) - importoPagato).toFixed(2),
      r.stato || '',
      r.note || ''
    ])
  })
  downloadCSV([header, ...rows], `rateizzi_${format(new Date(), 'yyyyMMdd')}.csv`)
  toast(`${rateizzi.length} rateizzi esportati`, 'success')
}

async function exportScadenzeCSV(toast, mese) {
  toast('Caricamento scadenze...', 'loading')
  const inizio = format(startOfMonth(mese), 'yyyy-MM-dd')
  const fine = format(endOfMonth(mese), 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('scadenze')
    .select('*')
    .gte('data_scadenza', inizio)
    .lte('data_scadenza', fine)
    .order('data_scadenza')
  if (error) { toast('Errore: ' + error.message, 'error'); return }

  const header = csvRow(['Titolo', 'Data Scadenza', 'Tipo', 'Importo', 'Completata', 'Descrizione'])
  const rows = (data || []).map(s => csvRow([
    s.titolo || '',
    s.data_scadenza || '',
    s.tipo || '',
    s.importo || 0,
    s.completata ? 'Sì' : 'No',
    s.descrizione || ''
  ]))
  downloadCSV([header, ...rows], `scadenze_${format(mese, 'yyyyMM')}.csv`)
  toast(`${data.length} scadenze esportate`, 'success')
}

async function exportRottamazioniCSV(toast) {
  toast('Caricamento rottamazioni...', 'loading')
  const { data, error } = await supabase
    .from('rottamazioni')
    .select('*, clienti(ragione_sociale,nome,cognome)')
    .order('created_at', { ascending: false })
  if (error) { toast('Errore: ' + error.message, 'error'); return }

  const nomeC = r => r.clienti ? (r.clienti.ragione_sociale || `${r.clienti.nome || ''} ${r.clienti.cognome || ''}`.trim()) : ''
  const header = csvRow(['Titolo', 'Cliente', 'Importo Totale', 'N° Rate', 'Stato/Fase', 'Note'])
  const rows = (data || []).map(r => csvRow([
    r.titolo || '', nomeC(r), r.importo_totale || 0, r.numero_rate || 0, r.stato || '', r.note || ''
  ]))
  downloadCSV([header, ...rows], `rottamazioni_${format(new Date(), 'yyyyMMdd')}.csv`)
  toast(`${data.length} rottamazioni esportate`, 'success')
}

async function exportReportCompleto(toast) {
  toast('Generazione report completo...', 'loading')

  const oggi = new Date()
  const fra14 = new Date(); fra14.setDate(fra14.getDate() + 14)

  const [
    { data: clienti }, { data: pratiche },
    { data: rateizzi }, { data: rate },
    { data: scadenze }, { data: rottamazioni }
  ] = await Promise.all([
    supabase.from('clienti').select('*').order('ragione_sociale,cognome'),
    supabase.from('pratiche').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at', { ascending: false }),
    supabase.from('rateizzazioni').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at', { ascending: false }),
    supabase.from('rate').select('*'),
    supabase.from('scadenze').select('*').gte('data_scadenza', oggi.toISOString().split('T')[0]).lte('data_scadenza', fra14.toISOString().split('T')[0]).eq('completata', false).order('data_scadenza'),
    supabase.from('rottamazioni').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at', { ascending: false }),
  ])

  const nomeC = r => r?.clienti ? (r.clienti.ragione_sociale || `${r.clienti.nome || ''} ${r.clienti.cognome || ''}`.trim()) : '—'

  // Calcoli rateizzi
  const ratePerR = {}
  ;(rate || []).forEach(r => {
    if (!ratePerR[r.rateizzazione_id]) ratePerR[r.rateizzazione_id] = []
    ratePerR[r.rateizzazione_id].push(r)
  })
  const totaleRateizzi = (rateizzi || []).reduce((s, r) => s + parseFloat(r.importo_totale || 0), 0)
  const totalePagato = (rateizzi || []).reduce((s, r) => {
    const mieRate = ratePerR[r.id] || []
    return s + mieRate.filter(x => x.pagata).reduce((ss, x) => ss + parseFloat(x.importo || 0), 0)
  }, 0)

  const statiPratiche = {}
  ;(pratiche || []).forEach(p => { statiPratiche[p.stato] = (statiPratiche[p.stato] || 0) + 1 })

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Report Studio Mazzella — ${format(oggi, 'd MMMM yyyy', { locale: it })}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 32px; }
    h1 { font-size: 22px; color: #0f2744; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 12px; margin-bottom: 28px; }
    h2 { font-size: 14px; color: #0f2744; margin: 24px 0 10px; border-left: 3px solid #c9a227; padding-left: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .kpi-val { font-size: 24px; font-weight: 700; color: #0f2744; }
    .kpi-lbl { font-size: 11px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .b-green { background: #dcfce7; color: #166534; }
    .b-blue { background: #dbeafe; color: #1e40af; }
    .b-orange { background: #fed7aa; color: #9a3412; }
    .b-gray { background: #f1f5f9; color: #475569; }
    .b-red { background: #fee2e2; color: #991b1b; }
    .warn { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 11px; color: #92400e; }
    .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
    @media print { body { padding: 16px; } .kpi-grid { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>📊 Report Studio Mazzella</h1>
  <p class="subtitle">Generato il ${format(oggi, "d MMMM yyyy 'alle' HH:mm", { locale: it })}</p>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${(clienti || []).length}</div><div class="kpi-lbl">Clienti totali</div></div>
    <div class="kpi"><div class="kpi-val">${(pratiche || []).length}</div><div class="kpi-lbl">Pratiche totali</div></div>
    <div class="kpi"><div class="kpi-val">${(rateizzi || []).filter(r => r.stato === 'attiva').length}</div><div class="kpi-lbl">Rateizzi attivi</div></div>
    <div class="kpi"><div class="kpi-val">${(scadenze || []).length}</div><div class="kpi-lbl">Scadenze 14 giorni</div></div>
  </div>

  ${(scadenze || []).length > 0 ? `
  <div class="warn">⚠️ Attenzione: ${scadenze.length} scadenza${scadenze.length > 1 ? 'e' : ''} nei prossimi 14 giorni</div>
  <table>
    <thead><tr><th>Scadenza</th><th>Data</th><th>Importo</th></tr></thead>
    <tbody>
      ${scadenze.map(s => {
        const gg = Math.ceil((new Date(s.data_scadenza) - oggi) / 86400000)
        return `<tr>
          <td>${s.titolo}</td>
          <td>${format(new Date(s.data_scadenza), 'd MMM yyyy', { locale: it })} <span class="badge ${gg <= 3 ? 'b-red' : 'b-orange'}">${gg === 0 ? 'Oggi' : gg === 1 ? 'Domani' : gg + 'gg'}</span></td>
          <td>${s.importo > 0 ? EUR(s.importo) : '—'}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>` : ''}

  <h2>👥 Clienti (${(clienti || []).length})</h2>
  <table>
    <thead><tr><th>Nome / Ragione Sociale</th><th>CF / P.IVA</th><th>Contatto</th><th>Tipo</th><th>Stato</th></tr></thead>
    <tbody>
      ${(clienti || []).slice(0, 50).map(c => `<tr>
        <td>${c.ragione_sociale || (c.nome + ' ' + (c.cognome || '')).trim()}</td>
        <td>${c.codice_fiscale || ''}<br/><span style="color:#94a3b8">${c.partita_iva || ''}</span></td>
        <td>${c.email || ''}<br/><span style="color:#94a3b8">${c.telefono || ''}</span></td>
        <td><span class="badge b-gray">${c.tipo === 'azienda' ? 'Azienda' : 'Persona'}</span></td>
        <td><span class="badge ${c.stato === 'attivo' ? 'b-green' : 'b-gray'}">${c.stato || 'attivo'}</span></td>
      </tr>`).join('')}
      ${(clienti || []).length > 50 ? `<tr><td colspan="5" style="color:#64748b;font-style:italic">... e altri ${clienti.length - 50} clienti</td></tr>` : ''}
    </tbody>
  </table>

  <h2>📁 Pratiche per stato</h2>
  <table>
    <thead><tr><th>Stato</th><th>Quantità</th></tr></thead>
    <tbody>
      ${Object.entries(statiPratiche).map(([s, n]) => `<tr>
        <td><span class="badge ${s === 'completata' ? 'b-green' : s === 'in_corso' ? 'b-blue' : 'b-gray'}">${s}</span></td>
        <td>${n}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>💳 Rateizzazioni</h2>
  <table style="margin-bottom:8px">
    <thead><tr><th>Titolo</th><th>Cliente</th><th>Totale</th><th>Pagato</th><th>Residuo</th><th>Stato</th></tr></thead>
    <tbody>
      ${(rateizzi || []).map(r => {
        const mieRate = ratePerR[r.id] || []
        const pagato = mieRate.filter(x => x.pagata).reduce((s, x) => s + parseFloat(x.importo || 0), 0)
        const residuo = parseFloat(r.importo_totale || 0) - pagato
        return `<tr>
          <td>${r.titolo}</td>
          <td>${nomeC(r)}</td>
          <td>${EUR(r.importo_totale)}</td>
          <td style="color:#166534">${EUR(pagato)}</td>
          <td style="color:${residuo > 0 ? '#991b1b' : '#166534'}">${EUR(residuo)}</td>
          <td><span class="badge ${r.stato === 'attiva' ? 'b-green' : 'b-gray'}">${r.stato}</span></td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
  <p style="font-size={11}px;color:#475569;margin-bottom:20px">
    Totale rateizzi: <strong>${EUR(totaleRateizzi)}</strong> · Pagato: <strong>${EUR(totalePagato)}</strong> · Residuo: <strong>${EUR(totaleRateizzi - totalePagato)}</strong>
  </p>

  <h2>🔄 Rottamazioni (${(rottamazioni || []).length})</h2>
  <table>
    <thead><tr><th>Titolo</th><th>Cliente</th><th>Importo</th><th>Rate</th><th>Fase</th></tr></thead>
    <tbody>
      ${(rottamazioni || []).map(r => `<tr>
        <td>${r.titolo}</td>
        <td>${nomeC(r)}</td>
        <td>${EUR(r.importo_totale)}</td>
        <td>${r.numero_rate}</td>
        <td><span class="badge b-blue">${r.stato || '—'}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">Studio Mazzella · Report generato automaticamente · ${format(oggi, 'dd/MM/yyyy HH:mm')}</div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  downloadHTML(html, `report_completo_${format(oggi, 'yyyyMMdd')}.html`)
  toast('Report completo pronto — si aprirà la stampa/PDF', 'success')
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ESPORTAZIONI = [
  {
    id: 'clienti', label: 'Lista Clienti', desc: 'Anagrafica completa di tutti i clienti', icon: Users,
    color: '#60a5fa', formato: 'CSV', fn: (t) => exportClientiCSV(t)
  },
  {
    id: 'pratiche', label: 'Pratiche', desc: 'Tutte le pratiche con stato e priorità', icon: FolderOpen,
    color: '#a78bfa', formato: 'CSV', fn: (t) => exportPraticheCSV(t)
  },
  {
    id: 'rateizzi', label: 'Rateizzazioni', desc: 'Rateizzi con importi pagati e residui', icon: CreditCard,
    color: '#c9a227', formato: 'CSV', fn: (t) => exportRateizziCSV(t)
  },
  {
    id: 'rottamazioni', label: 'Rottamazioni', desc: 'Rottamazioni quater/quinquies', icon: BarChart2,
    color: '#34d399', formato: 'CSV', fn: (t) => exportRottamazioniCSV(t)
  },
]

export default function Report() {
  const [toastMsg, setToastMsg] = useState(null)
  const [loading, setLoading] = useState({})
  const [meseScadenze, setMeseScadenze] = useState(new Date())

  function toast(msg, type = 'info') {
    setToastMsg({ msg, type })
    if (type !== 'loading') setTimeout(() => setToastMsg(null), 3500)
  }

  async function run(id, fn) {
    setLoading(l => ({ ...l, [id]: true }))
    await fn(toast)
    setLoading(l => ({ ...l, [id]: false }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 className="page-title">Report & Export</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text4)', marginTop: 3, letterSpacing: '-.01em' }}>Esporta dati in formato CSV o genera report PDF stampabili</p>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 200,
          background: toastMsg.type === 'error' ? '#1a0808' : toastMsg.type === 'success' ? '#081a10' : '#0c1526',
          border: `1px solid ${toastMsg.type === 'error' ? 'rgba(239,68,68,0.4)' : toastMsg.type === 'success' ? 'rgba(16,185,129,0.4)' : 'var(--bg4)'}`,
          borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: toastMsg.type === 'error' ? '#f87171' : toastMsg.type === 'success' ? '#34d399' : '#cbd5e1',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)', animation: 'slideUp .2s ease'
        }}>
          {toastMsg.type === 'loading' && <div className="spinner" style={{ width: 14, height: 14 }} />}
          {toastMsg.type === 'success' && <CheckCircle size={14} />}
          {toastMsg.type === 'error' && <AlertCircle size={14} />}
          {toastMsg.msg}
        </div>
      )}

      {/* Export singoli CSV */}
      <div>
        <div className="nav-section-label" style={{ marginBottom: 12 }}>Esportazioni CSV</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {ESPORTAZIONI.map(e => (
            <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${e.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <e.icon size={18} color={e.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', letterSpacing:'-.02em' }}>{e.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>{e.desc}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', background: 'var(--border)', padding: '2px 7px', borderRadius: 6 }}>
                  {e.formato}
                </span>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => run(e.id, e.fn)}
                disabled={loading[e.id]}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading[e.id]
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Esportando...</>
                  : <><FileSpreadsheet size={14} /> Esporta CSV</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export scadenze per mese */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Calendar size={18} color="#60a5fa" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', letterSpacing:'-.02em' }}>Scadenze per mese</div>
            <div style={{ fontSize: 12, color: 'var(--text4)' }}>Esporta le scadenze di un mese specifico</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="month"
            value={format(meseScadenze, 'yyyy-MM')}
            onChange={e => setMeseScadenze(new Date(e.target.value + '-01'))}
            className="inp"
            style={{ width: 180 }}
          />
          <button
            className="btn btn-outline"
            onClick={() => run('scadenze', t => exportScadenzeCSV(t, meseScadenze))}
            disabled={loading['scadenze']}
          >
            {loading['scadenze']
              ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Esportando...</>
              : <><FileSpreadsheet size={14} /> Esporta {format(meseScadenze, 'MMMM yyyy', { locale: it })}</>
            }
          </button>
        </div>
      </div>

      {/* Report completo HTML/PDF */}
      <div className="card" style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={20} color="#c9a227" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)', letterSpacing:'-.02em' }}>Report Completo Studio</div>
            <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 3 }}>
              Genera un report HTML completo con tutti i dati — clienti, pratiche, rateizzi, rottamazioni e scadenze urgenti. Si apre direttamente nel browser per la stampa o il salvataggio in PDF.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-gold"
            onClick={() => run('completo', exportReportCompleto)}
            disabled={loading['completo']}
            style={{ padding: '10px 20px' }}
          >
            {loading['completo']
              ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generando...</>
              : <><Download size={15} /> Genera Report PDF/Stampa</>
            }
          </button>
          <span style={{ fontSize: 12, color: 'var(--text4)' }}>Si aprirà il dialogo di stampa del browser per salvare in PDF</span>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px' }}>
        <p style={{ fontSize: 12, color: 'var(--text4)', lineHeight: 1.6 }}>
          💡 <strong style={{ color: 'var(--text3)' }}>Come usare i CSV:</strong> Apri il file con Excel, LibreOffice Calc o Google Sheets. La codifica è UTF-8 con BOM per garantire la corretta visualizzazione dei caratteri italiani (accenti, ecc.)
        </p>
      </div>
    </div>
  )
}
