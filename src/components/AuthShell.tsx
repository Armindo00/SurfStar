import type { ReactNode } from 'react'
import { AppLogo } from './AppLogo'
import { LanguagePicker } from './LanguagePicker'
import { useI18n } from '../i18n'

type Props = {
  children: ReactNode
  onBack?: () => void
  backLabel?: string
  showTagline?: boolean
}

export function AuthBrandMark({ showTagline = false }: { showTagline?: boolean }) {
  const { messages } = useI18n()
  const s = messages.components.authShell

  return (
    <div className="auth-brand-mark">
      <AppLogo size="2xl" />
      {showTagline ? (
        <div className="auth-brand-mark__copy">
          <p className="auth-brand-mark__lead">{s.taglineLead}</p>
          <p className="auth-brand-mark__slogan">{s.taglineSlogan}</p>
        </div>
      ) : null}
    </div>
  )
}

export function AuthShell({ children, onBack, backLabel, showTagline = false }: Props) {
  const { t } = useI18n()

  return (
    <div className="auth-page">
      <aside className="auth-hero" aria-hidden="false">
        <div className="auth-hero__glow" aria-hidden="true" />
        <AuthBrandMark showTagline={showTagline} />
      </aside>

      <main className="auth-panel">
        <div className="auth-panel__language">
          <LanguagePicker compact />
        </div>
        <div className="auth-card">
          {onBack ? (
            <button type="button" className="auth-back" onClick={onBack}>
              ← {backLabel ?? t('common.back')}
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
