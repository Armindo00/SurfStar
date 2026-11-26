import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { useI18n } from '../i18n'
import { trainingModeLabel } from '../i18n/labels'
import {
  athleteNamesForSession,
  buildCoachSessionAgendaMetric,
  formatAgendaDayParts,
  formatSessionDuration,
  groupSessionsByMonth,
  resolveSessionSpotName,
  sessionMatchesHistoryFilter,
  type HistoryModeFilter,
  type SessionAgendaMetric,
} from '../sessionHistoryUtils'

const FILTERS: HistoryModeFilter[] = ['all', 'tecnico', 'combos', 'heats', 'other']

function metricLabel(
  metric: SessionAgendaMetric,
  t: (key: string) => string,
): string {
  if (metric.kind === 'success') return t('session.history.metricSuccess')
  if (metric.kind === 'heats') return t('session.history.metricHeats')
  if (metric.kind === 'attempts') return t('session.history.metricAttempts')
  if (metric.kind === 'logs') return t('session.history.metricLogs')
  return t('session.history.metricDone')
}

export function TrainingSessionsView() {
  const { completedCoachSessions, getSpot, getAthlete, openHistorySession, setView } = useApp()
  const { t } = useI18n()
  const [filter, setFilter] = useState<HistoryModeFilter>('all')
  const count = completedCoachSessions.length

  const filteredSessions = useMemo(
    () => completedCoachSessions.filter((session) => sessionMatchesHistoryFilter(session.mode, filter)),
    [completedCoachSessions, filter],
  )

  const monthGroups = useMemo(() => groupSessionsByMonth(filteredSessions), [filteredSessions])

  const showOtherFilter = useMemo(
    () => completedCoachSessions.some((session) => sessionMatchesHistoryFilter(session.mode, 'other')),
    [completedCoachSessions],
  )

  const visibleFilters = FILTERS.filter((id) => id !== 'other' || showOtherFilter)

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.pastSessions')} onBack={() => setView('coach-home')} />

      <div className="history-agenda">
        <header className="history-agenda__intro">
          <h2 className="history-agenda__title">{t('session.history.title')}</h2>
          <p className="muted history-agenda__sub">
            {count === 0
              ? t('session.history.intro')
              : count === 1
                ? t('session.history.agendaIntroOne')
                : t('session.history.agendaIntro', { count })}
          </p>
        </header>

        {count === 0 ? (
          <div className="ss-card history-empty">
            <p className="muted">{t('session.history.empty')}</p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => setView('coach-home')}
            >
              {t('session.history.startNew')}
            </button>
          </div>
        ) : (
          <>
            <div
              className="history-agenda__filters"
              role="tablist"
              aria-label={t('session.history.filtersAria')}
            >
              {visibleFilters.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  className={
                    filter === id
                      ? 'chip chip--active history-agenda__filter'
                      : 'chip history-agenda__filter'
                  }
                  onClick={() => setFilter(id)}
                >
                  {t(`session.history.filter.${id}`)}
                </button>
              ))}
            </div>

            {monthGroups.length === 0 ? (
              <div className="ss-card history-empty">
                <p className="muted">{t('session.history.filterEmpty')}</p>
              </div>
            ) : (
              monthGroups.map((group) => (
                <section key={group.key} className="history-agenda__month">
                  <h3 className="history-agenda__month-label">{group.label}</h3>
                  <ul className="history-agenda__list">
                    {group.sessions.map((session) => {
                      const endedAt = session.endedAt ?? session.startedAt
                      const day = formatAgendaDayParts(endedAt)
                      const spotName = resolveSessionSpotName(session, getSpot)
                      const metric = buildCoachSessionAgendaMetric(session)
                      const athletes = athleteNamesForSession(session, getAthlete)
                      const duration = formatSessionDuration(session.startedAt, session.endedAt)
                      const condition = session.condition || t('session.history.noCondition')

                      return (
                        <li key={session.id}>
                          <button
                            type="button"
                            className="history-agenda__row"
                            onClick={() => openHistorySession(session.id)}
                          >
                            <div className="history-agenda__day" aria-hidden="true">
                              <strong>{day.day}</strong>
                              <span>{day.weekday}</span>
                            </div>
                            <div className="history-agenda__mid">
                              <span className="history-agenda__mode">
                                {trainingModeLabel(session.mode)}
                              </span>
                              <strong className="history-agenda__spot">
                                {spotName} · {condition}
                              </strong>
                              <span className="history-agenda__meta">
                                {athletes} · {duration}
                              </span>
                            </div>
                            <div className="history-agenda__metric">
                              <strong>{metric.value}</strong>
                              <span>{metricLabel(metric, t)}</span>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
