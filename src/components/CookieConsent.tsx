import { useEffect, useState } from 'react'
import { readCookieConsent, writeCookieConsent, type CookieConsentChoice } from '../cookieConsent'
import { useI18n } from '../i18n'
import { enableSentryAfterConsent } from '../sentry'

export function CookieConsent() {
  const { messages } = useI18n()
  const c = messages.components.cookieConsent
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readCookieConsent() === null)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('has-cookie-consent', visible)
    return () => {
      document.body.classList.remove('has-cookie-consent')
    }
  }, [visible])

  const choose = (choice: CookieConsentChoice) => {
    writeCookieConsent(choice)
    if (choice === 'all') enableSentryAfterConsent()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-label={c.ariaLabel} aria-live="polite">
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          {c.text}{' '}
          <a href="/privacy" className="cookie-consent__link">
            {c.privacyPolicy}
          </a>
          .
        </p>
        <div className="cookie-consent__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => choose('essential')}>
            {c.essentialOnly}
          </button>
          <button type="button" className="btn btn--gold btn--small" onClick={() => choose('all')}>
            {c.acceptAll}
          </button>
        </div>
      </div>
    </div>
  )
}
