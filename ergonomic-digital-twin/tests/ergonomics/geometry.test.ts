import { describe, test, expect } from 'vitest';
import { calculateAngle3D, calculateTrunkFlexion, calculateNeckFlexion } from '../../src/ergonomics/geometry';
import type { Landmark } from '../../src/types/pose.types';

describe('Geometry Utilities', () => {
  const createLm = (x: number, y: number, z: number, visibility = 1): Landmark => ({ x, y, z, visibility });

  test('calculateAngle3D - 90 degree angle', () => {
    const p1 = createLm(1, 0, 0);
    const p2 = createLm(0, 0, 0);
    const p3 = createLm(0, 1, 0);
    
    const angle = calculateAngle3D(p1, p2, p3);
    expect(angle).toBeCloseTo(90);
  });

  test('calculateAngle3D - 180 degree straight line', () => {
    const p1 = createLm(-1, 0, 0);
    const p2 = createLm(0, 0, 0);
    const p3 = createLm(1, 0, 0);
    
    const angle = calculateAngle3D(p1, p2, p3);
    expect(angle).toBeCloseTo(180);
  });

  test('calculateAngle3D - low visibility returns NaN', () => {
    const p1 = createLm(1, 0, 0, 0.1);
    const p2 = createLm(0, 0, 0, 1);
    const p3 = createLm(0, 1, 0, 1);
    
    const angle = calculateAngle3D(p1, p2, p3);
    expect(Number.isNaN(angle)).toBe(true);
  });

  test('calculateTrunkFlexion - standing straight (0 degrees)', () => {
    const lShoulder = createLm(-0.5, -1, 0);
    const rShoulder = createLm(0.5, -1, 0);
    const lHip = createLm(-0.5, 0, 0);
    const rHip = createLm(0.5, 0, 0);
    
    // Y is downwards, so Y=-1 is "up". 
    // Mid hip is (0,0,0). Mid shoulder is (0,-1,0). Vertical up is (0,-1,0).
    const angle = calculateTrunkFlexion(lShoulder, rShoulder, lHip, rHip);
    expect(angle).toBeCloseTo(0);
  });

  test('calculateTrunkFlexion - bending forward 90 degrees', () => {
    const lShoulder = createLm(-0.5, 0, -1);
    const rShoulder = createLm(0.5, 0, -1);
    const lHip = createLm(-0.5, 0, 0);
    const rHip = createLm(0.5, 0, 0);
    
    // Mid hip (0,0,0). Mid shoulder (0,0,-1). Vertical up (0,-1,0).
    // Angle between Z-axis forward and Y-axis up is 90.
    const angle = calculateTrunkFlexion(lShoulder, rShoulder, lHip, rHip);
    expect(angle).toBeCloseTo(90);
  });
});
