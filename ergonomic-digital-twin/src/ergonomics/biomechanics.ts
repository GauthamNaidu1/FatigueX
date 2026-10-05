import { calculateAngle3D, calculateTrunkFlexion, calculateNeckFlexion } from './geometry';
import type { PoseFrame } from '@/types/pose.types';
import type { JointAngles } from '@/types/ergonomics.types';
import { LandmarkIndex } from '@/types/pose.types';

export function extractJointAngles(frame: PoseFrame): JointAngles {
  const wl = frame.worldLandmarks;
  const idx = LandmarkIndex;

  return {
    trunkFlexion: calculateTrunkFlexion(
      wl[idx.LEFT_SHOULDER], wl[idx.RIGHT_SHOULDER],
      wl[idx.LEFT_HIP], wl[idx.RIGHT_HIP]
    ),
    neckFlexion: calculateNeckFlexion(
      wl[idx.LEFT_EAR], wl[idx.RIGHT_EAR],
      wl[idx.LEFT_SHOULDER], wl[idx.RIGHT_SHOULDER],
      wl[idx.LEFT_HIP], wl[idx.RIGHT_HIP]
    ),
    leftShoulderElevation: calculateAngle3D(
      wl[idx.LEFT_HIP], wl[idx.LEFT_SHOULDER], wl[idx.LEFT_ELBOW]
    ),
    rightShoulderElevation: calculateAngle3D(
      wl[idx.RIGHT_HIP], wl[idx.RIGHT_SHOULDER], wl[idx.RIGHT_ELBOW]
    ),
    leftElbowAngle: calculateAngle3D(
      wl[idx.LEFT_SHOULDER], wl[idx.LEFT_ELBOW], wl[idx.LEFT_WRIST]
    ),
    rightElbowAngle: calculateAngle3D(
      wl[idx.RIGHT_SHOULDER], wl[idx.RIGHT_ELBOW], wl[idx.RIGHT_WRIST]
    ),
    leftKneeAngle: calculateAngle3D(
      wl[idx.LEFT_HIP], wl[idx.LEFT_KNEE], wl[idx.LEFT_ANKLE]
    ),
    rightKneeAngle: calculateAngle3D(
      wl[idx.RIGHT_HIP], wl[idx.RIGHT_KNEE], wl[idx.RIGHT_ANKLE]
    ),
  };
}
