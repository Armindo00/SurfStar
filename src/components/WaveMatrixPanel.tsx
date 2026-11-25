import { useI18n } from '../i18n'
import type { WaveMatrixCounts } from '../sessionStats'

type Props = {
  matrix: WaveMatrixCounts
  totalWaves: number
  title?: string
}

function cellPercent(count: number, total: number): string {
  if (!total) return '—'
  return `${Math.round((count / total) * 100)}%`
}

export function WaveMatrixPanel({ matrix, totalWaves, title }: Props) {
  const { t } = useI18n()
  const heading = title ?? t('analytics.topicSheet.waveMatrix')

  const cells = [
    {
      key: 'ps',
      label: `${t('session.register.withPotential')} · ${t('session.register.surfed')}`,
      value: matrix.potentialSurfed,
      accent: true,
    },
    {
      key: 'pw',
      label: `${t('session.register.withPotential')} · ${t('session.register.wasted')}`,
      value: matrix.potentialWasted,
      accent: false,
    },
    {
      key: 'ns',
      label: `${t('session.register.noPotential')} · ${t('session.register.surfed')}`,
      value: matrix.noPotentialSurfed,
      accent: false,
    },
    {
      key: 'nw',
      label: `${t('session.register.noPotential')} · ${t('session.register.wasted')}`,
      value: matrix.noPotentialWasted,
      accent: false,
    },
  ]

  return (
    <section className="wave-matrix ss-card stats-panel">
      <h2 className="stats-panel__title">{heading}</h2>
      <p className="muted stats-panel__sub">{t('analytics.topicSheet.waveMatrixSubtitle')}</p>

      <div className="wave-matrix__table" role="table" aria-label={heading}>
        <div className="wave-matrix__head" role="row">
          <span role="columnheader" />
          <span role="columnheader">{t('session.register.surfed')}</span>
          <span role="columnheader">{t('session.register.wasted')}</span>
        </div>
        <div className="wave-matrix__row" role="row">
          <span className="wave-matrix__row-label" role="rowheader">
            {t('session.register.withPotential')}
          </span>
          <div
            className="wave-matrix__cell wave-matrix__cell--accent"
            role="cell"
          >
            <strong>{matrix.potentialSurfed}</strong>
            <small>{cellPercent(matrix.potentialSurfed, totalWaves)}</small>
          </div>
          <div className="wave-matrix__cell" role="cell">
            <strong>{matrix.potentialWasted}</strong>
            <small>{cellPercent(matrix.potentialWasted, totalWaves)}</small>
          </div>
        </div>
        <div className="wave-matrix__row" role="row">
          <span className="wave-matrix__row-label" role="rowheader">
            {t('session.register.noPotential')}
          </span>
          <div className="wave-matrix__cell" role="cell">
            <strong>{matrix.noPotentialSurfed}</strong>
            <small>{cellPercent(matrix.noPotentialSurfed, totalWaves)}</small>
          </div>
          <div className="wave-matrix__cell" role="cell">
            <strong>{matrix.noPotentialWasted}</strong>
            <small>{cellPercent(matrix.noPotentialWasted, totalWaves)}</small>
          </div>
        </div>
      </div>

      <ul className="wave-matrix__sr-only">
        {cells.map((cell) => (
          <li key={cell.key}>
            {cell.label}: {cell.value}
          </li>
        ))}
      </ul>
    </section>
  )
}
