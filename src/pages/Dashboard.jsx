import { useState, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Users, FolderOpen, AlertTriangle, CreditCard,
  ChevronRight, Clock, TrendingUp, ArrowUpRight,
  CalendarDays, Landmark, Trash2, CheckCircle2,
  Activity, Zap
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const STATI_COLOR = {
  aperta: '#3b82f6', in_corso: '#f59e0b', completata: '#22c55e',
  sospesa: '#f97316', urgente: '#ef4444', in_attesa: '#a855f7', archiviata: '#64748b',
}
const STATI_LABEL = {
  aperta: 'Aperta', in_corso: 'In corso', completata: 'Completata',
  sospesa: 'Sospesa', urgente: 'Urgente', in_attesa: 'In attesa', archiviata: 'Archiviata',
}

const KpiCard = memo(({ label, value, icon: Icon, color, href, sub, trend }) => {
  const nav = useNavigate()
  return (
    <button className="kpi-card" onClick={() => nav(href)} style={{ width: '100%', border: `1px solid var(--border2)` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color} 0%, transparent 65%)`, opacity: .8 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}22` }}>
          <Icon size={17} color={color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text4)', background: 'var(--bg4)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border2)' }}>
          <ArrowUpRight size={10} />Apri
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.05em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text3)', fontWeight: 500, letterSpacing: '-.01em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color, marginTop: 7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />{sub}
      </div>}
    </button>
  )
})

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg4)', border: '1px solid var(--border3)', borderRadius: 10, padding: '9px 13px', fontSize: 12.5, boxShadow: '0 12px 32px rgba(0,0,0,.5)' }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
          {STATI_LABEL[p.name] || p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const nav = useNavigate()
  const [stats, setStats] = useState({ clienti: 0, pratiche: 0, scadenze: 0, rateizzi: 0 })
  const [scadenze, setScadenze] = useState([])
  const [praticheUrgenti, setPraticheUrgenti] = useState([])
  const [piePratiche, setPiePratiche] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const oggi = new Date().toISOString().split('T')[0]
    const fra7  = new Date(Date.now() + 7  * 86400000).toISOString().split('T')[0]
    const fra14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    const [
      { count: nc }, { count: pc }, { count: sc }, { count: rc },
      { data: scad }, { data: prat },
    ] = await Promise.all([
      supabase.from('clienti').select('*', { count: 'exact', head: true }).eq('stato', 'attivo'),
      supabase.from('pratiche').select('*', { count: 'exact', head: true }).neq('stato', 'completata'),
      supabase.from('scadenze').select('*', { count: 'exact', head: true }).gte('data_scadenza', oggi).lte('data_scadenza', fra7).eq('completata', false),
      supabase.from('rateizzazioni').select('*', { count: 'exact', head: true }).eq('stato', 'attiva'),
      supabase.from('scadenze').select('*, clienti(ragione_sociale,nome,cognome)').gte('data_scadenza', oggi).lte('data_scadenza', fra14).eq('completata', false).order('data_scadenza').limit(8),
      supabase.from('pratiche').select('stato').neq('stato', 'completata').neq('stato', 'archiviata'),
    ])

    setStats({ clienti: nc || 0, pratiche: pc || 0, scadenze: sc || 0, rateizzi: rc || 0 })
    // Pratiche con scadenza oggi o domani
    const fra2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    const { data: pu } = await supabase.from('pratiche').select('id,titolo,stato,data_scadenza,clienti(ragione_sociale,nome,cognome)').gte('data_scadenza', oggi).lte('data_scadenza', fra2).neq('stato','completata').neq('stato','archiviata').order('data_scadenza').limit(5)
    setPraticheUrgenti(pu || [])
    setScadenze(scad || [])
    const counts = {}
    ;(prat || []).forEach(p => { counts[p.stato] = (counts[p.stato] || 0) + 1 })
    setPiePratiche(Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATI_COLOR[name] || '#64748b' })))
    setLoading(false)
  }

  const nomeC = c => c?.ragione_sociale || `${c?.nome||''} ${c?.cognome||''}`.trim() || '—'
  const oggi = new Date()
  const diffDays = d => Math.ceil((new Date(d) - oggi) / 86400000)

  const now = new Date()
  const ora = now.getHours()
  const greeting = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const KPIS = [
    { label: 'Clienti attivi',   value: stats.clienti,   icon: Users,         color: '#3b82f6', href: '/clienti',     sub: stats.clienti > 0 ? `${stats.clienti} in anagrafica` : null },
    { label: 'Pratiche aperte',  value: stats.pratiche,  icon: FolderOpen,    color: '#f59e0b', href: '/pratiche',    sub: stats.pratiche > 0 ? `${stats.pratiche} da gestire` : 'Nessuna aperta' },
    { label: 'Scadenze 7 giorni', value: stats.scadenze, icon: AlertTriangle, color: stats.scadenze > 0 ? '#ef4444' : '#22c55e', href: '/notifiche', sub: stats.scadenze > 0 ? 'Richiedono attenzione' : 'Tutto in ordine' },
    { label: 'Rateizzi attivi',  value: stats.rateizzi,  icon: CreditCard,    color: '#a855f7', href: '/rateizzi',    sub: stats.rateizzi > 0 ? 'Piani in corso' : null },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 14 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <div style={{ fontSize: 12.5, color: 'var(--text4)' }}>Caricamento dashboard...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text4)', fontWeight: 500, marginBottom: 4, letterSpacing: '.01em', textTransform: 'uppercase' }}>
            {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', letterSpacing: '-.04em', lineHeight: 1.15 }}>
            {greeting} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text4)', marginTop: 4, letterSpacing: '-.01em' }}>
            Panoramica dello studio commerciale
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/cassa')} className="btn btn-ghost" style={{ fontSize: 12.5 }}>
            <Landmark size={13} /> Reg. Cassa
          </button>
          <button onClick={() => nav('/pratiche')} className="btn btn-primary" style={{ fontSize: 12.5 }}>
            <Zap size={13} /> Nuova pratica
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {KPIS.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>

        {/* Scadenze */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: stats.scadenze > 0 ? 'var(--red-dim)' : 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${stats.scadenze > 0 ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'}` }}>
              <Clock size={14} color={stats.scadenze > 0 ? '#f87171' : '#4ade80'} />
            </div>
            <div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>Scadenze imminenti</span>
              <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1 }}>Prossimi 14 giorni</div>
            </div>
            {scadenze.length > 0 && <span className="badge badge-red" style={{ marginLeft: 4 }}>{scadenze.length}</span>}
            <button onClick={() => nav('/notifiche')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue2)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              Tutte <ChevronRight size={11} />
            </button>
          </div>

          {scadenze.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle2 size={32} color="#22c55e" style={{ opacity: 1 }} /></div>
              <div className="empty-state-title">Nessuna scadenza nei prossimi 14 giorni</div>
              <div className="empty-state-sub">Lo studio è in regola ✓</div>
            </div>
          ) : scadenze.map((s, i) => {
            const days = diffDays(s.data_scadenza)
            const isUrgent = days <= 2
            const isSoon   = days <= 7
            const col = isUrgent ? '#ef4444' : isSoon ? '#f97316' : '#3b82f6'
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 18px', borderBottom: i < scadenze.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .1s', cursor: 'pointer' }}
                onClick={() => nav('/notifiche')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: col + '12', border: `1px solid ${col}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: col, lineHeight: 1 }}>{new Date(s.data_scadenza).getDate()}</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '.05em' }}>{new Date(s.data_scadenza).toLocaleString('it-IT', { month: 'short' })}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{s.titolo}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 2 }}>{s.clienti ? nomeC(s.clienti) : 'Scadenza generale'}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: col + '12', color: col, border: `1px solid ${col}22`, whiteSpace: 'nowrap' }}>
                  {days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `${days} gg`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Pratiche chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={14} color="var(--text4)" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>Pratiche per stato</span>
          </div>
          {piePratiche.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={128}>
                <PieChart>
                  <Pie data={piePratiche} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value">
                    {piePratiche.map((entry, i) => <Cell key={i} fill={entry.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {piePratiche.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: e.fill, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text3)', flex: 1, letterSpacing: '-.01em' }}>{STATI_LABEL[e.name] || e.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <div className="empty-state-title">Nessuna pratica aperta</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { icon: Landmark, label: 'Reg. Cassa', sub: 'Registra presenze oggi', href: '/cassa', color: '#22c55e' },
          { icon: Trash2Icon, label: 'Rottamazioni', sub: 'Gestisci pratiche', href: '/rottamazioni', color: '#f59e0b' },
          { icon: CalendarDays, label: 'Calendario', sub: 'Scadenze e appuntamenti', href: '/calendario', color: '#a855f7' },
        ].map((q, i) => (
          <button key={i} onClick={() => nav(q.href)} style={{
            display: 'flex', alignItems: 'center', gap: 13, padding: '15px 18px',
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = q.color + '40'; e.currentTarget.style.background = 'var(--bg4)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: q.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${q.color}22`, flexShrink: 0 }}>
              <q.icon size={17} color={q.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>{q.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text4)', marginTop: 2 }}>{q.sub}</div>
            </div>
            <ChevronRight size={14} color="var(--text4)" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Trash2Icon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
}
