import { FatigueRiskState } from '@/types/fatigue.types';
import { RiskLevel, type ErgonomicSnapshot } from '@/types/ergonomics.types';

export interface FatigueRiskResult {
  fatigueRiskScore: number;
  fatigueRiskLevel: FatigueRiskState;
  exposureDuration: number; // in seconds
  recoveryState: number; // 0 to 1
  contributingFactors: string[];
  confidence: number;
  timestamp: number;
}

export interface FatigueEngineConfig {
  maxRiskScore: number;
  recoveryRatePerSecond: number; // score to subtract per second of recovery
  accumulationRatePerSecond: number; // score to add per second of high risk
  awkwardPostureThreshold: number; // seconds before it starts counting as sustained awkward
  timeOnTaskPenaltyPerMinute: number; // slow creep over time
}

const DEFAULT_CONFIG: FatigueEngineConfig = {
  maxRiskScore: 100,
  recoveryRatePerSecond: 2.0, // recovers relatively quickly for prototype demonstration
  accumulationRatePerSecond: 1.5,
  awkwardPostureThreshold: 5.0, // 5 seconds of bad posture = fatigue accumulation starts
  timeOnTaskPenaltyPerMinute: 0.5,
};

export class FatigueRiskEngine {
  private config: FatigueEngineConfig;
  private currentRiskScore: number = 0;
  private sessionStartTime: number = 0;
  private lastProcessTime: number = 0;
  
  // Tracking
  private continuousAwkwardMs: number = 0;
  private baselinePostureScore: number = -1;
  private repetitionsCount: number = 0;
  private lastTrunkAngle: number = 0;

  constructor(config: Partial<FatigueEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  reset(timestamp: number = 0) {
    this.currentRiskScore = 0;
    this.sessionStartTime = timestamp;
    this.lastProcessTime = timestamp;
    this.continuousAwkwardMs = 0;
    this.baselinePostureScore = -1;
    this.repetitionsCount = 0;
    this.lastTrunkAngle = 0;
  }

  process(ergo: ErgonomicSnapshot, timestamp: number): FatigueRiskResult {
    if (this.sessionStartTime === 0) {
      this.sessionStartTime = timestamp;
      this.lastProcessTime = timestamp;
    }

    const dtSeconds = Math.max(0, (timestamp - this.lastProcessTime) / 1000);
    this.lastProcessTime = timestamp;

    // Time on task
    const timeOnTaskSeconds = (timestamp - this.sessionStartTime) / 1000;
    const timeOnTaskScore = (timeOnTaskSeconds / 60) * this.config.timeOnTaskPenaltyPerMinute;

    // Baseline calculation (first few frames)
    if (this.baselinePostureScore === -1 && ergo.overallScore >= 0) {
      this.baselinePostureScore = ergo.overallScore;
    }

    // Repetitions (simple threshold crossing on trunk)
    const trunkAngle = ergo.jointAngles?.trunkFlexion || 0;
    if (this.lastTrunkAngle < 20 && trunkAngle >= 20) {
      this.repetitionsCount += 1;
    }
    this.lastTrunkAngle = trunkAngle;

    // Accumulation vs Recovery
    let isRecovering = true;
    if (ergo.overallRiskLevel === RiskLevel.HIGH || ergo.overallRiskLevel === RiskLevel.CAUTION) {
      this.continuousAwkwardMs += (dtSeconds * 1000);
      
      if (this.continuousAwkwardMs > (this.config.awkwardPostureThreshold * 1000)) {
        isRecovering = false;
        // Accumulate risk based on severity
        const multiplier = ergo.overallRiskLevel === RiskLevel.HIGH ? 1.0 : 0.5;
        this.currentRiskScore += (this.config.accumulationRatePerSecond * dtSeconds * multiplier);
      }
    } else {
      // Neutral posture -> recovering
      this.continuousAwkwardMs = 0;
      this.currentRiskScore -= (this.config.recoveryRatePerSecond * dtSeconds);
      // Floor the base current risk at 0
      if (this.currentRiskScore < 0) this.currentRiskScore = 0;
    }

    // Apply repetition penalty (prototype simple math)
    const repetitionPenalty = this.repetitionsCount * 0.1;

    // Ensure within bounds (0-100)
    let finalScore = this.currentRiskScore + timeOnTaskScore + repetitionPenalty;
    finalScore = Math.max(0, Math.min(finalScore, this.config.maxRiskScore));

    // Determine State
    let fatigueRiskLevel: FatigueRiskState = FatigueRiskState.LOW;
    if (finalScore >= 75) fatigueRiskLevel = FatigueRiskState.HIGH;
    else if (finalScore >= 50) fatigueRiskLevel = FatigueRiskState.ELEVATED;
    else if (finalScore >= 25) fatigueRiskLevel = FatigueRiskState.MODERATE;

    // Determine contributing factors
    const factors: string[] = [];
    if (this.continuousAwkwardMs > this.config.awkwardPostureThreshold * 1000) {
      factors.push('Sustained awkward posture');
    }
    if (this.repetitionsCount >= 5) {
      factors.push('High repetition count');
    }
    if (timeOnTaskScore > 10) {
      factors.push('Prolonged time-on-task');
    }
    
    // Deterioration
    if (ergo.overallScore > this.baselinePostureScore + 30) {
      factors.push('Posture deterioration from baseline');
    }

    if (factors.length === 0 && finalScore > 20) {
      factors.push('Accumulated strain');
    }

    return {
      fatigueRiskScore: Math.round(finalScore),
      fatigueRiskLevel,
      exposureDuration: Math.round(this.continuousAwkwardMs / 1000),
      recoveryState: isRecovering ? 1.0 : 0.0,
      contributingFactors: factors,
      confidence: 0.85, // Prototype static confidence
      timestamp
    };
  }
}
