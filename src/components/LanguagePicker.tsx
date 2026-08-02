import { useEffect, useId, useRef, useState } from 'react'
import { LOCALE_META } from '../i18n/localeMeta'
import { SUPPORTED_LOCALES, useI18n, type SupportedLocale } from '../i18n'

type Props = {
  /** Nav/header: flag trigger only. Settings: title + wider trigger with language name. */
  compact?: boolean
}

export function LanguagePicker({ compact = false }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = LOCALE_META[locale]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = (code: SupportedLocale) => {
    setLocale(code)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={`language-picker ${compact ? 'language-picker--compact' : 'language-picker--settings'}`}
    >
      {!compact ? (
        <>
          <h2 className="stats-panel__title">{t('language.title')}</h2>
          <p className="muted stats-panel__sub">{t('language.hint')}</p>
        </>
      ) : null}

      <div className="language-picker__control">
        <button
          type="button"
          className="language-picker__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t('language.title')}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="language-picker__flag" aria-hidden="true">
            {current.flag}
          </span>
          {!compact ? (
            <span className="language-picker__current">{t(current.labelKey)}</span>
          ) : null}
          <span className="language-picker__chevron" aria-hidden="true">
            {open ? '▴' : '▾'}
          </span>
        </button>

        {open ? (
          <ul id={listId} className="language-picker__menu" role="listbox" aria-label={t('language.title')}>
            {SUPPORTED_LOCALES.map((code) => {
              const meta = LOCALE_META[code]
              const selected = locale === code
              return (
                <li key={code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={
                      selected
                        ? 'language-picker__option language-picker__option--active'
                        : 'language-picker__option'
                    }
                    onClick={() => pick(code)}
                  >
                    <span className="language-picker__flag" aria-hidden="true">
                      {meta.flag}
                    </span>
                    <span className="language-picker__label">{t(meta.labelKey)}</span>
                    {selected ? (
                      <span className="language-picker__check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
