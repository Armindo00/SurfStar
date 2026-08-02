import type { MessageCatalog, SupportedLocale } from '../types'
import { en } from './en/index'
import { es } from './es/index'
import { fr } from './fr/index'
import { pt } from './pt/index'

export const MESSAGES: Record<SupportedLocale, MessageCatalog> = {
  en,
  pt,
  fr,
  es,
}

export function getMessages(locale: SupportedLocale): MessageCatalog {
  return MESSAGES[locale] ?? MESSAGES.en
}
