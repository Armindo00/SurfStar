import type { SupportedLocale } from './types'

export type LocaleMeta = {
  flag: string
  labelKey: `language.${SupportedLocale}`
}

export const LOCALE_META: Record<SupportedLocale, LocaleMeta> = {
  en: { flag: '🇬🇧', labelKey: 'language.en' },
  pt: { flag: '🇵🇹', labelKey: 'language.pt' },
  fr: { flag: '🇫🇷', labelKey: 'language.fr' },
  es: { flag: '🇪🇸', labelKey: 'language.es' },
}
