import { useEffect, useRef } from 'react'
import { useAppStore } from '@/state'
import { RiskGauge, StatusBadge, ActionButton } from '@/ui/components'
import { RiskLevel, FatigueRiskState } from '@/types'
import { usePoseEstimation } from '@/pose'
import { useCamera } from '@/camera'
import { ErgonomicsModule, extractJointAngles } from '@/ergonomics'
import { FatigueModule } from '@/fatigue'
import { SessionTracker } from '@/session'
import './LiveMonitorScreen.css'

/**
 * Live Monitor screen (PRD Section 13 — Live Monitor).
 * Camera + twin + risk + body-region status.
 * Camera and pose integration is deferred to Segment 2.
 */

function riskVariant(level: RiskLevel): 'normal' | 'caution' | 'high' {
  if (level === RiskLevel.HIGH) return 'high'
  if (level === RiskLevel.CAUTION) return 'caution'
  return 'normal'
}

function fatigueVariant(state: FatigueRiskState): 'normal' | 'caution' | 'high' {
  if (state === FatigueRiskState.HIGH) return 'high'
  if (state === FatigueRiskState.ELEVATED || state === FatigueRiskState.MODERATE) return 'caution'
  return 'normal'
}

export function LiveMonitorScreen() {
  const {
    isMonitoring,
    session,
    currentErgonomics,
    currentFatigue,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  } = useAppStore()

  const ergo = currentErgonomics
  const fatigue = currentFatigue

  const { videoRef, status: cameraStatus, error: cameraError, startCamera, stopCamera, switchCamera, facingMode, permissionState } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
  )

  const trackerRef = useRef(ErgonomicsModule.createTracker())
  const ergoEngineRef = useRef(ErgonomicsModule.createEngine())
  const fatigueEngineRef = useRef(FatigueModule.createEngine())
  const sessionTrackerRef = useRef<SessionTracker | null>(null)
  const { updateErgonomics, updateFatigue, addSessionSummary } = useAppStore()

  useEffect(() => {
    initPose()
  }, [initPose])

  // UI polling loop for ergonomic calculations
  useEffect(() => {
    if (!isMonitoring) {
      trackerRef.current.reset()
      fatigueEngineRef.current.reset()
      return
    }
    
    const interval = setInterval(() => {
      const frame = latestFrameRef.current
      if (!frame || frame.landmarks.length === 0) return

      const jointAngles = extractJointAngles(frame)
      const metrics = trackerRef.current.processFrame(frame.timestamp, jointAngles)
      
      const ergoRisk = ergoEngineRef.current.calculateRisk(metrics)
      
      const ergoSnapshot = {
        timestamp: frame.timestamp,
        jointAngles: metrics.jointAngles,
        regionRisks: metrics.regionRisks,
        overallScore: ergoRisk.overallScore,
        overallRiskLevel: ergoRisk.overallStatus,
        contributingFactors: ergoRisk.contributingFactors,
      };
      updateErgonomics(ergoSnapshot)

      const fatigueRisk = fatigueEngineRef.current.process(ergoSnapshot, frame.timestamp)
      
      const fatigueSnapshot = {
        timestamp: fatigueRisk.timestamp,
        fatigueRiskLevel: fatigueRisk.fatigueRiskLevel,
        fatigueRiskScore: fatigueRisk.fatigueRiskScore,
        dominantFactor: fatigueRisk.contributingFactors[0] || 'None',
        features: {
          sustainedAwkwardPostureDuration: fatigueRisk.exposureDuration,
          repetitionCount: 0, 
          postureDeteriorationScore: 0,
          movementVariability: metrics.movementVariability,
          timeOnTask: 0,
          recoveryScore: fatigueRisk.recoveryState,
        }
      }
      updateFatigue(fatigueSnapshot)
      
      if (sessionTrackerRef.current) {
        sessionTrackerRef.current.process(ergoSnapshot, fatigueSnapshot, frame.timestamp);
      }
      
    }, 200) // 5 FPS updates to the React UI

    return () => clearInterval(interval)
  }, [isMonitoring, latestFrameRef, updateErgonomics, updateFatigue])

  useEffect(() => {
    if (isMonitoring && cameraStatus === 'idle') {
      startCamera()
    } else if (!isMonitoring && cameraStatus !== 'idle') {
      stopCamera()
    }
  }, [isMonitoring, cameraStatus, startCamera, stopCamera])

  useEffect(() => {
    if (cameraStatus === 'ready' && poseStatus === 'ready' && isMonitoring) {
      startPose()
      if (!sessionTrackerRef.current && session) {
        sessionTrackerRef.current = new SessionTracker(session.id);
        sessionTrackerRef.current.start(performance.now());
      } else if (sessionTrackerRef.current) {
        sessionTrackerRef.current.resume(performance.now());
      }
    } else {
      stopPose()
      if (sessionTrackerRef.current && !isMonitoring && session?.isPaused) {
        sessionTrackerRef.current.pause();
      }
    }
  }, [cameraStatus, poseStatus, isMonitoring, session, startPose, stopPose])

  const handleStopMonitoring = () => {
    endSession();
    if (sessionTrackerRef.current) {
      const summary = sessionTrackerRef.current.generateSummary(performance.now());
      addSessionSummary(summary);
      sessionTrackerRef.current = null;
    }
  };

  return (
    <div className="monitor-screen">
      <div className="monitor-viewport">
        {/* Camera & Pose Status Indicator */}
        <div className="monitor-viewport__status" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {cameraStatus === 'ready' && <StatusBadge label="Camera" value="Live" variant="accent" size="sm" />}
            {cameraStatus === 'starting' && <StatusBadge label="Camera" value="Starting..." variant="caution" size="sm" />}
            {cameraStatus === 'error' && <StatusBadge label="Camera" value="Error" variant="high" size="sm" />}
            
            {cameraStatus === 'ready' && (
              <button 
                onClick={switchCamera} 
                style={{ background: 'var(--color-bg-tertiary)', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', color: 'var(--color-text-primary)' }}
              >
                🔄 Switch
              </button>
            )}
          </div>
          
          {poseStatus === 'initializing' && <StatusBadge label="AI" value="Loading Model" variant="caution" size="sm" />}
          {poseStatus === 'ready' && isMonitoring && cameraStatus === 'ready' && (
            <StatusBadge label="AI" value="Tracking" variant="accent" size="sm" />
          )}
          {poseStatus === 'error' && <StatusBadge label="AI" value="Failed" variant="high" size="sm" />}
        </div>

        {cameraStatus === 'idle' && !isMonitoring && (
          <div className="monitor-viewport__placeholder">
            <span className="monitor-viewport__icon">📷</span>
            <p>Camera feed will appear here</p>
            <p className="monitor-viewport__hint">Tap Start to begin monitoring</p>
          </div>
        )}

        {cameraStatus === 'starting' && (
          <div className="monitor-viewport__placeholder">
            <span className="monitor-viewport__icon">⏳</span>
            <p>Starting camera...</p>
          </div>
        )}

        {cameraStatus === 'error' && (
          <div className="monitor-viewport__placeholder">
            <span className="monitor-viewport__icon">⚠️</span>
            <p>Camera Error</p>
            <p className="monitor-viewport__hint text-error">{cameraError?.message}</p>
          </div>
        )}

        {cameraStatus === 'unsupported' && (
          <div className="monitor-viewport__placeholder">
            <span className="monitor-viewport__icon">❌</span>
            <p>Browser Not Supported</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="monitor-viewport__video"
          autoPlay
          playsInline
          muted
          style={{ display: cameraStatus === 'ready' ? 'block' : 'none', transform: transformStyle }}
        />
        {/* Canvas overlay layer — ready for digital twin rendering */}
        <canvas 
          ref={canvasRef} 
          className="monitor-viewport__canvas" 
          id="twin-canvas" 
          style={{ transform: transformStyle }}
        />
      </div>

      {/* Risk overview bar */}
      <div className="monitor-risk-bar glass">
        <RiskGauge score={ergo?.overallScore ?? 0} label="Ergo Risk" size={80} />
        <div className="monitor-risk-bar__details">
          <StatusBadge
            label="Status"
            value={ergo?.overallRiskLevel ?? RiskLevel.NORMAL}
            variant={riskVariant(ergo?.overallRiskLevel ?? RiskLevel.NORMAL)}
          />
          <StatusBadge
            label="Fatigue"
            value={fatigue?.fatigueRiskLevel ?? FatigueRiskState.LOW}
            variant={fatigueVariant(fatigue?.fatigueRiskLevel ?? FatigueRiskState.LOW)}
          />
        </div>
        <RiskGauge score={fatigue?.fatigueRiskScore ?? 0} label="Fatigue" size={80} />
      </div>

      {ergo?.contributingFactors && ergo.contributingFactors.length > 0 && (
        <div className="monitor-factors card">
          <p className="monitor-factors__title" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Primary Contributors:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
            {ergo.contributingFactors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {fatigue?.dominantFactor && fatigue.dominantFactor !== 'None' && (
        <div className="monitor-factors card" style={{ marginTop: '0.5rem' }}>
          <p className="monitor-factors__title" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fatigue Indicators:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--color-warning)' }}>
            <li>{fatigue.dominantFactor}</li>
          </ul>
        </div>
      )}

      {/* Body-region indicators */}
      <section className="monitor-regions card">
        <h3 className="monitor-regions__title">Body Regions</h3>
        <div className="monitor-regions__grid">
          {ergo?.regionRisks && ergo.regionRisks.length > 0 ? (
            ergo.regionRisks.map((rr) => (
              <StatusBadge
                key={rr.region}
                label={rr.region.replace('_', ' ')}
                value={Number.isNaN(rr.angle) ? "—" : `${Math.round(rr.angle)}°`}
                variant={rr.riskLevel === RiskLevel.HIGH ? 'high' : rr.riskLevel === RiskLevel.CAUTION ? 'caution' : 'normal'}
                size="sm"
              />
            ))
          ) : (
            ['Trunk', 'Neck', 'L. Shoulder', 'R. Shoulder', 'L. Elbow', 'R. Elbow', 'L. Knee', 'R. Knee'].map(
              (region) => (
                <StatusBadge
                  key={region}
                  label={region}
                  value="—"
                  variant="normal"
                  size="sm"
                />
              )
            )
          )}
        </div>
      </section>

      {/* Controls */}
      <div className="monitor-controls">
        {!isMonitoring && !session?.isActive ? (
          <ActionButton variant="primary" size="lg" fullWidth onClick={() => startSession()}>
            ▶ Start Monitoring
          </ActionButton>
        ) : (
          <div className="monitor-controls__row">
            {session?.isPaused ? (
              <ActionButton variant="primary" size="md" onClick={resumeSession}>
                ▶ Resume
              </ActionButton>
            ) : (
              <ActionButton variant="secondary" size="md" onClick={pauseSession}>
                ⏸ Pause
              </ActionButton>
            )}
            <ActionButton variant="danger" size="md" onClick={handleStopMonitoring}>
              ⏹ Stop
            </ActionButton>
          </div>
        )}
      </div>

      {/* Camera Error Display */}
      {cameraError && (
        <div className="card text-danger" style={{ textAlign: 'center', padding: '16px' }}>
          <strong>Camera Access Failed</strong>
          <p style={{ marginTop: '8px' }}>{cameraError.message}</p>
          {cameraError.type === 'InsecureContext' && (
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Please use a secure (HTTPS) connection or localhost.</p>
          )}
        </div>
      )}

      {/* DEV DIAGNOSTICS */}
      {import.meta.env.DEV && (
        <div className="card" style={{ fontSize: '11px', marginTop: '16px', backgroundColor: 'var(--color-bg-tertiary)', fontFamily: 'monospace' }}>
          <h4 style={{ marginBottom: '8px' }}>DEV DIAGNOSTICS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <span>Protocol:</span> <span>{window.location.protocol.toUpperCase().replace(':', '')}</span>
            <span>Secure Context:</span> <span>{window.isSecureContext ? 'YES' : 'NO'}</span>
            <span>MediaDevices:</span> <span>{navigator.mediaDevices ? 'AVAILABLE' : 'UNAVAILABLE'}</span>
            <span>Camera Permission:</span> <span>{permissionState.toUpperCase()}</span>
            <span>Camera Status:</span> <span>{cameraStatus.toUpperCase()}</span>
            <span>Video Ref:</span> <span>{videoRef.current ? 'READY' : 'NOT READY'}</span>
            <span>Pose Model:</span> <span>{poseStatus.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
