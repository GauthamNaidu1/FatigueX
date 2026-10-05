import type { Landmark, PoseFrame } from '@/types/pose.types';

export class ExponentialLandmarkSmoother {
  private alpha: number;
  private previousWorld: Landmark[] | null = null;
  private previousImage: Landmark[] | null = null;

  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  smooth(frame: PoseFrame): PoseFrame {
    if (!this.previousWorld || frame.worldLandmarks.length !== this.previousWorld.length) {
      this.previousWorld = [...frame.worldLandmarks.map(l => ({...l}))];
      this.previousImage = [...frame.landmarks.map(l => ({...l}))];
      return frame;
    }

    const smoothedWorld = frame.worldLandmarks.map((current, i) => {
      const prev = this.previousWorld![i];
      if (current.visibility > 0.2 && prev.visibility > 0.2) {
        return {
          x: prev.x + this.alpha * (current.x - prev.x),
          y: prev.y + this.alpha * (current.y - prev.y),
          z: prev.z + this.alpha * (current.z - prev.z),
          visibility: current.visibility
        };
      }
      return current;
    });

    const smoothedImage = frame.landmarks.map((current, i) => {
      const prev = this.previousImage![i];
      if (current.visibility > 0.2 && prev.visibility > 0.2) {
        return {
          x: prev.x + this.alpha * (current.x - prev.x),
          y: prev.y + this.alpha * (current.y - prev.y),
          z: prev.z + this.alpha * (current.z - prev.z),
          visibility: current.visibility
        };
      }
      return current;
    });

    this.previousWorld = smoothedWorld;
    this.previousImage = smoothedImage;

    return {
      ...frame,
      worldLandmarks: smoothedWorld,
      landmarks: smoothedImage,
    };
  }
}
