import { describe, test, expect } from 'vitest';
import { ErgonomicRiskEngine } from '../../src/ergonomics/riskEngine';
import { RiskLevel, BodyRegion } from '../../src/types/ergonomics.types';
import type { ErgonomicMetrics } from '../../src/ergonomics/postureState';

describe('ErgonomicRiskEngine', () => {
  const engine = new ErgonomicRiskEngine();

  const createMetrics = (regionLevels: { region: BodyRegion, riskLevel: RiskLevel }[], durationMs = 0): ErgonomicMetrics => {
    return {
      timestamp: Date.now(),
      jointAngles: {} as any,
      regionRisks: regionLevels.map(r => ({ region: r.region, riskLevel: r.riskLevel, angle: 0, threshold: { caution: 0, high: 0 }})),
      sustainedHighRiskDurationMs: durationMs,
      movementVariability: 0,
    };
  };

  test('Neutral posture returns 0 score', () => {
    const metrics = createMetrics([
      { region: BodyRegion.TRUNK, riskLevel: RiskLevel.NORMAL },
      { region: BodyRegion.NECK, riskLevel: RiskLevel.NORMAL },
    ]);
    const result = engine.calculateRisk(metrics);
    expect(result.overallScore).toBe(0);
    expect(result.overallStatus).toBe(RiskLevel.NORMAL);
  });

  test('Moderate bending returns CAUTION status for trunk', () => {
    const metrics = createMetrics([
      { region: BodyRegion.TRUNK, riskLevel: RiskLevel.CAUTION },
    ]);
    const result = engine.calculateRisk(metrics);
    expect(result.trunkRisk).toBe(RiskLevel.CAUTION);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  test('Severe bending returns HIGH status and includes contributing factor', () => {
    const metrics = createMetrics([
      { region: BodyRegion.TRUNK, riskLevel: RiskLevel.HIGH },
    ]);
    const result = engine.calculateRisk(metrics);
    expect(result.trunkRisk).toBe(RiskLevel.HIGH);
    expect(result.contributingFactors).toContain('sustained trunk bending');
  });

  test('Prolonged awkward posture increases score and changes status', () => {
    const metrics = createMetrics([
      { region: BodyRegion.LEFT_SHOULDER, riskLevel: RiskLevel.HIGH },
    ], 61000); // Exceeds max duration (60000ms)
    
    const result = engine.calculateRisk(metrics);
    expect(result.overallStatus).toBe(RiskLevel.HIGH);
    expect(result.contributingFactors).toContain('prolonged posture');
    expect(result.overallScore).toBeGreaterThan(20); 
  });

  test('Missing data handled gracefully', () => {
    const metrics: ErgonomicMetrics = {
      timestamp: 100,
      jointAngles: {} as any,
      regionRisks: [{ region: BodyRegion.TRUNK, riskLevel: RiskLevel.NORMAL, angle: NaN, threshold: { caution: 0, high: 0 } }],
      sustainedHighRiskDurationMs: 0,
      movementVariability: 0,
    };
    const result = engine.calculateRisk(metrics);
    expect(result.overallScore).toBe(0);
    expect(result.contributingFactors).toContain('Missing or low-confidence pose data');
  });
});
