import type { SupportedLocale } from './types'

const STORAGE_KEY = 'surfstar-locale'

export function loadStoredLocale(): SupportedLocale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'en' || raw === 'pt' || raw === 'fr' || raw === 'es') return raw
    return null
  } catch {
    return null
  }
}

export function saveStoredLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore quota errors */
  }
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'en'
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of languages) {
    const code = tag.toLowerCase().slice(0, 2)
    if (code === 'pt') return 'pt'
    if (code === 'fr') return 'fr'
    if (code === 'es') return 'es'
    if (code === 'en') return 'en'
  }
  return 'en'
}
