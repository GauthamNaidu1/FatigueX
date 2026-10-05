import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PoseFrame, Landmark } from '@/types/pose.types';

export class MediaPipePoseAdapter {
  private landmarker: PoseLandmarker | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1
    });
    this.isInitialized = true;
  }

  detectForVideo(video: HTMLVideoElement, timestampMs: number): PoseFrame | null {
    if (!this.landmarker || !this.isInitialized) return null;

    const result = this.landmarker.detectForVideo(video, timestampMs);

    if (result.landmarks && result.landmarks.length > 0) {
      const mpLandmarks = result.landmarks[0];
      const mpWorldLandmarks = result.worldLandmarks[0];

      const landmarks: Landmark[] = mpLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 1
      }));

      const worldLandmarks: Landmark[] = mpWorldLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 1
      }));

      // Average visibility of shoulders, hips, knees
      const keyIndices = [11, 12, 23, 24, 25, 26]; 
      const confidence = keyIndices.reduce((acc, idx) => acc + (landmarks[idx]?.visibility ?? 0), 0) / keyIndices.length;

      return {
        timestamp: timestampMs,
        landmarks,
        worldLandmarks,
        confidence
      };
    }
    
    return null;
  }

  close() {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
      this.isInitialized = false;
    }
  }
}
