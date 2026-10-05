import { describe, test, expect, beforeEach } from 'vitest';
import { FatigueRiskEngine } from '../../src/fatigue/fatigueEngine';
import { RiskLevel } from '../../src/types/ergonomics.types';
import { FatigueRiskState } from '../../src/types/fatigue.types';

describe('FatigueRiskEngine', () => {
  let engine: FatigueRiskEngine;
  
  beforeEach(() => {
    engine = new FatigueRiskEngine();
  });

  const createErgo = (overallRiskLevel: RiskLevel, trunkFlexion: number = 0, overallScore: number = 0) => ({
    timestamp: Date.now(),
    jointAngles: { trunkFlexion } as any,
    regionRisks: [],
    overallScore,
    overallRiskLevel,
    contributingFactors: [],
  });

  test('Scenario 1: Neutral posture returns low fatigue risk', () => {
    const t0 = 1000;
    const t1 = 2000;
    engine.process(createErgo(RiskLevel.NORMAL), t0);
    const result = engine.process(createErgo(RiskLevel.NORMAL), t1);
    
    expect(result.fatigueRiskLevel).toBe(FatigueRiskState.LOW);
    expect(result.fatigueRiskScore).toBe(0);
  });

  test('Scenario 2: Sustained bending increases fatigue risk', () => {
    let result;
    let time = 1000;
    engine.process(createErgo(RiskLevel.HIGH), time);
    
    // Process for 10 seconds (exceeding 5 sec awkward threshold)
    for(let i = 0; i < 10; i++) {
      time += 1000;
      result = engine.process(createErgo(RiskLevel.HIGH), time);
    }
    
    expect(result?.fatigueRiskScore).toBeGreaterThan(0);
    expect(result?.contributingFactors).toContain('Sustained awkward posture');
  });

  test('Scenario 3: Repeated bending increases risk', () => {
    let result;
    let time = 1000;
    engine.process(createErgo(RiskLevel.NORMAL, 0), time);
    
    for(let i = 0; i < 10; i++) {
      time += 1000;
      // alternate bending
      const bend = i % 2 === 0 ? 30 : 0;
      result = engine.process(createErgo(RiskLevel.NORMAL, bend), time);
    }
    
    expect(result?.fatigueRiskScore).toBeGreaterThan(0);
    expect(result?.contributingFactors).toContain('High repetition count');
  });

  test('Scenario 4: High exposure followed by recovery decreases risk', () => {
    let result;
    let time = 1000;
    
    // Accumulate risk
    for(let i = 0; i < 10; i++) {
      time += 1000;
      engine.process(createErgo(RiskLevel.HIGH), time);
    }
    
    const maxRisk = engine.process(createErgo(RiskLevel.HIGH), time + 1000).fatigueRiskScore;
    
    // Recover
    for(let i = 0; i < 5; i++) {
      time += 1000;
      result = engine.process(createErgo(RiskLevel.NORMAL), time);
    }
    
    expect(result?.fatigueRiskScore).toBeLessThan(maxRisk);
    expect(result?.recoveryState).toBe(1.0);
  });

  test('Scenario 5: Temporary bad posture does not jump to high risk instantly', () => {
    let time = 1000;
    engine.process(createErgo(RiskLevel.NORMAL), time);
    
    // 3 seconds of high risk (under the 5 sec threshold)
    time += 3000;
    const result = engine.process(createErgo(RiskLevel.HIGH), time);
    
    expect(result.fatigueRiskScore).toBe(0); // Hasn't crossed threshold yet
    expect(result.fatigueRiskLevel).toBe(FatigueRiskState.LOW);
  });
});
