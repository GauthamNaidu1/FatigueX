/**
 * Application state store using Zustand.
 * Each domain (session, ergonomics, fatigue, alerts) gets its own slice
 * to keep modules loosely coupled (PRD Section 19 rules).
 */

import { create } from 'zustand'
import type {
  Alert,
  CameraStatus,
  ErgonomicSnapshot,
  FatigueSnapshot,
  WorkerSession,
  SessionSummary
} from '@/types'
import { RiskLevel, FatigueRiskState } from '@/types'

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface AppState {
  // Camera
  cameraStatus: CameraStatus

  // Session
  session: WorkerSession | null
  isMonitoring: boolean
  pastSessions: SessionSummary[]

  // Ergonomics (latest snapshot)
  currentErgonomics: ErgonomicSnapshot | null

  // Fatigue (latest snapshot)
  currentFatigue: FatigueSnapshot | null

  // Alerts
  alerts: Alert[]
  unacknowledgedAlertCount: number

  // UI
  selectedTab: string

  // Actions
  setCameraStatus: (status: CameraStatus) => void
  startSession: (taskType?: string) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  addSessionSummary: (summary: SessionSummary) => void
  updateErgonomics: (snapshot: ErgonomicSnapshot) => void
  updateFatigue: (snapshot: FatigueSnapshot) => void
  addAlert: (alert: Alert) => void
  acknowledgeAlert: (alertId: string) => void
  setSelectedTab: (tab: string) => void
  resetState: () => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const initialErgonomics: ErgonomicSnapshot = {
  timestamp: 0,
  jointAngles: {
    trunkFlexion: 0,
    neckFlexion: 0,
    leftShoulderElevation: 0,
    rightShoulderElevation: 0,
    leftElbowAngle: 0,
    rightElbowAngle: 0,
    leftKneeAngle: 0,
    rightKneeAngle: 0,
  },
  regionRisks: [],
  overallScore: 0,
  overallRiskLevel: RiskLevel.NORMAL,
}

const initialFatigue: FatigueSnapshot = {
  timestamp: 0,
  fatigueRiskLevel: FatigueRiskState.LOW,
  fatigueRiskScore: 0,
  features: {
    sustainedAwkwardPostureDuration: 0,
    repetitionCount: 0,
    postureDeteriorationScore: 0,
    movementVariability: 1,
    timeOnTask: 0,
    recoveryScore: 0,
  },
  dominantFactor: 'None',
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  cameraStatus: 'IDLE' as CameraStatus,
  session: null,
  isMonitoring: false,
  pastSessions: JSON.parse(localStorage.getItem('fatiguex_sessions') || '[]'),
  currentErgonomics: initialErgonomics,
  currentFatigue: initialFatigue,
  alerts: [],
  unacknowledgedAlertCount: 0,
  selectedTab: '/',

  // Actions
  setCameraStatus: (status) => set({ cameraStatus: status }),

  startSession: (taskType = 'general') =>
    set({
      session: {
        id: generateId(),
        startTime: Date.now(),
        endTime: null,
        taskType,
        isActive: true,
        isPaused: false,
      },
      isMonitoring: true,
      alerts: [],
      unacknowledgedAlertCount: 0,
      currentErgonomics: initialErgonomics,
      currentFatigue: initialFatigue,
    }),

  pauseSession: () =>
    set((state) => ({
      session: state.session
        ? { ...state.session, isPaused: true }
        : null,
      isMonitoring: false,
    })),

  resumeSession: () =>
    set((state) => ({
      session: state.session
        ? { ...state.session, isPaused: false }
        : null,
      isMonitoring: true,
    })),

  endSession: () =>
    set((state) => ({
      session: state.session
        ? { ...state.session, endTime: Date.now(), isActive: false }
        : null,
      isMonitoring: false,
    })),

  addSessionSummary: (summary) =>
    set((state) => {
      const newSessions = [summary, ...state.pastSessions];
      localStorage.setItem('fatiguex_sessions', JSON.stringify(newSessions));
      return { pastSessions: newSessions };
    }),

  updateErgonomics: (snapshot) => set({ currentErgonomics: snapshot }),
  updateFatigue: (snapshot) => set({ currentFatigue: snapshot }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unacknowledgedAlertCount: state.unacknowledgedAlertCount + 1,
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
      unacknowledgedAlertCount: Math.max(0, state.unacknowledgedAlertCount - 1),
    })),

  setSelectedTab: (tab) => set({ selectedTab: tab }),

  resetState: () =>
    set({
      session: null,
      isMonitoring: false,
      currentErgonomics: initialErgonomics,
      currentFatigue: initialFatigue,
      alerts: [],
      unacknowledgedAlertCount: 0,
    }),
}))
