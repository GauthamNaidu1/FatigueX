import { type ErgonomicSnapshot, type FatigueSnapshot, RiskLevel, BodyRegion } from '@/types';
import { type MonitoringSession, type SessionSample } from '@/types/session.types';

export class SessionTracker {
  private sessionId: string;
  private startTime: number = 0;
  private lastProcessTime: number = 0;
  private isActive: boolean = false;
  
  // Accumulated data
  private samples: SessionSample[] = [];
  
  // Durations (ms)
  private timeLowRiskMs: number = 0;
  private timeModerateRiskMs: number = 0;
  private timeHighRiskMs: number = 0;
  private trunkExposureMs: number = 0;
  private neckExposureMs: number = 0;
  private shoulderExposureMs: number = 0;
  private recoveryMs: number = 0;
  
  // Tracking max/avg
  private sumErgoRisk: number = 0;
  private maxErgoRisk: number = 0;
  private sumFatigueRisk: number = 0;
  private maxFatigueRisk: number = 0;
  private sampleCount: number = 0;
  
  private postureEventCount: number = 0;
  private repetitionCount: number = 0; // extracted from fatigue
  
  private lastErgoLevel: RiskLevel = RiskLevel.NORMAL;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  start(timestamp: number = Date.now()) {
    this.startTime = timestamp;
    this.lastProcessTime = timestamp;
    this.isActive = true;
  }

  pause() {
    this.isActive = false;
  }

  resume(timestamp: number = Date.now()) {
    this.lastProcessTime = timestamp;
    this.isActive = true;
  }

  process(ergo: ErgonomicSnapshot, fatigue: FatigueSnapshot, timestamp: number) {
    if (!this.isActive) return;
    
    const dtMs = Math.max(0, timestamp - this.lastProcessTime);
    this.lastProcessTime = timestamp;
    
    this.sampleCount++;
    this.sumErgoRisk += ergo.overallScore;
    this.maxErgoRisk = Math.max(this.maxErgoRisk, ergo.overallScore);
    
    this.sumFatigueRisk += fatigue.fatigueRiskScore;
    this.maxFatigueRisk = Math.max(this.maxFatigueRisk, fatigue.fatigueRiskScore);
    
    // Duration Tracking
    if (ergo.overallRiskLevel === RiskLevel.HIGH) {
      this.timeHighRiskMs += dtMs;
    } else if (ergo.overallRiskLevel === RiskLevel.CAUTION) {
      this.timeModerateRiskMs += dtMs;
    } else {
      this.timeLowRiskMs += dtMs;
      this.recoveryMs += dtMs;
    }
    
    // Region exposure tracking
    if (ergo.regionRisks.some(r => r.region === BodyRegion.TRUNK && (r.riskLevel === RiskLevel.HIGH || r.riskLevel === RiskLevel.CAUTION))) {
      this.trunkExposureMs += dtMs;
    }
    if (ergo.regionRisks.some(r => r.region === BodyRegion.NECK && (r.riskLevel === RiskLevel.HIGH || r.riskLevel === RiskLevel.CAUTION))) {
      this.neckExposureMs += dtMs;
    }
    if (ergo.regionRisks.some(r => (r.region === BodyRegion.LEFT_SHOULDER || r.region === BodyRegion.RIGHT_SHOULDER) && (r.riskLevel === RiskLevel.HIGH || r.riskLevel === RiskLevel.CAUTION))) {
      this.shoulderExposureMs += dtMs;
    }
    
    // Event counting
    if (ergo.overallRiskLevel !== RiskLevel.NORMAL && this.lastErgoLevel === RiskLevel.NORMAL) {
      this.postureEventCount++;
    }
    this.lastErgoLevel = ergo.overallRiskLevel;
    
    this.repetitionCount = fatigue.features.repetitionCount || 0;
    
    // Sub-sampling (don't save every frame, maybe every 1 second)
    const elapsedTime = Math.round((timestamp - this.startTime) / 1000);
    if (this.samples.length === 0 || this.samples[this.samples.length - 1].elapsedTime !== elapsedTime) {
      this.samples.push({
        timestamp,
        elapsedTime,
        trunkAngle: ergo.jointAngles.trunkFlexion,
        neckAngle: ergo.jointAngles.neckFlexion,
        shoulderMetric: Math.max(ergo.jointAngles.leftShoulderElevation, ergo.jointAngles.rightShoulderElevation),
        kneeMetric: Math.min(ergo.jointAngles.leftKneeAngle, ergo.jointAngles.rightKneeAngle),
        ergonomicRisk: ergo.overallScore,
        fatigueRisk: fatigue.fatigueRiskScore,
        postureState: ergo.overallRiskLevel,
        recoveryState: fatigue.features.recoveryScore
      });
    }
  }

  generateSummary(endTime: number = performance.now()): MonitoringSession {
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const avgErgo = this.sampleCount > 0 ? Math.round(this.sumErgoRisk / this.sampleCount) : 0;
    const avgFatigue = this.sampleCount > 0 ? Math.round(this.sumFatigueRisk / this.sampleCount) : 0;
    
    const recommendations: string[] = [];
    if (this.trunkExposureMs > 120000) recommendations.push("Reduce prolonged forward bending.");
    if (this.recoveryMs < duration * 0.2 * 1000) recommendations.push("Introduce short recovery periods.");
    if (this.maxFatigueRisk > 70) recommendations.push("Consider task rotation if high exposure persists.");
    if (recommendations.length === 0) recommendations.push("Maintain current good ergonomic practices.");

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      duration,
      averageErgonomicRisk: avgErgo,
      maximumErgonomicRisk: this.maxErgoRisk,
      averageFatigueRisk: avgFatigue,
      maximumFatigueRisk: this.maxFatigueRisk,
      timeLowRisk: Math.round(this.timeLowRiskMs / 1000),
      timeModerateRisk: Math.round(this.timeModerateRiskMs / 1000),
      timeHighRisk: Math.round(this.timeHighRiskMs / 1000),
      trunkExposureDuration: Math.round(this.trunkExposureMs / 1000),
      neckExposureDuration: Math.round(this.neckExposureMs / 1000),
      shoulderExposureDuration: Math.round(this.shoulderExposureMs / 1000),
      recoveryDuration: Math.round(this.recoveryMs / 1000),
      postureEventCount: this.postureEventCount,
      repetitionCount: this.repetitionCount,
      recommendations,
      finalAssessment: this.maxFatigueRisk > 75 ? 'HIGH RISK' : this.maxFatigueRisk > 40 ? 'MODERATE RISK' : 'LOW RISK',
      samples: this.samples
    };
  }
}
