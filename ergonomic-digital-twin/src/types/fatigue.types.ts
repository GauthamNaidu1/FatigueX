/**
 * Fatigue-risk estimation types.
 * Maps to PRD Section 9 — Fatigue-Risk Estimation.
 * Uses "Fatigue Risk" label, never "Fatigue Detected" (PRD requirement).
 */

/** Fatigue risk state — deliberately uses "risk" not "detected". */
export const FatigueRiskState = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  ELEVATED: 'ELEVATED',
  HIGH: 'HIGH',
} as const

export type FatigueRiskState = (typeof FatigueRiskState)[keyof typeof FatigueRiskState]

/** Individual fatigue-risk contributing features (PRD Section 9). */
export interface FatigueFeatures {
  sustainedAwkwardPostureDuration: number // seconds above posture threshold
  repetitionCount: number // movement-cycle count
  postureDeteriorationScore: number // 0–1 relative to baseline
  movementVariability: number // 0–1 (low = fatigue indicator)
  timeOnTask: number // total session seconds
  recoveryScore: number // 0–1 (higher = more recovery applied)
}

/** Fatigue-risk snapshot at a point in time (PRD Section 15). */
export interface FatigueSnapshot {
  timestamp: number
  fatigueRiskLevel: FatigueRiskState
  fatigueRiskScore: number // 0–100
  features: FatigueFeatures
  dominantFactor: string // Human-readable main contributing factor
}
