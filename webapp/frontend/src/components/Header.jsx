import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user } = useAuth()

  const displayName = user
    ? (user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest')
    : 'Guest'
  const role = user ? (user.role || 'LO').toUpperCase() : 'LO'

  return (
    <header className="app-header">
      <div className="header-left">
        <a href="/" className="logo-btn" title="Dashboard">
          <img src="/mbanc-m.png" alt="mbanc" className="logo-img" />
        </a>
        <div className="header-sep"></div>
        <h1 className="app-title">
          <span style={{ color: '#ffffff' }}>mbanc</span>
          <span style={{ color: 'var(--red-2)' }}>.ai</span>
        </h1>
      </div>
      <div className="header-center">Mbanc Internal Command Console</div>
      <div className="header-right">
        <span className="user-info">
          {displayName}
          <span className="user-role">{role}</span>
        </span>
        <a href="https://auth.mbanc.ai/settings" className="btn-settings" title="Account settings">&#9881;</a>
        <a href="/logout" className="btn-logout">Logout</a>
      </div>
    </header>
  )
}
