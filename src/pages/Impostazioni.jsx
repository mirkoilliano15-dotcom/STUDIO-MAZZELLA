import { useAuth } from '../hooks/useAuth'
import { Settings, User, Shield, Info, Database, Cpu, Zap, ChevronRight } from 'lucide-react'

export default function Impostazioni() {
  const { profile, user } = useAuth()

  const systemItems = [
    { label:'Database', value:'Supabase · Connesso', ok:true,  Icon:Database },
    { label:'AI Gemini', value:import.meta.env.VITE_GEMINI_API_KEY ? 'Configurata ✓' : 'Chiave mancante', ok:!!import.meta.env.VITE_GEMINI_API_KEY, Icon:Cpu },
    { label:'Versione app', value:'Studio Mazzella v8.0', ok:null, Icon:Zap },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:640 }}>
      <div>
        <h1 className="page-title">Impostazioni</h1>
        <p style={{ fontSize:12.5, color:'var(--text4)', marginTop:3 }}>Configurazione sistema e profilo utente</p>
      </div>

      {/* Profilo */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--blue-dim)', border:'1px solid var(--blue-glow)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <User size={14} color="var(--blue2)" />
          </div>
          <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em' }}>Profilo utente</span>
        </div>
        <div style={{ padding:'18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Nome',    value:profile?.nome },
            { label:'Cognome', value:profile?.cognome },
            { label:'Ruolo',   value:profile?.ruolo, cap:true },
            { label:'Email',   value:user?.email },
          ].map(f => (
            <div key={f.label} style={{ padding:'12px 14px', background:'var(--bg2)', borderRadius:9, border:'1px solid var(--border)' }}>
              <div className="lbl" style={{ marginBottom:5 }}>{f.label}</div>
              <div style={{ fontSize:13.5, color:'var(--text1)', fontWeight:500, textTransform: f.cap ? 'capitalize':'none', letterSpacing:'-.01em' }}>{f.value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sistema */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'rgba(168,85,247,.1)', border:'1px solid rgba(168,85,247,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={14} color="#d8b4fe" />
          </div>
          <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text1)', letterSpacing:'-.02em' }}>Sistema</span>
        </div>
        <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:4 }}>
          {systemItems.map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', background:'var(--bg2)', borderRadius:9, border:'1px solid var(--border)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <item.Icon size={14} color="var(--text4)" />
              </div>
              <span style={{ fontSize:13, color:'var(--text3)', flex:1, letterSpacing:'-.01em' }}>{item.label}</span>
              <span style={{ fontSize:12.5, fontWeight:600, color: item.ok===false ? '#f87171' : item.ok===true ? '#4ade80' : 'var(--amber2)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="card" style={{ background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.15)', padding:'16px 18px' }}>
        <div style={{ display:'flex', gap:11 }}>
          <Info size={15} color="var(--blue2)" style={{ flexShrink:0, marginTop:1 }} />
          <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>
            <strong style={{ color:'var(--blue2)', letterSpacing:'-.02em' }}>Studio Mazzella Gestionale v8</strong><br/>
            Sistema di gestione interno per pratiche fiscali, rateizzazioni, rottamazioni e clienti.<br/>
            I dati sono salvati su <strong style={{ color:'var(--text2)' }}>Supabase</strong> (cloud sicuro, crittografato).<br/>
            Le note rapide e preferenze UI sono salvate localmente nel browser.
          </div>
        </div>
      </div>
    </div>
  )
}
