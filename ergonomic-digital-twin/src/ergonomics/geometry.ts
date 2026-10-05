import type { Landmark } from '@/types/pose.types';

export function calculateAngle3D(p1: Landmark, p2: Landmark, p3: Landmark): number {
  if (!p1 || !p2 || !p3 || p1.visibility < 0.5 || p2.visibility < 0.5 || p3.visibility < 0.5) {
    return NaN;
  }

  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return NaN;

  const cosTheta = Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

export function calculateTrunkFlexion(
  leftShoulder: Landmark,
  rightShoulder: Landmark,
  leftHip: Landmark,
  rightHip: Landmark
): number {
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
      leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
      leftHip.visibility < 0.5 || rightHip.visibility < 0.5) return NaN;

  const midShoulder: Landmark = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
    visibility: 1
  };

  const midHip: Landmark = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
    visibility: 1
  };

  // Upward vector from hip (MediaPipe Y is downwards, so negative Y is up)
  const verticalUp: Landmark = {
    x: midHip.x,
    y: midHip.y - 1,
    z: midHip.z,
    visibility: 1
  };

  return calculateAngle3D(midShoulder, midHip, verticalUp);
}

export function calculateNeckFlexion(
  leftEar: Landmark,
  rightEar: Landmark,
  leftShoulder: Landmark,
  rightShoulder: Landmark,
  leftHip: Landmark,
  rightHip: Landmark
): number {
  if (!leftEar || !rightEar || !leftShoulder || !rightShoulder || !leftHip || !rightHip ||
      leftEar.visibility < 0.5 || rightEar.visibility < 0.5 || leftShoulder.visibility < 0.5 || 
      rightShoulder.visibility < 0.5 || leftHip.visibility < 0.5 || rightHip.visibility < 0.5) return NaN;

  const midShoulder: Landmark = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
    visibility: 1
  };

  const midHip: Landmark = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
    visibility: 1
  };

  const trunkVectorPoint: Landmark = {
    x: midShoulder.x + (midShoulder.x - midHip.x),
    y: midShoulder.y + (midShoulder.y - midHip.y),
    z: midShoulder.z + (midShoulder.z - midHip.z),
    visibility: 1
  };

  const midEar: Landmark = {
    x: (leftEar.x + rightEar.x) / 2,
    y: (leftEar.y + rightEar.y) / 2,
    z: (leftEar.z + rightEar.z) / 2,
    visibility: 1
  };

  return calculateAngle3D(midEar, midShoulder, trunkVectorPoint);
}
