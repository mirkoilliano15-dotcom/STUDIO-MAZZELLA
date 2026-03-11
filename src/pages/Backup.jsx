import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Download, Shield, Database, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const TABELLE = [
  { nome:'clienti',           label:'Clienti',           icon:'👤', desc:'Anagrafica completa' },
  { nome:'pratiche',          label:'Pratiche',           icon:'📂', desc:'Gestione pratiche e stati' },
  { nome:'rateizzazioni',     label:'Rateizzazioni',      icon:'💳', desc:'Piani di rateizzi attivi' },
  { nome:'rate',              label:'Rate singole',       icon:'📅', desc:'Rate e pagamenti' },
  { nome:'rottamazioni',      label:'Rottamazioni',       icon:'🗂️', desc:'Rottamazione quinquies/quater' },
  { nome:'scadenze',          label:'Scadenze',           icon:'⏰', desc:'Calendario scadenze' },
  { nome:'documenti',         label:'Documenti',          icon:'📄', desc:'Archivio documenti' },
  { nome:'accessi_portali',   label:'Accessi Portali',    icon:'🔒', desc:'Credenziali (cifrate)' },
  { nome:'note_clienti',      label:'Note clienti',       icon:'💬', desc:'Diario note per cliente' },
]

function csvRow(arr) {
  return arr.map(v => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s
  }).join(',')
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

function downloadCSV(rows, filename) {
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

export default function Backup() {
  const [loading, setLoading] = useState({})
  const [done, setDone]       = useState({})
  const [backupAll, setBackupAll] = useState(false)
  const [lastBackup, setLastBackup] = useState(null)

  async function esportaTabella(nome) {
    setLoading(l => ({ ...l, [nome]: true }))
    const { data, error } = await supabase.from(nome).select('*').order('created_at', { ascending: false })
    if (error || !data?.length) {
      setLoading(l => ({ ...l, [nome]: false }))
      return
    }
    // Build CSV
    const keys = Object.keys(data[0])
    const header = csvRow(keys)
    const rows = data.map(r => csvRow(keys.map(k => r[k])))
    downloadCSV([header, ...rows], `${nome}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    setLoading(l => ({ ...l, [nome]: false }))
    setDone(d => ({ ...d, [nome]: true }))
    setTimeout(() => setDone(d => ({ ...d, [nome]: false })), 3000)
  }

  async function backupCompleto() {
    setBackupAll(true)
    const tutto = {}
    for (const t of TABELLE) {
      const { data } = await supabase.from(t.nome).select('*').order('created_at', { ascending: false }).catch(() => ({ data: [] }))
      tutto[t.nome] = data || []
    }
    const ts = format(new Date(), 'yyyyMMdd_HHmmss')
    downloadJSON({ _meta: { data: new Date().toISOString(), versione: 'v9', tabelle: Object.keys(tutto).length }, ...tutto }, `studio_mazzella_backup_${ts}.json`)
    setBackupAll(false)
    setLastBackup(new Date())
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:720 }}>
      <div>
        <h1 className="page-title">Backup & Export</h1>
        <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3 }}>Esporta e scarica tutti i tuoi dati in qualsiasi momento</p>
      </div>

      {/* Backup completo */}
      <div className="card" style={{ background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.2)', padding:'20px 22px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--blue-dim)', border:'1px solid var(--blue-glow)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Database size={20} color="var(--blue2)" />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text1)', letterSpacing:'-.03em' }}>Backup completo</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginTop:3, lineHeight:1.6 }}>
              Scarica un file JSON con tutti i dati di tutte le tabelle. Puoi usarlo per ripristinare o importare i dati in qualsiasi momento.
            </div>
            {lastBackup && (
              <div style={{ fontSize:11.5, color:'var(--blue2)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                <CheckCircle2 size={11}/> Ultimo backup: {format(lastBackup, "d MMMM HH:mm", { locale:it })}
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={backupCompleto} disabled={backupAll} style={{ padding:'10px 22px' }}>
          {backupAll ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Preparando backup...</> : <><Download size={14}/> Scarica backup completo (.json)</>}
        </button>
      </div>

      {/* Avviso sicurezza */}
      <div style={{ display:'flex', gap:10, padding:'12px 16px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
        <Shield size={14} color="var(--amber2)" style={{ flexShrink:0, marginTop:1 }} />
        <div style={{ fontSize:12.5, color:'var(--text3)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--amber2)' }}>Attenzione:</strong> Il backup include gli accessi ai portali. Conserva il file in un luogo sicuro e non condividerlo.
        </div>
      </div>

      {/* Per tabella */}
      <div>
        <div className="nav-section-label" style={{ marginBottom:10 }}>Esporta singola tabella (CSV)</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {TABELLE.map(t => (
            <div key={t.nome} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
              <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em' }}>{t.label}</div>
                <div style={{ fontSize:11.5, color:'var(--text4)', marginTop:1 }}>{t.desc}</div>
              </div>
              <button onClick={() => esportaTabella(t.nome)} disabled={loading[t.nome]}
                className={`btn ${done[t.nome] ? 'btn-green' : 'btn-outline'}`} style={{ fontSize:12, padding:'6px 14px', flexShrink:0 }}>
                {loading[t.nome] ? <><div className="spinner" style={{ width:12, height:12 }}/> Esportando...</>
                 : done[t.nome] ? <><CheckCircle2 size={12}/> Scaricato!</>
                 : <><Download size={12}/> CSV</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10 }}>
        <p style={{ fontSize:12, color:'var(--text4)', lineHeight:1.7 }}>
          💡 <strong style={{ color:'var(--text3)' }}>Suggerimento:</strong> Esegui un backup completo almeno una volta al mese e conservalo su Google Drive o altro cloud personale. I dati su Supabase sono già ridondanti, ma avere una copia locale è buona pratica.
        </p>
      </div>
    </div>
  )
}
