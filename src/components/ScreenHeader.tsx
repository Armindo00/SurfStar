import type { ReactNode } from 'react'

type Props = {
  title: string
  onBack?: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button type="button" className="screen-header__back" onClick={onBack} aria-label="Back">
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
