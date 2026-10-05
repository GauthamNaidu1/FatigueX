/**
 * Centralized application configuration.
 * All thresholds are configurable as required by the PRD (Section 8).
 * Calibrate during controlled testing — no single threshold
 * should be treated as a clinical definition (PRD Section 8).
 */

import { BodyRegion } from '@/types'

// ─── Risk Thresholds (degrees) ───────────────────────────────────────────────
// Each body region has a caution and high threshold.
// Values below caution → NORMAL, between caution and high → CAUTION, above high → HIGH.

export const RISK_THRESHOLDS: Record<BodyRegion, { caution: number; high: number }> = {
  [BodyRegion.TRUNK]:           { caution: 20, high: 45 },
  [BodyRegion.NECK]:            { caution: 15, high: 30 },
  [BodyRegion.LEFT_SHOULDER]:   { caution: 45, high: 90 },
  [BodyRegion.RIGHT_SHOULDER]:  { caution: 45, high: 90 },
  [BodyRegion.LEFT_ELBOW]:      { caution: 45, high: 90 },
  [BodyRegion.RIGHT_ELBOW]:     { caution: 45, high: 90 },
  [BodyRegion.LEFT_KNEE]:       { caution: 30, high: 60 },
  [BodyRegion.RIGHT_KNEE]:      { caution: 30, high: 60 },
}

// ─── Risk Score Weights ──────────────────────────────────────────────────────
// Composite risk = weighted sum of posture + duration + repetition (PRD Section 8).

export const RISK_WEIGHTS = {
  posture: 0.5,
  duration: 0.3,
  repetition: 0.2,
} as const

// ─── Fatigue-Risk Configuration (PRD Section 9) ─────────────────────────────

export const FATIGUE_CONFIG = {
  rollingWindowSeconds: 300,       // 5-minute rolling window
  sustainedPostureThresholdSec: 60, // seconds of awkward posture before contributing
  recoveryDecayRate: 0.02,          // score reduction per second during recovery
  thresholds: {
    moderate: 25,
    elevated: 50,
    high: 75,
  },
} as const

// ─── Alert Configuration (PRD FR-10) ────────────────────────────────────────

export const ALERT_CONFIG = {
  highRiskPersistenceSeconds: 30,   // seconds of HIGH risk before alert fires
  alertCooldownSeconds: 120,         // minimum gap between repeated alerts
} as const

// ─── Performance Configuration (PRD Section 14) ─────────────────────────────

export const PERFORMANCE_CONFIG = {
  targetFps: 30,
  reducedFps: 15,
  maxLatencyMs: 250,
  minLandmarkConfidence: 0.5,
} as const

// ─── Application Metadata ───────────────────────────────────────────────────

export const APP_CONFIG = {
  name: 'FatigueX',
  fullName: 'Ergonomic Digital Twin',
  version: '0.1.0',
  description: 'AI-powered worker ergonomics and fatigue-risk monitoring',
} as const

// ─── Route Paths ────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: '/',
  LIVE_MONITOR: '/monitor',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  TEST: '/test',
} as const
