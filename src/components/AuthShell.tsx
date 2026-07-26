import type { ReactNode } from 'react'
import { AppLogo } from './AppLogo'

type Props = {
  children: ReactNode
  onBack?: () => void
  backLabel?: string
  showTagline?: boolean
}

export function AuthBrandMark({ showTagline = false }: { showTagline?: boolean }) {
  return (
    <div className="auth-brand-mark">
      <AppLogo size="2xl" />
      {showTagline ? (
        <p className="auth-brand-mark__tagline">
          <span className="auth-brand-mark__pre">Get ready to,</span>{' '}
          <span className="auth-brand-mark__slogan">Ride, improve, win!</span>
        </p>
      ) : null}
    </div>
  )
}

export function AuthShell({ children, onBack, backLabel = 'Back', showTagline = false }: Props) {
  return (
    <div className="auth-page">
      <aside className="auth-hero" aria-hidden="false">
        <div className="auth-hero__glow" aria-hidden="true" />
        <AuthBrandMark showTagline={showTagline} />
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          {onBack ? (
            <button type="button" className="auth-back" onClick={onBack}>
              ← {backLabel}
            </button>
          ) : null}
          <div className="auth-card__mobile-brand">
            <AuthBrandMark showTagline={showTagline} />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
