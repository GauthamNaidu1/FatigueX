import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import './ActionButton.css'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  fullWidth?: boolean
}

export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`action-btn action-btn--${variant} action-btn--${size} ${fullWidth ? 'action-btn--full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="action-btn__icon">{icon}</span>}
      {children}
    </button>
  )
}
