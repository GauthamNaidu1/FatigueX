import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/config'
import './BottomNav.css'

const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: '🏠' },
  { path: ROUTES.LIVE_MONITOR, label: 'Monitor', icon: '📷' },
  { path: ROUTES.ANALYTICS, label: 'Analytics', icon: '📊' },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: '⚙️' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav glass" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
            {isActive && <span className="bottom-nav__indicator" />}
          </button>
        )
      })}
    </nav>
  )
}
