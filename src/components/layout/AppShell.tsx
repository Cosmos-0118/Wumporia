import { Link, Outlet } from 'react-router-dom'

import { GlobalLoadingOverlay } from '@/components/feedback/GlobalLoadingOverlay'
import { RouteProgress } from '@/components/feedback/RouteProgress'
import { PageTransition } from '@/components/motion/PageTransition'
import { MainNav } from '@/components/navigation/MainNav'

export function AppShell() {
  return (
    <div className="app-shell">
      <RouteProgress />
      <GlobalLoadingOverlay />

      <header className="app-shell__header">
        <div className="app-shell__container app-shell__header-row">
          <Link className="brand" to="/" aria-label="AI Playground Home">
            Wumporia
          </Link>
          <MainNav />
        </div>
      </header>

      <PageTransition>
        <Outlet />
      </PageTransition>

      <footer className="app-shell__footer">
        <div className="app-shell__container app-shell__footer-row">
          <p>AI Playground for algorithm learning and visual reasoning.</p>
          <p>Client-side engine • Modern UX • Step-by-step explainability</p>
        </div>
      </footer>
    </div>
  )
}
