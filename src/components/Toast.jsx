import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const ToastCtx = createContext(null)

const ICONS = {
  success: <CheckCircle size={15} color="#4ade80" />,
  error:   <XCircle    size={15} color="#f87171" />,
  info:    <Info       size={15} color="#93c5fd" />,
  warning: <AlertTriangle size={15} color="#fbbf24" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = ++counter.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {ICONS[t.type]}
            <span style={{ flex: 1, fontSize: 13 }}>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text4)', padding: 2, display: 'flex', borderRadius: 5,
            }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
