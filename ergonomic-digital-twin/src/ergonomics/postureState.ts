import { RiskLevel, BodyRegion, type RegionRisk, type JointAngles } from '@/types/ergonomics.types';

export const PROTOTYPE_THRESHOLDS = {
  [BodyRegion.TRUNK]: { caution: 20, high: 45 },
  [BodyRegion.NECK]: { caution: 20, high: 45 },
  [BodyRegion.LEFT_SHOULDER]: { caution: 60, high: 90 },
  [BodyRegion.RIGHT_SHOULDER]: { caution: 60, high: 90 },
  [BodyRegion.LEFT_ELBOW]: { caution: 45, high: 160 }, 
  [BodyRegion.RIGHT_ELBOW]: { caution: 45, high: 160 },
  [BodyRegion.LEFT_KNEE]: { caution: 45, high: 90 },
  [BodyRegion.RIGHT_KNEE]: { caution: 45, high: 90 },
} as const;

export function evaluateRegionRisk(region: BodyRegion, angle: number): RegionRisk {
  const threshold = PROTOTYPE_THRESHOLDS[region];
  let riskLevel: RiskLevel = RiskLevel.NORMAL;

  if (Number.isNaN(angle)) {
     return { region, angle, riskLevel: RiskLevel.NORMAL, threshold };
  }

  // Knees and Elbows rest at ~180. 
  if (region === BodyRegion.LEFT_KNEE || region === BodyRegion.RIGHT_KNEE) {
    const deviation = 180 - angle;
    if (deviation >= threshold.high) riskLevel = RiskLevel.HIGH;
    else if (deviation >= threshold.caution) riskLevel = RiskLevel.CAUTION;
  } else if (region === BodyRegion.LEFT_ELBOW || region === BodyRegion.RIGHT_ELBOW) {
    // Elbow is normal at 90-120 typing position. 
    // Extreme flexion (< 45) or extreme extension (> 160) is awkward posture.
    if (angle < threshold.caution || angle > threshold.high) riskLevel = RiskLevel.HIGH;
    else if (angle < 60 || angle > 140) riskLevel = RiskLevel.CAUTION;
  } else {
    if (angle >= threshold.high) riskLevel = RiskLevel.HIGH;
    else if (angle >= threshold.caution) riskLevel = RiskLevel.CAUTION;
  }

  return { region, angle, riskLevel, threshold };
}

export interface ErgonomicMetrics {
  timestamp: number;
  jointAngles: JointAngles;
  regionRisks: RegionRisk[];
  sustainedHighRiskDurationMs: number;
  movementVariability: number;
}

export class PostureTracker {
  private lastTimestamp: number = 0;
  private sustainedHighRiskTime: number = 0;
  private previousAngles: JointAngles | null = null;
  private variabilityAccumulator: number = 0;

  processFrame(timestamp: number, angles: JointAngles): ErgonomicMetrics {
    const dt = this.lastTimestamp ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;

    const regionRisks = [
      evaluateRegionRisk(BodyRegion.TRUNK, angles.trunkFlexion),
      evaluateRegionRisk(BodyRegion.NECK, angles.neckFlexion),
      evaluateRegionRisk(BodyRegion.LEFT_SHOULDER, angles.leftShoulderElevation),
      evaluateRegionRisk(BodyRegion.RIGHT_SHOULDER, angles.rightShoulderElevation),
      evaluateRegionRisk(BodyRegion.LEFT_ELBOW, angles.leftElbowAngle),
      evaluateRegionRisk(BodyRegion.RIGHT_ELBOW, angles.rightElbowAngle),
      evaluateRegionRisk(BodyRegion.LEFT_KNEE, angles.leftKneeAngle),
      evaluateRegionRisk(BodyRegion.RIGHT_KNEE, angles.rightKneeAngle),
    ];

    const hasHighRisk = regionRisks.some(r => r.riskLevel === RiskLevel.HIGH);
    if (hasHighRisk) {
      this.sustainedHighRiskTime += dt;
    } else {
      this.sustainedHighRiskTime = 0;
    }

    let variability = 0;
    if (this.previousAngles) {
      const keys = Object.keys(angles) as (keyof JointAngles)[];
      variability = keys.reduce((sum, key) => {
        const diff = angles[key] - this.previousAngles![key];
        return sum + (Number.isNaN(diff) ? 0 : Math.abs(diff));
      }, 0);
    }
    
    // EMA for variability
    this.variabilityAccumulator = (this.variabilityAccumulator * 0.9) + (variability * 0.1);
    this.previousAngles = angles;

    return {
      timestamp,
      jointAngles: angles,
      regionRisks,
      sustainedHighRiskDurationMs: this.sustainedHighRiskTime,
      movementVariability: this.variabilityAccumulator,
    };
  }

  reset() {
    this.lastTimestamp = 0;
    this.sustainedHighRiskTime = 0;
    this.previousAngles = null;
    this.variabilityAccumulator = 0;
  }
}
