import { useEffect, useState } from 'react'
import { getComplaintsBookUrl } from '../legalConfig'
import { useI18n } from '../i18n'

const STORAGE_KEY = 'surfstar_cookie_consent_v1'

export function CookieConsent() {
  const { messages } = useI18n()
  const c = messages.components.cookieConsent
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== 'accepted') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-label={c.ariaLabel}>
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          {c.text}{' '}
          <a href="/privacy" className="cookie-consent__link">
            {c.privacyPolicy}
          </a>
          .
        </p>
        <div className="cookie-consent__actions">
          <a
            href={getComplaintsBookUrl()}
            className="cookie-consent__link cookie-consent__link--muted"
            target="_blank"
            rel="noopener noreferrer"
          >
            {c.complaintsBook}
          </a>
          <button type="button" className="btn btn--gold btn--small" onClick={accept}>
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
