import { useMemo, useState } from 'react'
import { EvolutionLineChart } from '../components/EvolutionLineChart'
import { ManeuverLevelSuccessChart } from '../components/ManeuverLevelSuccessChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { SideCompareChart } from '../components/SideCompareChart'
import { useApp } from '../AppContext'
import {
  buildAthleteHeatDetails,
  buildAthleteSessionSummaries,
} from '../athleteStats'
import { formatSessionDate } from '../sessionHistoryUtils'
import { LEVELS } from '../sessionStats'
import {
  buildAthleteSixMonthAnalytics,
  TEAM_ANALYTICS_MONTHS,
} from '../teamAnalyticsStats'
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type ManeuverKind,
} from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function TeamAnalyticsView() {
  const { coachAthletes, trainingSessions, auth, getSpot, setView } = useApp()
  const [search, setSearch] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)

  const coachId = auth?.role === 'treinador' ? auth.coachId : null

  const filteredAthletes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return coachAthletes
    return coachAthletes.filter((a) => a.name.toLowerCase().includes(q))
  }, [coachAthletes, search])

  const selectedAthlete = selectedAthleteId
    ? coachAthletes.find((a) => a.id === selectedAthleteId)
    : undefined

  const analytics = useMemo(() => {
    if (!coachId || !selectedAthleteId) return null
    return buildAthleteSixMonthAnalytics(trainingSessions, coachId, selectedAthleteId)
  }, [coachId, selectedAthleteId, trainingSessions])

  const heatDetails = useMemo(() => {
    if (!analytics || !selectedAthleteId) return []
    return buildAthleteHeatDetails(analytics.sessions, selectedAthleteId)
  }, [analytics, selectedAthleteId])

  const sessionSummaries = useMemo(() => {
    if (!analytics || !selectedAthleteId) return []
    return buildAthleteSessionSummaries(analytics.sessions, selectedAthleteId)
  }, [analytics, selectedAthleteId])

  if (!coachId) return null

  if (selectedAthlete && analytics) {
    const general = analytics.general

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader
          title="Team analytics"
          onBack={() => {
            setSelectedAthleteId(null)
            setSearch('')
          }}
        />

        <div className="ss-card team-analytics-hero">
          <span className="team-analytics-hero__avatar" aria-hidden="true">
            {selectedAthlete.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 className="page-title">{selectedAthlete.name}</h2>
            <p className="muted">
              Last {TEAM_ANALYTICS_MONTHS} months · {analytics.sessions.length} completed session
              {analytics.sessions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-card__label">Trainings</span>
            <strong className="kpi-card__value">{general.totalTrainings}</strong>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">Waves</span>
            <strong className="kpi-card__value">{general.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">With potential</span>
            <strong className="kpi-card__value">
              {general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}
            </strong>
            {general.withPotentialRate !== null ? <RateBar value={general.withPotentialRate} /> : null}
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Stars landed</span>
            <strong className="kpi-card__value">{general.totalStars}</strong>
            <small className="kpi-card__hint">
              Tech {general.technicalStars} · Combo {general.comboStars}
            </small>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">Heat wins</span>
            <strong className="kpi-card__value">{general.heatWins}</strong>
            <small className="kpi-card__hint">{general.heatParticipations} heats</small>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">Avg. heat score</span>
            <strong className="kpi-card__value">
              {general.avgHeatScore === null ? '—' : general.avgHeatScore.toFixed(2)}
            </strong>
          </article>
        </div>

        <div className="ss-card stats-panel">
          <EvolutionLineChart
            title="Evolution (6 months)"
            subtitle="Monthly success rate and waves with potential"
            points={analytics.monthlyEvolution}
          />
        </div>

        {analytics.technical ? (
          <>
            <div className="ss-card stats-panel">
              <h2 className="stats-panel__title">Technical training — overview</h2>
              <SideCompareChart
                title="All maneuvers"
                overallRate={analytics.technical.overallSuccessRate}
                bySide={analytics.technical.bySide}
              />
            </div>

            {KINDS.map((kind) => (
              <div key={kind} className="ss-card stats-panel">
                <header className="stats-panel__head">
                  <h2 className="stats-panel__title">{MANEUVER_LABELS[kind]}</h2>
                  <span className="stats-badge">
                    {analytics.technical!.byKind[kind].successes}/
                    {analytics.technical!.byKind[kind].total} ·{' '}
                    {analytics.technical!.byKind[kind].rate}%
                  </span>
                </header>
                <ManeuverLevelSuccessChart byLevel={analytics.technical!.byKind[kind].byLevel} />
              </div>
            ))}
          </>
        ) : null}

        {analytics.combo ? (
          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Combos — overview</h2>
            <SideCompareChart
              title="All combo levels"
              overallRate={analytics.combo.overallSuccessRate}
              bySide={analytics.combo.bySide}
            />
            <div className="side-chart-stack">
              {LEVELS.map((lvl) => {
                const row = analytics.combo!.byLevel[lvl]
                return (
                  <SideCompareChart
                    key={String(lvl)}
                    title={COMBO_LEVEL_LABELS[lvl]}
                    subtitle={`${row.successes}/${row.attempts} successes overall`}
                    overallRate={row.rate}
                    bySide={row.bySide}
                  />
                )
              })}
            </div>
          </div>
        ) : null}

        {heatDetails.length > 0 ? (
          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Heat results</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heat</th>
                    <th>Score</th>
                    <th>Place</th>
                  </tr>
                </thead>
                <tbody>
                  {heatDetails.map((row) => (
                    <tr key={`${row.sessionId}-${row.heatLabel}`}>
                      <td>{formatSessionDate(row.sessionEndedAt)}</td>
                      <td>{row.heatLabel}</td>
                      <td>{row.total.toFixed(2)}</td>
                      <td>
                        #{row.placement}
                        {row.won ? ' · Win' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {sessionSummaries.length > 0 ? (
          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Sessions in this period</h2>
            <ul className="team-analytics-sessions">
              {sessionSummaries.map(({ session, headline }) => (
                <li key={session.id} className="team-analytics-sessions__item">
                  <div>
                    <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
                    <small>
                      {formatSessionDate(session.endedAt ?? session.startedAt)} ·{' '}
                      {getSpot(session.spotId)?.name ?? 'Spot'} · {session.condition || '—'}
                    </small>
                  </div>
                  <span>{headline}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Team analytics" onBack={() => setView('coach-home')} />

      <div className="ss-card team-analytics-intro">
        <h2 className="page-title">Pick an athlete</h2>
        <p className="muted">
          Search by name and open the last {TEAM_ANALYTICS_MONTHS} months of stats with an evolution
          chart.
        </p>

        <label className="field field--pro team-analytics-search">
          <span>Search athlete</span>
          <input
            type="search"
            placeholder="Type a name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {coachAthletes.length === 0 ? (
        <div className="ss-card history-empty">
          <p className="muted">No athletes yet.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView('manage-athletes')}>
            Add athletes
          </button>
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="ss-card history-empty">
          <p className="muted">No athlete matches “{search.trim()}”.</p>
        </div>
      ) : (
        <ul className="team-analytics-list">
          {filteredAthletes.map((athlete) => {
            const preview = buildAthleteSixMonthAnalytics(trainingSessions, coachId, athlete.id)

            return (
              <li key={athlete.id}>
                <button
                  type="button"
                  className="team-analytics-list__item"
                  onClick={() => setSelectedAthleteId(athlete.id)}
                >
                  <span className="team-analytics-list__avatar" aria-hidden="true">
                    {athlete.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="team-analytics-list__body">
                    <strong>{athlete.name}</strong>
                    <small>
                      {preview.sessions.length} session{preview.sessions.length === 1 ? '' : 's'} ·{' '}
                      {preview.general.totalWaves} waves ·{' '}
                      {preview.general.withPotentialRate === null
                        ? '—'
                        : `${preview.general.withPotentialRate}% potential`}
                    </small>
                  </span>
                  <span className="team-analytics-list__chev" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
