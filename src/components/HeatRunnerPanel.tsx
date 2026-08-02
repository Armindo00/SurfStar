import { useMemo, useState } from 'react'
import { HeatInterferenceModal } from './HeatInterferenceModal'
import { HeatResultsTable } from './HeatResultsTable'
import { HeatScoreModal } from './HeatScoreModal'
import { HeatTimer } from './HeatTimer'
import { HeatWaveScoreLog } from './HeatWaveScoreLog'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import {
  formatHeatTotal,
  getHeatInterference,
  heatAthleteTotals,
  heatIsFinished,
  heatIsRunning,
} from '../heatUtils'
import { getAdvancementSummary } from '../championshipUtils'
import { HEAT_INTERFERENCE_LABELS, type HeatRecord } from '../types'

type Props = {
  heat: HeatRecord
  championshipHeatSize?: 2 | 4
  compact?: boolean
  hideTimer?: boolean
  hideControls?: boolean
}

export function HeatRunnerPanel({
  heat,
  championshipHeatSize,
  compact = false,
  hideTimer = false,
  hideControls = false,
}: Props) {
  const { getAthlete, startHeatTimer, endHeat, logHeatWaveScore, setHeatInterference } = useApp()
  const { t, messages } = useI18n()
  const h = messages.session.heat as Record<string, string>
  const [scoreAthleteId, setScoreAthleteId] = useState<string | null>(null)
  const [interferenceAthleteId, setInterferenceAthleteId] = useState<string | null>(null)

  const running = heatIsRunning(heat)
  const finished = heatIsFinished(heat)
  const locked = Boolean(heat.bracketLocked)
  const canStart = !locked && heat.athleteIds.length > 0
  const canScore = running && !finished
  const heatStarted = Boolean(heat.timerStartedAt)
  const canPenalize = heatStarted

  const totals = useMemo(() => heatAthleteTotals(heat), [heat])
  const advancement = useMemo(() => {
    if (!finished || !championshipHeatSize) return []
    return getAdvancementSummary(heat, championshipHeatSize)
  }, [championshipHeatSize, finished, heat])

  const scoreAthlete = scoreAthleteId ? getAthlete(scoreAthleteId) : undefined
  const interferenceAthlete = interferenceAthleteId ? getAthlete(interferenceAthleteId) : undefined
  const athleteFallback = messages.roles.athlete

  return (
    <div className={compact ? 'heat-runner heat-runner--compact' : 'heat-runner'}>
      <header className="heat-runner__head">
        <h2 className="heat-runner__title">{heat.label}</h2>
        <span className="stats-badge">{t('session.heat.surfersCount', { count: heat.athleteIds.length })}</span>
      </header>

      {!hideTimer ? <HeatTimer heat={heat} onTimeUp={() => endHeat(heat.id)} /> : null}

      {!compact ? (
        <p className="heat-rule muted">
          {h.heatRuleBefore} <strong>{h.heatRuleBold}</strong> {h.heatRuleAfter}
        </p>
      ) : null}

      {!hideControls ? (
        <div className="heat-runner__controls">
          {!heat.timerStartedAt && canStart ? (
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => startHeatTimer(heat.id)}>
              {h.startHeat}
            </button>
          ) : null}
          {running ? (
            <button type="button" className="btn btn--danger btn--block" onClick={() => endHeat(heat.id)}>
              {h.endHeatNow}
            </button>
          ) : null}
        </div>
      ) : null}

      {heatStarted || compact ? (
        <div className="heat-surfer-actions">
          <p className="field-label">{h.surfers}</p>
          {heat.athleteIds.map((id) => {
            const name = getAthlete(id)?.name ?? athleteFallback
            const int = getHeatInterference(heat, id)
            return (
              <div key={id} className="heat-surfer-row">
                <div className="heat-surfer-row__info">
                  <strong>{name}</strong>
                  {heatStarted ? <span>{formatHeatTotal(totals[id] ?? 0)}</span> : null}
                  {int ? <span className="heat-int-badge">{HEAT_INTERFERENCE_LABELS[int]}</span> : null}
                </div>
                <div className="heat-surfer-row__btns">
                  {canScore ? (
                    <button type="button" className="btn btn--primary btn--small" onClick={() => setScoreAthleteId(id)}>
                      {h.scoreWave}
                    </button>
                  ) : null}
                  {canPenalize ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => setInterferenceAthleteId(id)}
                    >
                      {h.interference}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {finished && advancement.length > 0 ? (
        <div className="champ-advance-panel">
          <p className="field-label">{h.advancement}</p>
          <ul className="champ-advance-list">
            {advancement.map((row) => (
              <li key={row.athleteId} className={row.advances ? 'champ-advance-list__on' : ''}>
                <span>
                  #{row.place} {getAthlete(row.athleteId)?.name ?? athleteFallback}
                </span>
                <span>{formatHeatTotal(totals[row.athleteId] ?? 0)}</span>
                {row.advances ? <strong>{h.advances}</strong> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {heat.waveScores.length > 0 ? (
        <div className={compact ? 'heat-leaderboard heat-leaderboard--compact' : 'heat-leaderboard'}>
          <HeatWaveScoreLog heat={heat} />
          {!compact ? (
            <>
              <h3 className="heat-leaderboard__title">{h.heatResults}</h3>
              <p className="muted heat-leaderboard__sub">{h.heatResultsSub}</p>
              <HeatResultsTable heat={heat} getAthleteName={(id) => getAthlete(id)?.name ?? athleteFallback} />
            </>
          ) : null}
        </div>
      ) : null}

      {scoreAthlete && canScore ? (
        <HeatScoreModal
          athleteName={scoreAthlete.name}
          onClose={() => setScoreAthleteId(null)}
          onSave={(score) => {
            logHeatWaveScore(heat.id, scoreAthlete.id, score)
            setScoreAthleteId(null)
          }}
        />
      ) : null}

      {interferenceAthlete && canPenalize ? (
        <HeatInterferenceModal
          athleteName={interferenceAthlete.name}
          current={getHeatInterference(heat, interferenceAthlete.id)}
          onClose={() => setInterferenceAthleteId(null)}
          onApply={(type) => {
            setHeatInterference(heat.id, interferenceAthlete.id, type)
            setInterferenceAthleteId(null)
          }}
          onClear={() => {
            setHeatInterference(heat.id, interferenceAthlete.id, null)
            setInterferenceAthleteId(null)
          }}
        />
      ) : null}
    </div>
  )
}
