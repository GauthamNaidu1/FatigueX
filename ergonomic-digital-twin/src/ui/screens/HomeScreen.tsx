import { useNavigate } from 'react-router-dom'
import { ROUTES, APP_CONFIG } from '@/config'
import { ActionButton } from '@/ui/components'
import { RiskGauge } from '@/ui/components'
import './HomeScreen.css'

/**
 * Home screen (PRD Section 13).
 * Entry point: Start Monitoring, Demo Mode, quick status overview.
 */
export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="home-screen">
      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero__logo">⚡</div>
        <h1 className="home-hero__title">{APP_CONFIG.name}</h1>
        <p className="home-hero__subtitle">{APP_CONFIG.fullName}</p>
        <p className="home-hero__description">
          AI-powered real-time pose tracking, ergonomic risk scoring,
          and fatigue-risk monitoring for safer workplaces.
        </p>
      </header>

      {/* Quick Status Preview */}
      <section className="home-status card">
        <h2 className="home-status__title">Quick Status</h2>
        <div className="home-status__gauges">
          <RiskGauge score={0} label="Ergo Risk" size={100} />
          <RiskGauge score={0} label="Fatigue Risk" size={100} />
        </div>
        <p className="home-status__hint">Start monitoring to see live risk data</p>
      </section>

      {/* Actions */}
      <section className="home-actions">
        <ActionButton
          variant="primary"
          size="lg"
          fullWidth
          icon={<span>📷</span>}
          onClick={() => navigate(ROUTES.LIVE_MONITOR)}
        >
          Start Monitoring
        </ActionButton>

        <ActionButton
          variant="secondary"
          size="md"
          fullWidth
          icon={<span>🎮</span>}
          onClick={() => navigate(ROUTES.LIVE_MONITOR)}
        >
          Demo Mode
        </ActionButton>
      </section>

      {/* Feature Cards */}
      <section className="home-features">
        <div className="home-feature card">
          <span className="home-feature__icon">🦴</span>
          <h3>Live Pose Tracking</h3>
          <p>Real-time body landmark detection via phone camera</p>
        </div>
        <div className="home-feature card">
          <span className="home-feature__icon">🤖</span>
          <h3>Digital Twin</h3>
          <p>Live skeleton overlay that follows worker movements</p>
        </div>
        <div className="home-feature card">
          <span className="home-feature__icon">⚠️</span>
          <h3>Risk Alerts</h3>
          <p>Explainable warnings with recommended actions</p>
        </div>
        <div className="home-feature card">
          <span className="home-feature__icon">🔒</span>
          <h3>Privacy First</h3>
          <p>On-device processing — no video uploaded by default</p>
        </div>
      </section>

      {/* Version */}
      <footer className="home-footer">
        <span>v{APP_CONFIG.version} · PSE Project · Prototype</span>
      </footer>
    </div>
  )
}
