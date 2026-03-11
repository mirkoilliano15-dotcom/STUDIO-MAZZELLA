import { useState } from 'react'
import { askGemini } from '../lib/supabase'
import { Mail, Sparkles, Copy, Check, ChevronRight, Bot } from 'lucide-react'

const TEMPLATES = [
  { label:'Sollecito pagamento',    icon:'💳', prompt:'Scrivi una email professionale di sollecito pagamento per un cliente di uno studio commercialista italiano. Tono formale ma cordiale.' },
  { label:'Invio documenti',        icon:'📁', prompt:'Scrivi una email professionale per inviare documenti fiscali a un cliente. Includi indicazioni su cosa controllare.' },
  { label:'Scadenza imminente',     icon:'⏰', prompt:'Scrivi una email di avviso scadenza fiscale imminente a un cliente italiano. Tono urgente ma professionale.' },
  { label:'Benvenuto nuovo cliente',icon:'👋', prompt:'Scrivi una email di benvenuto per un nuovo cliente di uno studio commercialista. Spiega i prossimi passi.' },
  { label:'Richiesta documentazione',icon:'📋', prompt:'Scrivi una email professionale per richiedere documentazione a un cliente per la dichiarazione dei redditi.' },
  { label:'Comunicazione AdE',      icon:'🏛️', prompt:'Scrivi una email per informare un cliente di una comunicazione ricevuta dall\'Agenzia delle Entrate e spiegare i prossimi passi.' },
]

export default function EmailAI() {
  const [template, setTemplate] = useState('')
  const [contesto, setContesto] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiato, setCopiato] = useState(false)

  async function genera() {
    setLoading(true)
    const prompt = template + (contesto ? `\n\nDettagli specifici: ${contesto}` : '')
    const ris = await askGemini(prompt, 'Sei un assistente specializzato in comunicazioni professionali per studi commercialisti italiani. Scrivi email chiare, formali e professionali in italiano.')
    setEmail(ris)
    setLoading(false)
  }

  async function copia() {
    await navigator.clipboard.writeText(email)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 2200)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Email AI</h1>
          <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3, letterSpacing:'-.01em' }}>
            Genera email professionali con intelligenza artificiale
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'rgba(168,85,247,.08)', border:'1px solid rgba(168,85,247,.2)' }}>
          <Bot size={13} color="#d8b4fe" />
          <span style={{ fontSize:12, fontWeight:600, color:'#d8b4fe' }}>Powered by Gemini</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:16 }}>

        {/* Pannello configurazione */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border2)' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Template pronti</div>
            </div>
            <div style={{ padding:'8px' }}>
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => setTemplate(t.prompt)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:10,
                    padding:'9px 10px', borderRadius:8,
                    background: template===t.prompt ? 'var(--blue-dim)' : 'transparent',
                    border:`1px solid ${template===t.prompt ? 'var(--blue-glow)' : 'transparent'}`,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                    transition:'all .12s',
                  }}
                  onMouseEnter={e => template!==t.prompt && (e.currentTarget.style.background='var(--bg4)')}
                  onMouseLeave={e => template!==t.prompt && (e.currentTarget.style.background='transparent')}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>
                  <span style={{ fontSize:12.5, fontWeight:500, color: template===t.prompt ? 'var(--blue2)' : 'var(--text2)', flex:1, letterSpacing:'-.01em' }}>{t.label}</span>
                  {template===t.prompt && <ChevronRight size={11} color="var(--blue2)" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="lbl">Oppure descrivi l'email</label>
            <textarea className="inp" rows={3} value={template.startsWith('Scrivi') ? '' : template}
              onChange={e => setTemplate(e.target.value)}
              placeholder="Es. Scrivi una email per informare il cliente Rossi che la sua dichiarazione è pronta..." style={{ resize:'none' }} />
          </div>

          <div>
            <label className="lbl">Contesto aggiuntivo <span style={{ color:'var(--text4)', fontWeight:400, textTransform:'none' }}>(opzionale)</span></label>
            <textarea className="inp" rows={3} value={contesto} onChange={e => setContesto(e.target.value)}
              placeholder="Nome cliente, importo, data, tono desiderato..." style={{ resize:'none' }} />
          </div>

          <button className="btn btn-primary" onClick={genera} disabled={!template||loading} style={{ justifyContent:'center', padding:'10px' }}>
            {loading ? <><span className="spinner" style={{ width:15, height:15 }}/> Generando...</> : <><Sparkles size={14}/> Genera email</>}
          </button>
        </div>

        {/* Output */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:0, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:9 }}>
            <Mail size={14} color="var(--text4)" />
            <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em', flex:1 }}>Email generata</span>
            {email && (
              <button onClick={copia} className={`btn ${copiato ? 'btn-green' : 'btn-outline'}`} style={{ fontSize:12, padding:'5px 12px' }}>
                {copiato ? <><Check size={12}/> Copiata!</> : <><Copy size={12}/> Copia</>}
              </button>
            )}
          </div>
          {email ? (
            <textarea value={email} onChange={e => setEmail(e.target.value)}
              style={{ flex:1, minHeight:440, background:'transparent', border:'none', outline:'none', padding:'16px 18px', color:'var(--text2)', fontSize:13.5, resize:'none', fontFamily:'inherit', lineHeight:1.75 }} />
          ) : (
            <div style={{ flex:1, minHeight:440, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'var(--text4)' }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'var(--bg4)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={22} color="var(--text4)" />
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text3)', letterSpacing:'-.02em' }}>Nessuna email generata</div>
                <div style={{ fontSize:12.5, color:'var(--text4)', marginTop:3 }}>Seleziona un template e clicca "Genera email"</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
