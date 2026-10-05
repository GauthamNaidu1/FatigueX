/**
 * Shared utility functions.
 */

import { RiskLevel } from '@/types'

/** Clamp a number to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Format seconds as MM:SS. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/** Map a risk level to a CSS-friendly color token name. */
export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.HIGH:
      return 'var(--color-risk-high)'
    case RiskLevel.CAUTION:
      return 'var(--color-risk-caution)'
    case RiskLevel.NORMAL:
    default:
      return 'var(--color-risk-normal)'
  }
}

/** Generate a unique ID. */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
