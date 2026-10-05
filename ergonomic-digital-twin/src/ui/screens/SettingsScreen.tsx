import { RISK_THRESHOLDS, FATIGUE_CONFIG, PERFORMANCE_CONFIG, ALERT_CONFIG, APP_CONFIG } from '@/config'
import './SettingsScreen.css'

/**
 * Settings screen (PRD Section 13 — Settings).
 * Thresholds, twin style, privacy, debug FPS.
 * Values are read-only display in Segment 1; editing in a later segment.
 */
export function SettingsScreen() {
  return (
    <div className="settings-screen">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Configure thresholds, display, and privacy</p>
      </header>

      {/* Ergonomic Thresholds */}
      <section className="settings-section card">
        <h2 className="settings-section__title">Ergonomic Thresholds (°)</h2>
        <p className="settings-section__hint">Angle thresholds for risk classification</p>
        <div className="settings-thresholds">
          {Object.entries(RISK_THRESHOLDS).map(([region, { caution, high }]) => (
            <div key={region} className="settings-threshold-row">
              <span className="settings-threshold-row__region">
                {region.replace(/_/g, ' ')}
              </span>
              <div className="settings-threshold-row__values">
                <span className="settings-threshold-row__caution">⚡ {caution}°</span>
                <span className="settings-threshold-row__high">🔴 {high}°</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fatigue Configuration */}
      <section className="settings-section card">
        <h2 className="settings-section__title">Fatigue-Risk Engine</h2>
        <div className="settings-kv-list">
          <div className="settings-kv">
            <span>Rolling Window</span>
            <span>{FATIGUE_CONFIG.rollingWindowSeconds}s</span>
          </div>
          <div className="settings-kv">
            <span>Sustained Posture Threshold</span>
            <span>{FATIGUE_CONFIG.sustainedPostureThresholdSec}s</span>
          </div>
          <div className="settings-kv">
            <span>Recovery Decay Rate</span>
            <span>{FATIGUE_CONFIG.recoveryDecayRate}/s</span>
          </div>
          <div className="settings-kv">
            <span>Moderate Threshold</span>
            <span>{FATIGUE_CONFIG.thresholds.moderate}</span>
          </div>
          <div className="settings-kv">
            <span>Elevated Threshold</span>
            <span>{FATIGUE_CONFIG.thresholds.elevated}</span>
          </div>
          <div className="settings-kv">
            <span>High Threshold</span>
            <span>{FATIGUE_CONFIG.thresholds.high}</span>
          </div>
        </div>
      </section>

      {/* Alert Configuration */}
      <section className="settings-section card">
        <h2 className="settings-section__title">Alerts</h2>
        <div className="settings-kv-list">
          <div className="settings-kv">
            <span>High Risk Persistence</span>
            <span>{ALERT_CONFIG.highRiskPersistenceSeconds}s</span>
          </div>
          <div className="settings-kv">
            <span>Alert Cooldown</span>
            <span>{ALERT_CONFIG.alertCooldownSeconds}s</span>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="settings-section card">
        <h2 className="settings-section__title">Performance</h2>
        <div className="settings-kv-list">
          <div className="settings-kv">
            <span>Target FPS</span>
            <span>{PERFORMANCE_CONFIG.targetFps}</span>
          </div>
          <div className="settings-kv">
            <span>Reduced FPS</span>
            <span>{PERFORMANCE_CONFIG.reducedFps}</span>
          </div>
          <div className="settings-kv">
            <span>Max Latency</span>
            <span>{PERFORMANCE_CONFIG.maxLatencyMs}ms</span>
          </div>
          <div className="settings-kv">
            <span>Min Landmark Confidence</span>
            <span>{PERFORMANCE_CONFIG.minLandmarkConfidence}</span>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="settings-section card">
        <h2 className="settings-section__title">Privacy</h2>
        <div className="settings-kv-list">
          <div className="settings-kv">
            <span>On-device processing</span>
            <span className="settings-kv__enabled">✓ Enabled</span>
          </div>
          <div className="settings-kv">
            <span>Video upload</span>
            <span className="settings-kv__disabled">✗ Disabled</span>
          </div>
          <div className="settings-kv">
            <span>Face recognition</span>
            <span className="settings-kv__disabled">✗ Not used</span>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="settings-section card">
        <h2 className="settings-section__title">About</h2>
        <div className="settings-kv-list">
          <div className="settings-kv">
            <span>App</span>
            <span>{APP_CONFIG.fullName}</span>
          </div>
          <div className="settings-kv">
            <span>Version</span>
            <span>{APP_CONFIG.version}</span>
          </div>
          <div className="settings-kv">
            <span>Project</span>
            <span>PSE — Prototype</span>
          </div>
        </div>
      </section>
    </div>
  )
}
