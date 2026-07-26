import type { ReactNode } from 'react'
import { AppLogo } from './AppLogo'

const AUTH_SLOGAN = 'Ride · Improve · Win'

type Props = {
  children: ReactNode
  onBack?: () => void
  backLabel?: string
}

export function AuthBrandMark() {
  return (
    <div className="auth-brand-mark">
      <AppLogo size="2xl" />
      <p className="auth-brand-mark__slogan">{AUTH_SLOGAN}</p>
    </div>
  )
}

export function AuthShell({ children, onBack, backLabel = 'Back' }: Props) {
  return (
    <div className="auth-page">
      <aside className="auth-hero" aria-hidden="false">
        <div className="auth-hero__glow" aria-hidden="true" />
        <AuthBrandMark />
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          {onBack ? (
            <button type="button" className="auth-back" onClick={onBack}>
              ← {backLabel}
            </button>
          ) : null}
          <div className="auth-card__mobile-brand">
            <AuthBrandMark />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
