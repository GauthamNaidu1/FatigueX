import { type PoseFrame, LandmarkIndex } from '@/types/pose.types';

export class SkeletonRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
  }

  draw(frame: PoseFrame | null, videoWidth: number, videoHeight: number) {
    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!frame || frame.landmarks.length === 0) return;

    const landmarks = frame.landmarks;
    
    // Draw connections (skeleton)
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 4;
    
    const connections = [
      // Torso
      [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
      [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP],
      [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP],
      [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
      // Arms
      [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW],
      [LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST],
      [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW],
      [LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST],
      // Legs
      [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE],
      [LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE],
      [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE],
      [LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE],
      // Head
      [LandmarkIndex.NOSE, LandmarkIndex.LEFT_EAR],
      [LandmarkIndex.NOSE, LandmarkIndex.RIGHT_EAR]
    ];

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      
      if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x * this.canvas.width, p1.y * this.canvas.height);
        this.ctx.lineTo(p2.x * this.canvas.width, p2.y * this.canvas.height);
        this.ctx.stroke();
      }
    });

    // Draw joints
    this.ctx.fillStyle = '#ff0000';
    landmarks.forEach((lm) => {
      if (lm && lm.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.arc(lm.x * this.canvas.width, lm.y * this.canvas.height, 5, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
