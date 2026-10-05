/**
 * Fatigue-risk estimation module.
 * Implements rolling temporal fatigue-risk estimation.
 */

export * from './fatigueEngine';

import { FatigueRiskEngine } from './fatigueEngine';

export const FatigueModule = {
  createEngine: () => new FatigueRiskEngine(),
} as const;
