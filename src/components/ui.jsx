import { memo } from 'react'

// ── Status Badge ──────────────────────────────────
const STATUS_MAP = {
  // pratiche
  aperta:      { cls: 'badge-blue',   label: 'Aperta' },
  in_corso:    { cls: 'badge-amber',  label: 'In corso' },
  completata:  { cls: 'badge-green',  label: 'Completata' },
  sospesa:     { cls: 'badge-orange', label: 'Sospesa' },
  urgente:     { cls: 'badge-red',    label: 'Urgente' },
  in_attesa:   { cls: 'badge-purple', label: 'In attesa' },
  archiviata:  { cls: 'badge-gray',   label: 'Archiviata' },
  // clienti
  attivo:      { cls: 'badge-green',  label: 'Attivo' },
  inattivo:    { cls: 'badge-gray',   label: 'Inattivo' },
  sospeso:     { cls: 'badge-orange', label: 'Sospeso' },
  // rateizzi
  attiva:      { cls: 'badge-green',  label: 'Attiva' },
  conclusa:    { cls: 'badge-gray',   label: 'Conclusa' },
  decaduta:    { cls: 'badge-red',    label: 'Decaduta' },
  // generic
  bassa:       { cls: 'badge-gray',   label: 'Bassa' },
  normale:     { cls: 'badge-blue',   label: 'Normale' },
  alta:        { cls: 'badge-amber',  label: 'Alta' },
}

export const StatusBadge = memo(({ status, label: customLabel }) => {
  const m = STATUS_MAP[status] || { cls: 'badge-gray', label: status }
  return <span className={`badge ${m.cls}`}>{customLabel || m.label}</span>
})

// ── Stat Card ─────────────────────────────────────
export const StatCard = memo(({ label, value, icon: Icon, color = '#3b82f6', onClick, sub }) => (
  <div
    className="stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '14', border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.05em', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 500, marginTop: 5 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
))

// ── Empty State ───────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="empty-state">
    {Icon && <div className="empty-state-icon"><Icon size={30} /></div>}
    <div className="empty-state-title">{title}</div>
    {subtitle && <div className="empty-state-sub">{subtitle}</div>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
)

// ── Section Header ────────────────────────────────
export const SectionHeader = ({ title, subtitle, icon: Icon, iconColor = 'var(--blue2)', badge, action }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10 }}>
    {Icon && (
      <div style={{ width: 30, height: 30, borderRadius: 8, background: iconColor + '14', border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={iconColor} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', letterSpacing: '-.02em' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1 }}>{subtitle}</div>}
    </div>
    {badge}
    {action}
  </div>
)

export default { StatusBadge, StatCard, EmptyState, SectionHeader }
