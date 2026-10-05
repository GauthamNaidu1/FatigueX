import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { MediaPipePoseAdapter } from './MediaPipePoseAdapter';
import { DigitalTwinRenderer } from '@/digitalTwin/DigitalTwinRenderer';
import type { PoseFrame } from '@/types/pose.types';
import type { RegionRisk } from '@/types/ergonomics.types';

export type PoseStatus = 'idle' | 'initializing' | 'ready' | 'error';

export function usePoseEstimation(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  getRisks?: () => RegionRisk[]
) {
  const adapterRef = useRef<MediaPipePoseAdapter | null>(null);
  const rendererRef = useRef<DigitalTwinRenderer | null>(null);
  
  const [status, setStatus] = useState<PoseStatus>('idle');
  const requestRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const latestFrameRef = useRef<PoseFrame | null>(null);

  const initialize = useCallback(async () => {
    try {
      setStatus('initializing');
      const adapter = new MediaPipePoseAdapter();
      await adapter.initialize();
      adapterRef.current = adapter;
      
      if (canvasRef.current) {
        rendererRef.current = new DigitalTwinRenderer(canvasRef.current);
      }
      
      setStatus('ready');
    } catch (e) {
      console.error("Failed to initialize MediaPipe", e);
      setStatus('error');
    }
  }, [canvasRef]);

  const detectFrame = useCallback(() => {
    if (!isRunningRef.current || !adapterRef.current || !videoRef.current) return;
    
    if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      const timestamp = performance.now();
      const frame = adapterRef.current.detectForVideo(videoRef.current, timestamp);
      latestFrameRef.current = frame;
      
      if (rendererRef.current) {
        const risks = getRisks ? getRisks() : undefined;
        rendererRef.current.draw(frame, {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          risks
        });
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [videoRef]);

  const startTracking = useCallback(() => {
    if (status !== 'ready') return;
    if (!rendererRef.current && canvasRef.current) {
      rendererRef.current = new DigitalTwinRenderer(canvasRef.current);
    }
    isRunningRef.current = true;
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [status, detectFrame, canvasRef]);

  const stopTracking = useCallback(() => {
    isRunningRef.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (rendererRef.current) {
       rendererRef.current.clear();
    }
    latestFrameRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
      if (adapterRef.current) {
        adapterRef.current.close();
      }
    };
  }, [stopTracking]);

  return {
    initialize,
    startTracking,
    stopTracking,
    status,
    latestFrameRef,
  };
}
