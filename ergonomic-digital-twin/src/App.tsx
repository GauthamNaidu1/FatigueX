import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/config'
import { AppShell } from '@/ui/layout'
import { HomeScreen, LiveMonitorScreen, AnalyticsScreen, SettingsScreen, DesktopTestScreen } from '@/ui/screens'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomeScreen />} />
          <Route path={ROUTES.LIVE_MONITOR} element={<LiveMonitorScreen />} />
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsScreen />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsScreen />} />
          <Route path={ROUTES.TEST} element={<DesktopTestScreen />} />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
