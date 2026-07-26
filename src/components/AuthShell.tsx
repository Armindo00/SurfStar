import type { ReactNode } from 'react'
import { AppLogo } from './AppLogo'

type Props = {
  children: ReactNode
  onBack?: () => void
  backLabel?: string
  heroEyebrow?: string
  heroTitle: string
  heroSubtitle: string
  heroBullets?: string[]
  cloudMode?: boolean
}

export function AuthShell({
  children,
  onBack,
  backLabel = 'Back',
  heroEyebrow,
  heroTitle,
  heroSubtitle,
  heroBullets = [],
  cloudMode = false,
}: Props) {
  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <div className="auth-hero__glow" aria-hidden="true" />
        <div className="auth-hero__inner">
          <AppLogo size="xl" className="auth-hero__logo" />
          {heroEyebrow ? <p className="auth-hero__eyebrow">{heroEyebrow}</p> : null}
          <h1 className="auth-hero__title">{heroTitle}</h1>
          <p className="auth-hero__subtitle">{heroSubtitle}</p>
          {heroBullets.length > 0 ? (
            <ul className="auth-hero__bullets">
              {heroBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {cloudMode ? (
            <p className="auth-hero__secure">
              Secure cloud sync · use the same login on phone, tablet, and desktop
            </p>
          ) : null}
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          {onBack ? (
            <button type="button" className="auth-back" onClick={onBack}>
              ← {backLabel}
            </button>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  )
}
