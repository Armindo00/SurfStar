export type CookieConsentChoice = 'essential' | 'all'

const STORAGE_KEY = 'surfstar_cookie_consent_v2'
/** Legacy key from accept-only banner */
const LEGACY_STORAGE_KEY = 'surfstar_cookie_consent_v1'

export function readCookieConsent(): CookieConsentChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'essential' || value === 'all') return value
    if (localStorage.getItem(LEGACY_STORAGE_KEY) === 'accepted') {
      // Previous accept-only banner → treat as essential (no analytics assumed)
      return 'essential'
    }
  } catch {
    /* ignore */
  }
  return null
}

export function writeCookieConsent(choice: CookieConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === 'all'
}
