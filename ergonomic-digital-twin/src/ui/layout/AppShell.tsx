import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
}

/**
 * Root layout wrapper. Provides:
 * - Scrollable content area with bottom nav clearance
 * - Persistent bottom navigation
 * - Safe-area handling for mobile notches
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
