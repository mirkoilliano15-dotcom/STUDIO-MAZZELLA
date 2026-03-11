import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, MessageSquare, Pin, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const TIPI = [
  { v:'nota',      l:'Nota',         color:'#60a5fa', icon:'💬' },
  { v:'chiamata',  l:'Chiamata',     color:'#4ade80', icon:'📞' },
  { v:'incontro',  l:'Incontro',     color:'#a855f7', icon:'🤝' },
  { v:'documento', l:'Documento',    color:'#f59e0b', icon:'📄' },
  { v:'urgente',   l:'Urgente',      color:'#ef4444', icon:'🚨' },
]

const tipoInfo = v => TIPI.find(t => t.v === v) || TIPI[0]

export default function NoteCliente({ clienteId }) {
  const [note, setNote]   = useState([])
  const [testo, setTesto] = useState('')
  const [tipo, setTipo]   = useState('nota')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [clienteId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('note_clienti')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
    setNote(data || [])
    setLoading(false)
  }

  async function aggiungi() {
    if (!testo.trim()) return
    setSaving(true)
    await supabase.from('note_clienti').insert([{
      cliente_id: clienteId,
      testo: testo.trim(),
      tipo,
      data: new Date().toISOString(),
    }])
    setSaving(false)
    setTesto('')
    setTipo('nota')
    load()
  }

  async function elimina(id) {
    await supabase.from('note_clienti').delete().eq('id', id)
    setNote(n => n.filter(x => x.id !== id))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Input nuova nota */}
      <div className="card" style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
          {TIPI.map(t => (
            <button key={t.v} onClick={() => setTipo(t.v)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, border:`1px solid ${tipo===t.v ? t.color+'50' : 'var(--border2)'}`, background:tipo===t.v ? t.color+'14' : 'transparent', color:tipo===t.v ? t.color : 'var(--text4)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
              <span>{t.icon}</span>{t.l}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <textarea
            value={testo}
            onChange={e => setTesto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) aggiungi() }}
            placeholder={`Aggiungi una ${tipoInfo(tipo).l.toLowerCase()}... (Ctrl+Enter per salvare)`}
            className="inp"
            rows={2}
            style={{ flex:1, resize:'none' }}
          />
          <button className="btn btn-primary" onClick={aggiungi} disabled={saving || !testo.trim()} style={{ alignSelf:'flex-end', padding:'9px 16px' }}>
            {saving ? <div className="spinner" style={{ width:14, height:14 }}/> : <><Plus size={13}/> Aggiungi</>}
          </button>
        </div>
      </div>

      {/* Lista note */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'30px' }}>
          <div className="spinner"/>
        </div>
      ) : note.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><MessageSquare size={28}/></div>
            <div className="empty-state-title">Nessuna nota</div>
            <div className="empty-state-sub">Aggiungi la prima nota, chiamata o promemoria</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {note.map((n, i) => {
            const t = tipoInfo(n.tipo)
            return (
              <div key={n.id} style={{ display:'flex', gap:14, paddingBottom: i < note.length-1 ? 14 : 0 }}>
                {/* Timeline dot */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:t.color+'14', border:`1px solid ${t.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {t.icon}
                  </div>
                  {i < note.length-1 && <div style={{ width:1.5, flex:1, background:'var(--border)', marginTop:5 }}/>}
                </div>
                {/* Content */}
                <div style={{ flex:1, paddingTop:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:11.5, fontWeight:700, color:t.color, background:t.color+'12', padding:'1px 8px', borderRadius:99, border:`1px solid ${t.color}20` }}>{t.l}</span>
                    <span style={{ fontSize:11.5, color:'var(--text4)' }}>
                      {format(new Date(n.created_at || n.data), "d MMM yyyy 'alle' HH:mm", { locale:it })}
                    </span>
                    <button onClick={() => elimina(n.id)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text4)', opacity:0, display:'flex', transition:'opacity .1s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity=1}
                      onMouseLeave={e => e.currentTarget.style.opacity=0}
                      className="nota-del">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <div style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.65, whiteSpace:'pre-wrap', letterSpacing:'-.01em' }}>{n.testo}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
