import { useEffect, useState } from 'react'
import { getComplaintsBookUrl } from '../legalConfig'

const STORAGE_KEY = 'surfstar_cookie_consent_v1'

export function CookieConsent() {
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
    <div className="cookie-consent" role="dialog" aria-label="Cookie notice">
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          We use essential cookies and local storage to keep you signed in and save session progress. We do not use
          advertising cookies. See our{' '}
          <a href="/privacy" className="cookie-consent__link">
            Privacy Policy
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
            Livro de reclamações
          </a>
          <button type="button" className="btn btn--gold btn--small" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
