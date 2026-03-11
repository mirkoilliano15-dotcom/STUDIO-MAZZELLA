import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Plus, X, Trash2, Search, ExternalLink, FolderOpen } from 'lucide-react'

const EMPTY = { nome:'', categoria:'', note:'', cliente_id:'', file_nome:'', file_url:'' }
const CATEGORIE = ['730','IVA','F24','Successione','Contratto','Bilancio','Altro']

export default function Documenti() {
  const [docs, setDocs] = useState([])
  const [clienti, setClienti] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data:d },{ data:c }] = await Promise.all([
      supabase.from('documenti').select('*, clienti(ragione_sociale,nome,cognome)').order('created_at',{ascending:false}),
      supabase.from('clienti').select('id,ragione_sociale,nome,cognome').order('ragione_sociale'),
    ])
    setDocs(d||[]); setClienti(c||[])
  }

  async function salva() {
    setSaving(true)
    await supabase.from('documenti').insert([{ ...form, cliente_id:form.cliente_id||null }])
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  async function elimina(id) {
    if (!confirm('Eliminare questo documento?')) return
    await supabase.from('documenti').delete().eq('id',id)
    load()
  }

  const nomeC = d => d.clienti ? (d.clienti.ragione_sociale||`${d.clienti.nome||''} ${d.clienti.cognome||''}`.trim()) : '—'
  const filtered = docs.filter(d => !q || d.nome?.toLowerCase().includes(q.toLowerCase()) || nomeC(d).toLowerCase().includes(q.toLowerCase()))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div>
          <h1 className="page-title">Documenti</h1>
          <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3, letterSpacing:'-.01em' }}>{docs.length} documenti archiviati</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginLeft:'auto' }}><Plus size={14}/> Nuovo documento</button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:420 }}>
        <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text4)', pointerEvents:'none' }} />
        <input className="inp" style={{ paddingLeft:34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca documenti o clienti..." />
        {q && <button onClick={() => setQ('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex' }}><X size={13}/></button>}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th className="th">Documento</th>
              <th className="th">Cliente</th>
              <th className="th">Categoria</th>
              <th className="th">Data</th>
              <th className="th" style={{ width:80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="tr">
                <td className="td">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FileText size={14} color="var(--blue2)" />
                    </div>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.01em' }}>{d.nome}</div>
                      {d.file_nome && <div style={{ fontSize:11, color:'var(--text4)', marginTop:1 }}>{d.file_nome}</div>}
                    </div>
                  </div>
                </td>
                <td className="td" style={{ fontSize:12.5, color:'var(--text3)' }}>{nomeC(d)}</td>
                <td className="td">
                  <span className="badge badge-gray">{d.categoria||'—'}</span>
                </td>
                <td className="td" style={{ fontSize:12, color:'var(--text4)' }}>
                  {new Date(d.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="td">
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding:'4px 8px' }}>
                        <ExternalLink size={12}/>
                      </a>
                    )}
                    <button className="btn btn-red" style={{ padding:'4px 8px' }} onClick={() => elimina(d.id)}><Trash2 size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-state-icon"><FolderOpen size={30}/></div>
                  <div className="empty-state-title">{q ? 'Nessun documento trovato' : 'Nessun documento'}</div>
                  <div className="empty-state-sub">{q ? `Prova con un'altra ricerca` : 'Aggiungi il primo documento'}</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:15.5, fontWeight:700, color:'var(--text1)', letterSpacing:'-.03em' }}>Nuovo documento</h2>
                <p style={{ fontSize:12, color:'var(--text4)', marginTop:2 }}>Archivia un documento cliente</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', display:'flex', borderRadius:6 }}><X size={15}/></button>
            </div>
            <div className="modal-body">
              <div><label className="lbl">Nome documento *</label><input className="inp" autoFocus value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} placeholder="Es. Dichiarazione redditi 2024" /></div>
              <div><label className="lbl">Cliente</label>
                <select className="inp" value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))}>
                  <option value="">— Nessuno —</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale||`${c.nome||''} ${c.cognome||''}`.trim()}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="lbl">Categoria</label>
                  <select className="inp" value={form.categoria} onChange={e => setForm(f=>({...f,categoria:e.target.value}))}>
                    <option value="">— Seleziona —</option>
                    {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Nome file</label><input className="inp" value={form.file_nome} onChange={e => setForm(f=>({...f,file_nome:e.target.value}))} placeholder="documento.pdf" /></div>
              </div>
              <div><label className="lbl">URL / Percorso</label><input className="inp" value={form.file_url} onChange={e => setForm(f=>({...f,file_url:e.target.value}))} placeholder="https://... oppure /percorso/file.pdf" /></div>
              <div><label className="lbl">Note</label><textarea className="inp" rows={2} value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} style={{ resize:'none' }} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={salva} disabled={saving||!form.nome}>
                {saving ? 'Salvo...' : <><Plus size={13}/> Salva documento</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
