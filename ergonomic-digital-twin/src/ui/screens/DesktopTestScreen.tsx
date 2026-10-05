import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/state';
import { ActionButton } from '@/ui/components';
import { RiskLevel, FatigueRiskState } from '@/types';
import { useCamera } from '@/camera';
import { usePoseEstimation } from '@/pose';
import { ErgonomicsModule, extractJointAngles } from '@/ergonomics';
import { FatigueModule } from '@/fatigue';
import { SessionTracker } from '@/session';
import './DesktopTestScreen.css';

export function DesktopTestScreen() {
  const {
    isMonitoring,
    session,
    currentErgonomics: ergo,
    currentFatigue: fatigue,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    addSessionSummary,
    updateErgonomics,
    updateFatigue
  } = useAppStore();

  const { videoRef, status: cameraStatus, startCamera, stopCamera, facingMode } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isMirrored = facingMode === 'user';
  const transformStyle = isMirrored ? 'scaleX(-1)' : 'none';

  const { 
    initialize: initPose, 
    startTracking: startPose, 
    stopTracking: stopPose, 
    status: poseStatus,
    latestFrameRef
  } = usePoseEstimation(
    videoRef, 
    canvasRef, 
    () => useAppStore.getState().currentErgonomics?.regionRisks || []
  );

  const trackerRef = useRef(ErgonomicsModule.createTracker());
  const ergoEngineRef = useRef(ErgonomicsModule.createEngine());
  const fatigueEngineRef = useRef(FatigueModule.createEngine());
  const sessionTrackerRef = useRef<SessionTracker | null>(null);

  const [events, setEvents] = useState<string[]>([]);
  const [fps, setFps] = useState<number>(0);
  const [frameCount, setFrameCount] = useState(0);
  const lastTimeRef = useRef<number>(performance.now());
  const framesSinceLastCalc = useRef(0);

  const addEvent = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents(prev => [`${time} — ${msg}`, ...prev].slice(0, 50));
  }, []);

  // Initialize
  useEffect(() => {
    initPose();
    addEvent('Application initialized');
  }, [initPose, addEvent]);

  // Handle monitoring start/stop logic
  useEffect(() => {
    if (isMonitoring && cameraStatus === 'idle') {
      startCamera();
      addEvent('Monitoring started, requesting camera');
    } else if (!isMonitoring && cameraStatus !== 'idle') {
      stopCamera();
      addEvent('Monitoring stopped');
    }
  }, [isMonitoring, cameraStatus, startCamera, stopCamera, addEvent]);

  useEffect(() => {
    if (cameraStatus === 'ready') addEvent('Camera ready');
    if (cameraStatus === 'error') addEvent('Camera error');
  }, [cameraStatus, addEvent]);

  useEffect(() => {
    if (cameraStatus === 'ready' && poseStatus === 'ready' && isMonitoring) {
      startPose();
      if (!sessionTrackerRef.current && session) {
        sessionTrackerRef.current = new SessionTracker(session.id);
        sessionTrackerRef.current.start(performance.now());
      } else if (sessionTrackerRef.current) {
        sessionTrackerRef.current.resume(performance.now());
      }
      addEvent('Pose tracking started');
    } else {
      stopPose();
      if (sessionTrackerRef.current && !isMonitoring && session?.isPaused) {
        sessionTrackerRef.current.pause();
      }
    }
  }, [cameraStatus, poseStatus, isMonitoring, session, startPose, stopPose, addEvent]);

  // Main UI polling loop for extraction
  useEffect(() => {
    if (!isMonitoring) {
      trackerRef.current.reset();
      fatigueEngineRef.current.reset();
      return;
    }
    
    const interval = setInterval(() => {
      const now = performance.now();
      const frame = latestFrameRef.current;
      
      // Calculate FPS approximately
      framesSinceLastCalc.current++;
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((framesSinceLastCalc.current * 1000) / elapsed));
        framesSinceLastCalc.current = 0;
        lastTimeRef.current = now;
      }

      if (!frame || frame.landmarks.length === 0) {
        return;
      }
      setFrameCount(prev => prev + 1);

      const jointAngles = extractJointAngles(frame);
      const metrics = trackerRef.current.processFrame(frame.timestamp, jointAngles);
      
      const ergoRisk = ergoEngineRef.current.calculateRisk(metrics);
      
      const ergoSnapshot = {
        timestamp: frame.timestamp,
        jointAngles: metrics.jointAngles,
        regionRisks: metrics.regionRisks,
        overallScore: ergoRisk.overallScore,
        overallRiskLevel: ergoRisk.overallStatus,
        contributingFactors: ergoRisk.contributingFactors,
      };
      updateErgonomics(ergoSnapshot);

      const fatigueRiskResult = fatigueEngineRef.current.process(ergoSnapshot, frame.timestamp);
      
      const fatigueSnapshot = {
        timestamp: fatigueRiskResult.timestamp,
        fatigueRiskLevel: fatigueRiskResult.fatigueRiskLevel,
        fatigueRiskScore: fatigueRiskResult.fatigueRiskScore,
        dominantFactor: fatigueRiskResult.contributingFactors[0] || 'None',
        features: {
          sustainedAwkwardPostureDuration: fatigueRiskResult.exposureDuration,
          repetitionCount: 0, 
          postureDeteriorationScore: 0,
          movementVariability: metrics.movementVariability,
          timeOnTask: 0,
          recoveryScore: fatigueRiskResult.recoveryState,
        }
      };
      
      updateFatigue(fatigueSnapshot);
      
      if (sessionTrackerRef.current) {
        sessionTrackerRef.current.process(ergoSnapshot, fatigueSnapshot, frame.timestamp);
      }
      
    }, 200); // 5 updates per second

    return () => clearInterval(interval);
  }, [isMonitoring, latestFrameRef, updateErgonomics, updateFatigue]);

  const handleStopTest = () => {
    endSession();
    if (sessionTrackerRef.current) {
      const summary = sessionTrackerRef.current.generateSummary(performance.now());
      addSessionSummary(summary);
      sessionTrackerRef.current = null;
      addEvent('Session saved to history');
    }
  };

  // Track state changes for logging
  const prevErgoLevel = useRef(ergo?.overallRiskLevel);
  const prevFatigueLevel = useRef(fatigue?.fatigueRiskLevel);

  useEffect(() => {
    if (ergo?.overallRiskLevel && ergo.overallRiskLevel !== prevErgoLevel.current) {
      addEvent(`Ergonomic risk changed to: ${ergo.overallRiskLevel}`);
      prevErgoLevel.current = ergo.overallRiskLevel;
    }
  }, [ergo?.overallRiskLevel, addEvent]);

  useEffect(() => {
    if (fatigue?.fatigueRiskLevel && fatigue.fatigueRiskLevel !== prevFatigueLevel.current) {
      addEvent(`Fatigue risk changed to: ${fatigue.fatigueRiskLevel}`);
      prevFatigueLevel.current = fatigue.fatigueRiskLevel;
    }
  }, [fatigue?.fatigueRiskLevel, addEvent]);

  // Recommendations logic
  const getRecommendation = () => {
    if (fatigue?.fatigueRiskLevel === FatigueRiskState.HIGH) return "Take an immediate micro-break (1-2 mins) and stretch.";
    if (ergo?.overallRiskLevel === RiskLevel.HIGH) return "Adjust posture immediately. Avoid sustained bending.";
    if (ergo?.overallRiskLevel === RiskLevel.CAUTION) return "Check body alignment. Ensure items are in comfortable reach.";
    return "No immediate intervention required.";
  };

  const isPersonDetected = latestFrameRef.current && latestFrameRef.current.landmarks.length > 0;

  return (
    <div className="test-screen">
      <header className="test-header card">
        <h2>WORKER ERGONOMICS TEST MODE</h2>
        <div className="test-controls">
          {!isMonitoring ? (
            <ActionButton variant="primary" onClick={() => { setEvents([]); startSession(); }}>Start Test</ActionButton>
          ) : (
            <>
              {session?.isPaused ? (
                <ActionButton variant="primary" onClick={resumeSession}>Resume</ActionButton>
              ) : (
                <ActionButton variant="secondary" onClick={pauseSession}>Pause</ActionButton>
              )}
              <ActionButton variant="danger" onClick={handleStopTest}>Stop Test</ActionButton>
            </>
          )}
          <ActionButton variant="secondary" onClick={() => window.location.reload()}>Reset Session</ActionButton>
        </div>
      </header>

      <div className="test-grid">
        {/* Left Column - Visuals & Scenarios */}
        <div className="test-col">
          <div className="test-viewports card">
            <div className="test-viewport">
              <h3>Live Camera</h3>
              <div className="viewport-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ display: cameraStatus === 'ready' ? 'block' : 'none', transform: transformStyle }} 
                />
                {cameraStatus !== 'ready' && <div className="placeholder">{cameraStatus}</div>}
              </div>
            </div>
            <div className="test-viewport">
              <h3>Digital Twin</h3>
              <div className="viewport-container">
                <canvas ref={canvasRef} style={{ transform: transformStyle }} />
              </div>
            </div>
          </div>

          <div className="test-scenarios card">
            <h3>Test Scenarios to Perform:</h3>
            <div className="scenario-tags">
              <span className="tag">1. Neutral Posture (Wait 20s)</span>
              <span className="tag">2. Forward Bend (Hold 5s)</span>
              <span className="tag">3. Sustained Bend (Hold 15s)</span>
              <span className="tag">4. Recovery (Stand straight)</span>
              <span className="tag">5. Repetitive Bending (5 times)</span>
              <span className="tag">6. Arm Movement (Reach up)</span>
              <span className="tag">7. Squat (Bend knees)</span>
            </div>
          </div>
        </div>

        {/* Right Column - Data & Metrics */}
        <div className="test-col">
          <div className="test-scores card">
            <div className="score-box">
              <span className="score-label">ERGONOMIC RISK</span>
              <span className={`score-value text-${ergo?.overallRiskLevel?.toLowerCase() || 'normal'}`}>
                {ergo?.overallScore || 0}/100
              </span>
            </div>
            <div className="score-box">
              <span className="score-label">FATIGUE RISK</span>
              <span className={`score-value text-${fatigue?.fatigueRiskLevel?.toLowerCase() || 'normal'}`}>
                {fatigue?.fatigueRiskScore || 0}/100
              </span>
            </div>
            <div className="score-box">
              <span className="score-label">POSTURE STATUS</span>
              <span className="score-value">{ergo?.overallRiskLevel || 'NORMAL'}</span>
            </div>
          </div>

          <div className="test-metrics card">
            <h3>Body Metrics</h3>
            <div className="metrics-grid">
              <span>Trunk: {Math.round(ergo?.jointAngles.trunkFlexion || 0)}°</span>
              <span>Neck: {Math.round(ergo?.jointAngles.neckFlexion || 0)}°</span>
              <span>L. Shoulder: {Math.round(ergo?.jointAngles.leftShoulderElevation || 0)}°</span>
              <span>R. Shoulder: {Math.round(ergo?.jointAngles.rightShoulderElevation || 0)}°</span>
              <span>L. Knee: {Math.round(ergo?.jointAngles.leftKneeAngle || 0)}°</span>
              <span>R. Knee: {Math.round(ergo?.jointAngles.rightKneeAngle || 0)}°</span>
            </div>
          </div>

          <div className="test-factors card">
            <h3>Contributing Factors</h3>
            {ergo?.contributingFactors?.length || fatigue?.dominantFactor !== 'None' ? (
              <ul>
                {ergo?.contributingFactors?.map((f, i) => <li key={`e-${i}`} className="text-danger">{f}</li>)}
                {fatigue?.dominantFactor !== 'None' && <li className="text-warning">{fatigue?.dominantFactor}</li>}
              </ul>
            ) : (
              <p className="text-success">- Neutral alignment<br/>- Normal movement</p>
            )}
          </div>

          <div className="test-recommendation card">
            <h3>Recommendation</h3>
            <p>{getRecommendation()}</p>
          </div>

          <div className="test-raw-info card">
            <h3>Raw / Processed Info</h3>
            <div className="raw-grid">
              <span>Person Detected: {isPersonDetected ? 'Yes' : 'No'}</span>
              <span>Landmarks: {latestFrameRef.current?.landmarks.length || 0}/33</span>
              <span>FPS (UI): {fps}</span>
              <span>Frames Processed: {frameCount}</span>
              <span>Posture Duration: {fatigue?.features.sustainedAwkwardPostureDuration || 0}s</span>
              <span>Mvmt Variability: {(fatigue?.features.movementVariability || 0).toFixed(2)}</span>
              <span>Camera: {cameraStatus}</span>
              <span>AI Engine: {poseStatus}</span>
            </div>
          </div>
          
          <div className="test-logs card">
            <h3>Event Log</h3>
            <div className="log-container">
              {events.map((e, i) => (
                <div key={i} className="log-entry">{e}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
