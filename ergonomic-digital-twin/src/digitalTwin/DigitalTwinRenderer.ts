import { type PoseFrame, LandmarkIndex } from '@/types/pose.types';
import { type RegionRisk, RiskLevel, BodyRegion } from '@/types/ergonomics.types';
import { ExponentialLandmarkSmoother } from '@/pose/smoothing';

export interface RenderConfig {
  videoWidth: number;
  videoHeight: number;
  risks?: RegionRisk[];
}

export class DigitalTwinRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private smoother: ExponentialLandmarkSmoother;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    // Aggressive smoothing for the digital twin rendering to prevent jitter
    this.smoother = new ExponentialLandmarkSmoother(0.3);
  }

  // Define colors based on risk
  private getRiskColor(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.HIGH: return '#ef4444'; // Red
      case RiskLevel.CAUTION: return '#f59e0b'; // Amber
      case RiskLevel.NORMAL: return '#10b981'; // Green
      default: return '#10b981';
    }
  }

  private getRegionColor(region: BodyRegion, risks?: RegionRisk[]): string {
    if (!risks) return '#10b981';
    const r = risks.find(x => x.region === region);
    return r ? this.getRiskColor(r.riskLevel) : '#10b981';
  }

  draw(rawFrame: PoseFrame | null, config: RenderConfig) {
    if (this.canvas.width !== config.videoWidth || this.canvas.height !== config.videoHeight) {
      this.canvas.width = config.videoWidth;
      this.canvas.height = config.videoHeight;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!rawFrame || rawFrame.landmarks.length === 0) return;

    // Smooth the frame before rendering
    const frame = this.smoother.smooth(rawFrame);
    const landmarks = frame.landmarks;
    const { risks } = config;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Helper to draw a segment (cylinder/line)
    const drawSegment = (i1: number, i2: number, color: string, thickness: number) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x * w, p1.y * h);
        this.ctx.lineTo(p2.x * w, p2.y * h);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
    };

    // Body segments mapped to risk regions
    const trunkColor = this.getRegionColor(BodyRegion.TRUNK, risks);
    drawSegment(LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER, trunkColor, 20);
    drawSegment(LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP, trunkColor, 20);
    drawSegment(LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, trunkColor, 20);
    drawSegment(LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, trunkColor, 20);

    const neckColor = this.getRegionColor(BodyRegion.NECK, risks);
    const nose = landmarks[LandmarkIndex.NOSE];
    const lSh = landmarks[LandmarkIndex.LEFT_SHOULDER];
    const rSh = landmarks[LandmarkIndex.RIGHT_SHOULDER];
    
    if (nose && nose.visibility > 0.5 && lSh && lSh.visibility > 0.5 && rSh && rSh.visibility > 0.5) {
      const midShoulderX = (lSh.x + rSh.x) / 2;
      const midShoulderY = (lSh.y + rSh.y) / 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(midShoulderX * w, midShoulderY * h);
      this.ctx.lineTo(nose.x * w, nose.y * h);
      this.ctx.strokeStyle = neckColor;
      this.ctx.lineWidth = 14;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(nose.x * w, (nose.y * h) - 10, 20, 0, Math.PI * 2);
      this.ctx.fillStyle = neckColor;
      this.ctx.fill();
    }

    const lShColor = this.getRegionColor(BodyRegion.LEFT_SHOULDER, risks);
    const rShColor = this.getRegionColor(BodyRegion.RIGHT_SHOULDER, risks);
    drawSegment(LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW, lShColor, 16);
    drawSegment(LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW, rShColor, 16);

    const lElbowColor = this.getRegionColor(BodyRegion.LEFT_ELBOW, risks);
    const rElbowColor = this.getRegionColor(BodyRegion.RIGHT_ELBOW, risks);
    drawSegment(LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST, lElbowColor, 12);
    drawSegment(LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST, rElbowColor, 12);

    const lKneeColor = this.getRegionColor(BodyRegion.LEFT_KNEE, risks);
    const rKneeColor = this.getRegionColor(BodyRegion.RIGHT_KNEE, risks);
    drawSegment(LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE, lKneeColor, 18);
    drawSegment(LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE, rKneeColor, 18);
    drawSegment(LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE, lKneeColor, 14);
    drawSegment(LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE, rKneeColor, 14);

    // Joints overlay
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const joints = [
      LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
      LandmarkIndex.LEFT_ELBOW, LandmarkIndex.RIGHT_ELBOW,
      LandmarkIndex.LEFT_WRIST, LandmarkIndex.RIGHT_WRIST,
      LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
      LandmarkIndex.LEFT_KNEE, LandmarkIndex.RIGHT_KNEE,
      LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE
    ];
    
    joints.forEach((i) => {
      const lm = landmarks[i];
      if (lm && lm.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.arc(lm.x * w, lm.y * h, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
