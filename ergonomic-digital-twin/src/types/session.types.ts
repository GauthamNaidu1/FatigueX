/**
 * Session and alert types.
 * Maps to PRD Sections 13 and 15 — Session data model and alerts.
 */

import type { RiskLevel } from './ergonomics.types'


/** Alert severity tied to risk persistence (PRD FR-10). */
export const AlertLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const

export type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel]

/** An alert triggered when risk remains above threshold (PRD Section 15). */
export interface Alert {
  id: string
  timestamp: number
  level: AlertLevel
  reason: string // e.g., "Trunk flexion above 45° for 90 seconds"
  recommendation: string // e.g., "Straighten trunk / take recovery break"
  bodyRegion?: string
  acknowledged: boolean
}

/** Monitoring session state (PRD Section 15). */
export interface WorkerSession {
  id: string
  startTime: number
  endTime: number | null
  taskType: string
  isActive: boolean
  isPaused: boolean
}

/** Session sample for time-series charting */
export interface SessionSample {
  timestamp: number
  elapsedTime: number
  trunkAngle: number
  neckAngle: number
  shoulderMetric: number
  kneeMetric: number
  ergonomicRisk: number
  fatigueRisk: number
  postureState: RiskLevel
  recoveryState: number
}

/** Complete session data model */
export interface MonitoringSession {
  sessionId: string
  startTime: number
  endTime: number | null
  duration: number
  averageErgonomicRisk: number
  maximumErgonomicRisk: number
  averageFatigueRisk: number
  maximumFatigueRisk: number
  timeLowRisk: number
  timeModerateRisk: number
  timeHighRisk: number
  trunkExposureDuration: number
  neckExposureDuration: number
  shoulderExposureDuration: number
  recoveryDuration: number
  postureEventCount: number
  repetitionCount: number
  recommendations: string[]
  finalAssessment: string
  samples: SessionSample[]
}

/** Post-session summary (PRD Section 15, FR-12). */
export interface SessionSummary extends MonitoringSession {}

/** Camera permission and hardware state. */
export const CameraStatus = {
  IDLE: 'IDLE',
  REQUESTING: 'REQUESTING',
  ACTIVE: 'ACTIVE',
  DENIED: 'DENIED',
  ERROR: 'ERROR',
} as const

export type CameraStatus = (typeof CameraStatus)[keyof typeof CameraStatus]
