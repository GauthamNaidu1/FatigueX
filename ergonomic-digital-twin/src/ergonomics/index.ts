/**
 * Ergonomics analysis module.
 * Calculates joint angles, trunk angles, and region risk levels.
 */

export * from './geometry';
export * from './biomechanics';
export * from './postureState';
export * from './riskEngine';

import { PostureTracker } from './postureState';
import { ErgonomicRiskEngine } from './riskEngine';

export const ErgonomicsModule = {
  createTracker: () => new PostureTracker(),
  createEngine: () => new ErgonomicRiskEngine(),
} as const;

