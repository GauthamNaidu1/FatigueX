import { useState, useRef, useCallback, useEffect } from 'react'

export type CameraStatus = 'idle' | 'starting' | 'ready' | 'error' | 'unsupported'

export interface CameraError {
  type: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'SecurityError' | 'InsecureContext' | 'unknown'
  message: string
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<CameraError | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown')

  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    if (!window.isSecureContext) {
      setStatus('error')
      setError({ type: 'InsecureContext', message: 'Camera access requires a secure HTTPS connection.' })
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported')
      setError({ type: 'unknown', message: 'Browser API not supported' })
      return
    }

    try {
      setStatus('starting')
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Error playing video:', e))
          setStatus('ready')
          setFacingMode(mode)
        }
      }
    } catch (err: any) {
      setStatus('error')
      const errName = err.name
      let type: CameraError['type'] = 'unknown'
      let message = err.message || 'Unknown error starting camera'

      if (errName === 'NotAllowedError') {
         type = 'NotAllowedError'
         message = 'Camera permission was denied. Please allow camera access in your browser settings.'
      } else if (errName === 'NotFoundError') {
         type = 'NotFoundError'
         message = 'Camera is unavailable on this device.'
      } else if (errName === 'NotReadableError') {
         type = 'NotReadableError'
         message = 'Camera is already in use by another application.'
      } else if (errName === 'OverconstrainedError') {
         type = 'OverconstrainedError'
         message = 'Camera constraints could not be satisfied.'
      } else if (errName === 'SecurityError') {
         type = 'SecurityError'
         message = 'Security error accessing camera.'
      }

      setError({ type, message })
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  const switchCamera = useCallback(() => {
    stopCamera()
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    startCamera(newMode)
  }, [facingMode, startCamera, stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(result => {
          setPermissionState(result.state)
          result.onchange = () => {
            setPermissionState(result.state)
          }
        })
        .catch(() => {
          setPermissionState('unknown')
        })
    }
  }, [])

  return {
    videoRef,
    status,
    error,
    facingMode,
    permissionState,
    startCamera,
    stopCamera,
    switchCamera
  }
}
