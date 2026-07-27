import { useMemo, useState } from 'react'
import {
  AthleteAnalyticsTopicSheet,
  type AnalyticsTopic,
} from '../components/AthleteAnalyticsTopicSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { exportAthleteAnalyticsCsv } from '../exportCsv'
import { formatAverageLevelValue, formatCombinedLevelSummary } from '../sessionStats'
import { canAccessTeamAnalytics, planUpgradeHint } from '../planUtils'
import { buildAthleteSessionSummaries } from '../athleteStats'
import { buildAthleteHeatAnalytics } from '../heatAnalyticsStats'
import {
  ANALYTICS_PERIOD_OPTIONS,
  analyticsPeriodLabel,
  buildAthletePeriodAnalytics,
  buildAthleteSixMonthAnalytics,
  TEAM_ANALYTICS_MONTHS,
  type AnalyticsPeriod,
} from '../teamAnalyticsStats'

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

type TopicTile = {
  id: AnalyticsTopic
  label: string
  value: string
  hint: string
  accent?: boolean
  success?: boolean
  star?: boolean
}

export function TeamAnalyticsView() {
  const { coachAthletes, trainingSessions, auth, subscription, getSpot, setView } = useApp()
  const [search, setSearch] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)
  const [period, setPeriod] = useState<AnalyticsPeriod>('6m')
  const [activeTopic, setActiveTopic] = useState<AnalyticsTopic | null>(null)

  const planId = subscription?.planId ?? 'team'
  const hasAccess = canAccessTeamAnalytics(planId)
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
    return buildAthletePeriodAnalytics(trainingSessions, coachId, selectedAthleteId, period)
  }, [coachId, period, selectedAthleteId, trainingSessions])

  const heatAnalytics = useMemo(() => {
    if (!analytics || !selectedAthleteId) {
      return {
        heatsWithTiming: 0,
        heatsTotal: 0,
        avgHeatScore: null,
        avgBestWaveOpening: null,
        earlyTenPointsRate: null,
        avgEarlyTotalFirst10Min: null,
        avgTimeToFirstWaveMin: null,
        heatsWithFirstWave: 0,
        avgTimeToTwoMajorMin: null,
        heatsWithTwoMajor: 0,
        avgBestWaveClosing: null,
        closingMajorRate: null,
        openingMajorRate: null,
        clutchDelta: null,
        rows: [],
      }
    }
    return buildAthleteHeatAnalytics(analytics.sessions, selectedAthleteId)
  }, [analytics, selectedAthleteId])

  const sessionSummaries = useMemo(() => {
    if (!analytics || !selectedAthleteId) return []
    return buildAthleteSessionSummaries(analytics.sessions, selectedAthleteId)
  }, [analytics, selectedAthleteId])

  const topicTiles = useMemo((): TopicTile[] => {
    if (!analytics) return []

    const general = analytics.general

    return [
      {
        id: 'performance',
        label: 'Performance',
        value: formatAverageLevelValue(general.avgOverallManeuverLevel),
        hint:
          general.totalStars > 0
            ? `${formatCombinedLevelSummary(general)} · ${general.totalStars} stars`
            : formatCombinedLevelSummary(general),
        accent: true,
      },
      {
        id: 'volume',
        label: 'Training volume',
        value: String(general.totalTrainings),
        hint: `${general.totalWaves} waves logged`,
      },
      {
        id: 'wave-quality',
        label: 'Wave quality',
        value: general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`,
        hint: `${general.withPotential} with potential`,
        accent: true,
      },
      {
        id: 'technical',
        label: 'Technical',
        value: analytics.technical
          ? `${analytics.technical.overallSuccessRate}%`
          : '—',
        hint: analytics.technical
          ? `Avg ${formatAverageLevelValue(analytics.technical.averageLevel)} · ${general.technicalStars} stars`
          : 'No sessions in period',
      },
      {
        id: 'combos',
        label: 'Combos',
        value: analytics.combo ? `${analytics.combo.overallSuccessRate}%` : '—',
        hint: analytics.combo
          ? `Avg ${formatAverageLevelValue(analytics.combo.averageLevel)} · ${general.comboStars} stars`
          : 'No sessions in period',
      },
      {
        id: 'competition',
        label: 'Competition',
        value: String(general.heatWins),
        hint:
          heatAnalytics.heatsWithTiming > 0
            ? `Avg ${heatAnalytics.avgHeatScore?.toFixed(2) ?? '—'} · open ${heatAnalytics.avgBestWaveOpening?.toFixed(2) ?? '—'} · close ${heatAnalytics.avgBestWaveClosing?.toFixed(2) ?? '—'}`
            : general.heatParticipations > 0
              ? `${general.heatParticipations} heats · avg ${general.avgHeatScore?.toFixed(2) ?? '—'}`
              : 'No heats in period',
        success: general.heatWins > 0,
      },
    ]
  }, [analytics, heatAnalytics])

  if (!hasAccess) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Team analytics" onBack={() => setView('coach-home')} />
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">Feature locked</h2>
          <p className="muted">{planUpgradeHint(planId, 'analytics')}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView('subscription')}>
            View subscription
          </button>
        </div>
      </div>
    )
  }

  if (!coachId) return null

  if (selectedAthlete && analytics) {
    const general = analytics.general
    const periodLabel = analyticsPeriodLabel(period)

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader
          title="Team analytics"
          onBack={() => {
            setSelectedAthleteId(null)
            setSearch('')
            setActiveTopic(null)
            setPeriod('6m')
          }}
        />

        <div className="ss-card team-analytics-hero">
          <span className="team-analytics-hero__avatar" aria-hidden="true">
            {selectedAthlete.name.charAt(0).toUpperCase()}
          </span>
          <div className="team-analytics-hero__copy">
            <h2 className="page-title">{selectedAthlete.name}</h2>
            <p className="muted">
              {periodLabel} · {analytics.sessions.length} completed session
              {analytics.sessions.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--small team-analytics-hero__export"
            onClick={() => exportAthleteAnalyticsCsv(selectedAthlete.name, analytics, selectedAthlete.id)}
          >
            Export CSV
          </button>
        </div>

        <div className="ss-card analytics-period-bar">
          <div className="analytics-period-bar__copy">
            <span className="analytics-period-bar__label">Time range</span>
            <p className="muted">Choose how far back to analyze this athlete.</p>
          </div>
          <div className="chip-row chip-row--pro analytics-period-bar__chips" role="tablist" aria-label="Time range">
            {ANALYTICS_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={period === option.id}
                className={`chip ${period === option.id ? 'chip--active' : ''}`}
                onClick={() => {
                  setPeriod(option.id)
                  setActiveTopic(null)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {analytics.sessions.length === 0 ? (
          <div className="ss-card stats-panel analytics-empty-period">
            <h2 className="stats-panel__title">No data in this period</h2>
            <p className="muted">
              {selectedAthlete.name} has no completed sessions in the last {periodLabel}. Try a
              longer time range.
            </p>
          </div>
        ) : (
          <>
            <div className="analytics-overview-strip">
              <article className="analytics-overview-strip__item analytics-overview-strip__item--accent">
                <span>Avg level</span>
                <strong>{formatAverageLevelValue(general.avgOverallManeuverLevel)}</strong>
              </article>
              <article className="analytics-overview-strip__item">
                <span>Sessions</span>
                <strong>{general.totalTrainings}</strong>
              </article>
              <article className="analytics-overview-strip__item">
                <span>Potential</span>
                <strong>
                  {general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}
                </strong>
              </article>
              <article className="analytics-overview-strip__item">
                <span>Stars</span>
                <strong>{general.totalStars}</strong>
              </article>
            </div>

            <div className="analytics-topic-grid">
              {topicTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={[
                    'analytics-topic-tile',
                    tile.accent ? 'analytics-topic-tile--accent' : '',
                    tile.success ? 'analytics-topic-tile--success' : '',
                    tile.star ? 'analytics-topic-tile--star' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setActiveTopic(tile.id)}
                >
                  <span className="analytics-topic-tile__label">{tile.label}</span>
                  <strong className="analytics-topic-tile__value">{tile.value}</strong>
                  <small className="analytics-topic-tile__hint">{tile.hint}</small>
                  {tile.id === 'wave-quality' && general.withPotentialRate !== null ? (
                    <RateBar value={general.withPotentialRate} />
                  ) : null}
                  <span className="analytics-topic-tile__chev" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>

            <p className="muted analytics-topic-grid__footnote">
              Tap a topic to open a detailed breakdown for the selected period.
            </p>
          </>
        )}

        {activeTopic && analytics ? (
          <AthleteAnalyticsTopicSheet
            topic={activeTopic}
            period={period}
            analytics={analytics}
            heatAnalytics={heatAnalytics}
            sessionSummaries={sessionSummaries}
            getSpot={getSpot}
            onClose={() => setActiveTopic(null)}
          />
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
          Search by name and open stats with overview cards and detailed breakdowns by topic.
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
                      Last {TEAM_ANALYTICS_MONTHS} months · {preview.sessions.length} session
                      {preview.sessions.length === 1 ? '' : 's'} · {preview.general.totalWaves} waves ·{' '}
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
