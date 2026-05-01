import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DebugPanel } from './components/DebugPanel'
import { AIAssistant } from './components/AIAssistant'
import { useStore } from './lib/store'
import { dbg } from './lib/debug'

const Pipeline = lazy(() => import('./routes/Pipeline').then(m => ({ default: m.Pipeline })))
const Directory = lazy(() => import('./routes/Directory').then(m => ({ default: m.Directory })))
const Activity = lazy(() => import('./routes/Activity').then(m => ({ default: m.Activity })))
const Library = lazy(() => import('./routes/Library').then(m => ({ default: m.Library })))
const Webinars = lazy(() => import('./routes/Webinars').then(m => ({ default: m.Webinars })))

function LoadingFallback() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-secondary rounded w-1/3" />
        <div className="h-4 bg-secondary rounded w-2/3" />
        <div className="h-64 bg-secondary rounded" />
      </div>
    </div>
  )
}

function App() {
  const theme = useStore(s => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    dbg.info('app', 'mounted', { theme })
  }, [theme])

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppShell>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Pipeline />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/library" element={<Library />} />
              <Route path="/webinars" element={<Webinars />} />
            </Routes>
          </Suspense>
        </AppShell>
        <AIAssistant />
        <DebugPanel />
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
