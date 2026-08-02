import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

type Props = {
  title: string
  onBack?: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, onBack, right }: Props) {
  const { t } = useI18n()

  return (
    <header className="screen-header">
      {onBack ? (
        <button
          type="button"
          className="screen-header__back"
          onClick={onBack}
          aria-label={t('common.back')}
        >
          ←
        </button>
      ) : (
        <span className="screen-header__spacer" />
      )}
      <h1 className="screen-header__title">{title}</h1>
      <div className="screen-header__right">{right ?? <span className="screen-header__spacer" />}</div>
    </header>
  )
}
