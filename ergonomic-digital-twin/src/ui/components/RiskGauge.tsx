import { type ReactNode } from 'react'
import './RiskGauge.css'

interface RiskGaugeProps {
  score: number       // 0–100
  label?: string
  size?: number       // px diameter
  children?: ReactNode
}

/**
 * Circular risk gauge. Renders an SVG arc from 0–100.
 * Used on the Live Monitor and Analytics screens.
 */
export function RiskGauge({ score, label = 'Risk', size = 120 }: RiskGaugeProps) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const colorVar =
    score >= 70 ? 'var(--color-risk-high)' :
    score >= 40 ? 'var(--color-risk-caution)' :
    'var(--color-risk-normal)'

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="risk-gauge__svg">
        <circle
          className="risk-gauge__track"
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
        />
        <circle
          className="risk-gauge__fill"
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ stroke: colorVar }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="risk-gauge__text">
        <span className="risk-gauge__score" style={{ color: colorVar }}>{Math.round(score)}</span>
        <span className="risk-gauge__label">{label}</span>
      </div>
    </div>
  )
}
