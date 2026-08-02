import { SUPPORTED_LOCALES, useI18n, type SupportedLocale } from '../i18n'

type Props = {
  compact?: boolean
}

const LOCALE_LABEL_KEYS: Record<SupportedLocale, `language.${SupportedLocale}`> = {
  en: 'language.en',
  pt: 'language.pt',
  fr: 'language.fr',
  es: 'language.es',
}

export function LanguagePicker({ compact = false }: Props) {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className={`language-picker ${compact ? 'language-picker--compact' : ''}`}>
      {!compact ? (
        <>
          <h2 className="stats-panel__title">{t('language.title')}</h2>
          <p className="muted stats-panel__sub">{t('language.hint')}</p>
        </>
      ) : null}
      <div className="chip-row chip-row--pro language-picker__options" role="radiogroup" aria-label={t('language.title')}>
        {SUPPORTED_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={locale === code}
            className={`chip ${locale === code ? 'chip--active' : ''}`}
            onClick={() => setLocale(code)}
          >
            {t(LOCALE_LABEL_KEYS[code])}
          </button>
        ))}
      </div>
    </div>
  )
}
