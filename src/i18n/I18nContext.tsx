import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { getMessages } from './messages'
import { detectBrowserLocale, loadStoredLocale, saveStoredLocale } from './localeStore'
import type { MessageCatalog, SupportedLocale } from './types'

type I18nContextValue = {
  locale: SupportedLocale
  messages: MessageCatalog
  setLocale: (locale: SupportedLocale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

let currentLocale: SupportedLocale = loadStoredLocale() ?? detectBrowserLocale()
const listeners = new Set<() => void>()

function subscribeLocale(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshotLocale(): SupportedLocale {
  return currentLocale
}

function resolvePath(messages: MessageCatalog, key: string): string | undefined {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, messages) as string | undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] == null ? '' : String(params[name]),
  )
}

export function getLocale(): SupportedLocale {
  return currentLocale
}

export function setLocaleGlobal(locale: SupportedLocale): void {
  if (locale === currentLocale) return
  currentLocale = locale
  saveStoredLocale(locale)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  listeners.forEach((fn) => fn())
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getSnapshotLocale, getSnapshotLocale)

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleGlobal(next)
  }, [])

  const messages = useMemo(() => getMessages(locale), [locale])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value = resolvePath(messages, key)
      if (typeof value !== 'string') return key
      return interpolate(value, params)
    },
    [messages],
  )

  const value = useMemo(
    (): I18nContextValue => ({ locale, messages, setLocale, t }),
    [locale, messages, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale
}
