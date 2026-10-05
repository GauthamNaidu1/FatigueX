import { RiskLevel, BodyRegion } from '@/types/ergonomics.types';
import type { ErgonomicMetrics } from './postureState';

export interface ErgonomicRiskResult {
  overallScore: number;
  overallStatus: RiskLevel;
  trunkRisk: RiskLevel;
  neckRisk: RiskLevel;
  shoulderRisk: RiskLevel;
  elbowRisk: RiskLevel;
  kneeRisk: RiskLevel;
  contributingFactors: string[];
  timestamp: number;
}

export class ErgonomicRiskEngine {
  private readonly WEIGHTS = {
    TRUNK: 0.30,
    NECK: 0.20,
    SHOULDER: 0.20,
    KNEE: 0.15,
    ELBOW: 0.05,
    DURATION: 0.10, 
  };

  private readonly DURATION_MAX_MS = 60000; 

  calculateRisk(metrics: ErgonomicMetrics): ErgonomicRiskResult {
    let rawScore = 0;
    const contributingFactors: string[] = [];

    const getRegionRisk = (regions: BodyRegion[]) => {
       const levels = regions.map(r => metrics.regionRisks.find(rr => rr.region === r)?.riskLevel || RiskLevel.NORMAL);
       if (levels.includes(RiskLevel.HIGH)) return RiskLevel.HIGH;
       if (levels.includes(RiskLevel.CAUTION)) return RiskLevel.CAUTION;
       return RiskLevel.NORMAL;
    };

    const trunkStatus = getRegionRisk([BodyRegion.TRUNK]);
    const neckStatus = getRegionRisk([BodyRegion.NECK]);
    const shoulderStatus = getRegionRisk([BodyRegion.LEFT_SHOULDER, BodyRegion.RIGHT_SHOULDER]);
    const elbowStatus = getRegionRisk([BodyRegion.LEFT_ELBOW, BodyRegion.RIGHT_ELBOW]);
    const kneeStatus = getRegionRisk([BodyRegion.LEFT_KNEE, BodyRegion.RIGHT_KNEE]);

    const scoreForLevel = (level: RiskLevel, maxPoints: number, message: string) => {
      if (level === RiskLevel.HIGH) {
        contributingFactors.push(message);
        return maxPoints;
      }
      if (level === RiskLevel.CAUTION) {
        return maxPoints * 0.5;
      }
      return 0;
    };

    rawScore += scoreForLevel(trunkStatus, this.WEIGHTS.TRUNK * 100, 'sustained trunk bending');
    rawScore += scoreForLevel(neckStatus, this.WEIGHTS.NECK * 100, 'awkward neck angle');
    rawScore += scoreForLevel(shoulderStatus, this.WEIGHTS.SHOULDER * 100, 'elevated shoulder');
    rawScore += scoreForLevel(kneeStatus, this.WEIGHTS.KNEE * 100, 'deep knee bending/squatting');
    rawScore += scoreForLevel(elbowStatus, this.WEIGHTS.ELBOW * 100, 'extreme elbow flexion');

    const durationRatio = Math.min(metrics.sustainedHighRiskDurationMs / this.DURATION_MAX_MS, 1);
    const durationPoints = durationRatio * (this.WEIGHTS.DURATION * 100);
    rawScore += durationPoints;

    if (durationPoints > (this.WEIGHTS.DURATION * 100 * 0.5)) {
      contributingFactors.push('prolonged posture');
    }

    const overallScore = Math.min(Math.round(rawScore), 100);
    
    let overallStatus: RiskLevel = RiskLevel.NORMAL;
    if (overallScore >= 70 || metrics.sustainedHighRiskDurationMs > this.DURATION_MAX_MS) {
      overallStatus = RiskLevel.HIGH;
    } else if (overallScore >= 35) {
      overallStatus = RiskLevel.CAUTION;
    }

    if (metrics.regionRisks.length > 0 && metrics.regionRisks.every(r => Number.isNaN(r.angle))) {
      return {
        overallScore: 0,
        overallStatus: RiskLevel.NORMAL,
        trunkRisk: RiskLevel.NORMAL,
        neckRisk: RiskLevel.NORMAL,
        shoulderRisk: RiskLevel.NORMAL,
        elbowRisk: RiskLevel.NORMAL,
        kneeRisk: RiskLevel.NORMAL,
        contributingFactors: ['Missing or low-confidence pose data'],
        timestamp: metrics.timestamp,
      };
    }

    return {
      overallScore,
      overallStatus,
      trunkRisk: trunkStatus,
      neckRisk: neckStatus,
      shoulderRisk: shoulderStatus,
      elbowRisk: elbowStatus,
      kneeRisk: kneeStatus,
      contributingFactors,
      timestamp: metrics.timestamp,
    };
  }
}
