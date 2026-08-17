import { useState } from 'react'
import type { CustomButtonStats } from '../customTrainingStats'
import { useI18n } from '../i18n'
import { formatAverageLevelValue } from '../sessionStats'

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

type Props = {
  buttons: CustomButtonStats[]
}

export function CustomButtonStatsList({ buttons }: Props) {
  const { t } = useI18n()
  const [expandedButtonId, setExpandedButtonId] = useState<string | null>(null)

  const toggle = (buttonId: string) => {
    setExpandedButtonId((prev) => (prev === buttonId ? null : buttonId))
  }

  if (buttons.length === 0) return null

  return (
    <ul className="custom-button-stats-list">
      {buttons.map((button) => {
        const expanded = expandedButtonId === button.buttonId
        const levelRows = Object.values(button.byLevel)
        const hasLevelBreakdown = levelRows.some((level) => level.attempts > 0)

        return (
          <li key={button.buttonId} className="custom-button-stats-list__item">
            <button
              type="button"
              className="custom-button-stats-list__row"
              aria-expanded={expanded}
              onClick={() => toggle(button.buttonId)}
            >
              <span className="custom-button-stats-list__label">{button.label}</span>
              <span className="custom-button-stats-list__meta">
                <span className="custom-button-stats-list__avg">
                  {t('ui.stats.avgLevelShort')}{' '}
                  <strong>{formatAverageLevelValue(button.averageLevel)}</strong>
                </span>
                <span className="stats-badge">
                  {button.successes}/{button.attempts} · {button.rate}%
                </span>
              </span>
            </button>

            {expanded ? (
              <div className="custom-button-stats-list__detail">
                <div className="custom-button-stats-list__summary">
                  <div>
                    <span className="custom-button-stats-list__summary-label">
                      {t('ui.stats.attempts')}
                    </span>
                    <strong>{button.attempts}</strong>
                  </div>
                  <div>
                    <span className="custom-button-stats-list__summary-label">
                      {t('ui.stats.overallSuccess')}
                    </span>
                    <strong>{button.rate}%</strong>
                  </div>
                  <div>
                    <span className="custom-button-stats-list__summary-label">
                      {t('ui.stats.avgLevelShort')}
                    </span>
                    <strong>{formatAverageLevelValue(button.averageLevel)}</strong>
                  </div>
                </div>

                {hasLevelBreakdown ? (
                  <div className="table-wrap stats-panel__table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('ui.stats.level')}</th>
                          <th>{t('ui.stats.attempts')}</th>
                          <th>{t('ui.stats.successes')}</th>
                          <th>{t('ui.stats.rate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelRows.map((level) => (
                          <tr key={level.levelId}>
                            <td>{level.label}</td>
                            <td>{level.attempts}</td>
                            <td className="data-table__ok">{level.successes}</td>
                            <td>
                              <span className="data-table__rate">{level.rate}%</span>
                              <RateBar value={level.rate} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted">{t('ui.stats.noLevelBreakdown')}</p>
                )}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
