/**
 * Ergonomic analysis types.
 * Maps to PRD Section 8 — Ergonomic Analysis Engine.
 */

/** Risk level for individual body regions and overall assessment. */
export const RiskLevel = {
  NORMAL: 'NORMAL',
  CAUTION: 'CAUTION',
  HIGH: 'HIGH',
} as const

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

/** Body regions tracked for ergonomic risk (PRD Section 8). */
export const BodyRegion = {
  TRUNK: 'TRUNK',
  NECK: 'NECK',
  LEFT_SHOULDER: 'LEFT_SHOULDER',
  RIGHT_SHOULDER: 'RIGHT_SHOULDER',
  LEFT_ELBOW: 'LEFT_ELBOW',
  RIGHT_ELBOW: 'RIGHT_ELBOW',
  LEFT_KNEE: 'LEFT_KNEE',
  RIGHT_KNEE: 'RIGHT_KNEE',
} as const

export type BodyRegion = (typeof BodyRegion)[keyof typeof BodyRegion]

/** Computed joint/trunk angles for a single frame. */
export interface JointAngles {
  trunkFlexion: number // degrees from upright
  neckFlexion: number
  leftShoulderElevation: number
  rightShoulderElevation: number
  leftElbowAngle: number
  rightElbowAngle: number
  leftKneeAngle: number
  rightKneeAngle: number
}

/** Risk assessment for one body region. */
export interface RegionRisk {
  region: BodyRegion
  angle: number
  riskLevel: RiskLevel
  threshold: { caution: number; high: number }
}

/** Complete ergonomic snapshot for a single frame (PRD Section 15). */
export interface ErgonomicSnapshot {
  timestamp: number
  jointAngles: JointAngles
  regionRisks: RegionRisk[]
  overallScore: number // 0–100 composite risk score
  overallRiskLevel: RiskLevel
  contributingFactors?: string[]
}
