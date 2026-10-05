import { type ReactNode } from 'react'
import './StatusBadge.css'

interface StatusBadgeProps {
  label: string
  value: string
  variant?: 'normal' | 'caution' | 'high' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function StatusBadge({ label, value, variant = 'normal', size = 'md', icon }: StatusBadgeProps) {
  return (
    <div className={`status-badge status-badge--${variant} status-badge--${size}`}>
      {icon && <span className="status-badge__icon">{icon}</span>}
      <span className="status-badge__label">{label}</span>
      <span className="status-badge__value">{value}</span>
    </div>
  )
}
