import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Login from './pages/Login'

// Lazy loading per performance
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Clienti        = lazy(() => import('./pages/Clienti'))
const ClienteDettaglio = lazy(() => import('./pages/ClienteDettaglio'))
const Pratiche       = lazy(() => import('./pages/Pratiche'))
const Calendario     = lazy(() => import('./pages/Calendario'))
const Rateizzi       = lazy(() => import('./pages/Rateizzi'))
const Rottamazioni   = lazy(() => import('./pages/Rottamazioni'))
const Cassa          = lazy(() => import('./pages/Cassa'))
const Documenti      = lazy(() => import('./pages/Documenti'))
const AccessiPortali = lazy(() => import('./pages/AccessiPortali'))
const Guide          = lazy(() => import('./pages/Guide'))
const EmailAI        = lazy(() => import('./pages/EmailAI'))
const Notifiche      = lazy(() => import('./pages/Notifiche'))
const Impostazioni   = lazy(() => import('./pages/Impostazioni'))
const Report         = lazy(() => import('./pages/Report'))
const Backup         = lazy(() => import('./pages/Backup'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )
}

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: 'linear-gradient(135deg, var(--blue) 0%, #1d4ed8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>M</span>
      </div>
      <div className="spinner" />
      <div style={{ fontSize: 12, color: 'var(--text4)', letterSpacing: '.02em' }}>Caricamento...</div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="clienti" element={<Suspense fallback={<PageLoader />}><Clienti /></Suspense>} />
        <Route path="clienti/:id" element={<Suspense fallback={<PageLoader />}><ClienteDettaglio /></Suspense>} />
        <Route path="pratiche" element={<Suspense fallback={<PageLoader />}><Pratiche /></Suspense>} />
        <Route path="calendario" element={<Suspense fallback={<PageLoader />}><Calendario /></Suspense>} />
        <Route path="rateizzi" element={<Suspense fallback={<PageLoader />}><Rateizzi /></Suspense>} />
        <Route path="rottamazioni" element={<Suspense fallback={<PageLoader />}><Rottamazioni /></Suspense>} />
        <Route path="cassa" element={<Suspense fallback={<PageLoader />}><Cassa /></Suspense>} />
        <Route path="documenti" element={<Suspense fallback={<PageLoader />}><Documenti /></Suspense>} />
        <Route path="portali" element={<Suspense fallback={<PageLoader />}><AccessiPortali /></Suspense>} />
        <Route path="guide" element={<Suspense fallback={<PageLoader />}><Guide /></Suspense>} />
        <Route path="email-ai" element={<Suspense fallback={<PageLoader />}><EmailAI /></Suspense>} />
        <Route path="notifiche" element={<Suspense fallback={<PageLoader />}><Notifiche /></Suspense>} />
        <Route path="impostazioni" element={<Suspense fallback={<PageLoader />}><Impostazioni /></Suspense>} />
        <Route path="report" element={<Suspense fallback={<PageLoader />}><Report /></Suspense>} />
        <Route path="backup" element={<Suspense fallback={<PageLoader />}><Backup /></Suspense>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
