import { useI18n } from '../i18n'
import type { WaveMatrixCounts } from '../sessionStats'

type Props = {
  matrix: WaveMatrixCounts
  totalWaves: number
  title?: string
}

function cellPercent(count: number, total: number): number | null {
  if (!total) return null
  return Math.round((count / total) * 100)
}

type CellTone = 'teal' | 'mint' | 'plain'

type MatrixCell = {
  key: string
  titleKey:
    | 'analytics.topicSheet.matrixCellHighHighTitle'
    | 'analytics.topicSheet.matrixCellHighLowTitle'
    | 'analytics.topicSheet.matrixCellLowHighTitle'
    | 'analytics.topicSheet.matrixCellLowLowTitle'
  blurbKey:
    | 'analytics.topicSheet.matrixCellHighHighBlurb'
    | 'analytics.topicSheet.matrixCellHighLowBlurb'
    | 'analytics.topicSheet.matrixCellLowHighBlurb'
    | 'analytics.topicSheet.matrixCellLowLowBlurb'
  count: number
  tone: CellTone
}

export function WaveMatrixPanel({ matrix, totalWaves, title }: Props) {
  const { t } = useI18n()
  const heading = title ?? t('analytics.topicSheet.waveMatrix')

  const cells: MatrixCell[][] = [
    [
      {
        key: 'ps',
        titleKey: 'analytics.topicSheet.matrixCellHighHighTitle',
        blurbKey: 'analytics.topicSheet.matrixCellHighHighBlurb',
        count: matrix.potentialSurfed,
        tone: 'teal',
      },
      {
        key: 'pw',
        titleKey: 'analytics.topicSheet.matrixCellHighLowTitle',
        blurbKey: 'analytics.topicSheet.matrixCellHighLowBlurb',
        count: matrix.potentialWasted,
        tone: 'plain',
      },
    ],
    [
      {
        key: 'ns',
        titleKey: 'analytics.topicSheet.matrixCellLowHighTitle',
        blurbKey: 'analytics.topicSheet.matrixCellLowHighBlurb',
        count: matrix.noPotentialSurfed,
        tone: 'plain',
      },
      {
        key: 'nw',
        titleKey: 'analytics.topicSheet.matrixCellLowLowTitle',
        blurbKey: 'analytics.topicSheet.matrixCellLowLowBlurb',
        count: matrix.noPotentialWasted,
        tone: 'mint',
      },
    ],
  ]

  return (
    <section className="wave-matrix ss-card stats-panel">
      <h2 className="stats-panel__title">{heading}</h2>
      <p className="muted stats-panel__sub">{t('analytics.topicSheet.waveMatrixSubtitle')}</p>

      <div className="wave-matrix__board" role="table" aria-label={heading}>
        <div className="wave-matrix__y-axis" aria-hidden="true">
          <span className="wave-matrix__axis-arrow">↑</span>
          <span className="wave-matrix__axis-label">
            {t('analytics.topicSheet.matrixAxisPotential')}
          </span>
        </div>

        <div className="wave-matrix__grid">
          {cells.map((row, rowIndex) => (
            <div className="wave-matrix__quad-row" role="row" key={rowIndex}>
              {row.map((cell) => {
                const pct = cellPercent(cell.count, totalWaves)
                return (
                  <div
                    key={cell.key}
                    className={`wave-matrix__quad wave-matrix__quad--${cell.tone}`}
                    role="cell"
                  >
                    <strong className="wave-matrix__quad-title">{t(cell.titleKey)}</strong>
                    <p className="wave-matrix__quad-blurb">{t(cell.blurbKey)}</p>
                    <span className="wave-matrix__quad-pct">
                      {pct === null ? '—' : `${pct}%`}
                    </span>
                    <span className="wave-matrix__quad-count">
                      {t('analytics.topicSheet.matrixCellCount', { count: cell.count })}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="wave-matrix__x-axis" aria-hidden="true">
          <span className="wave-matrix__axis-label">
            {t('analytics.topicSheet.matrixAxisResult')}
          </span>
          <span className="wave-matrix__axis-arrow">→</span>
        </div>
      </div>
    </section>
  )
}
