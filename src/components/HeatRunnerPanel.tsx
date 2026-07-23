import { useMemo, useState } from 'react'
import { HeatInterferenceModal } from './HeatInterferenceModal'
import { HeatResultsTable } from './HeatResultsTable'
import { HeatScoreModal } from './HeatScoreModal'
import { HeatTimer } from './HeatTimer'
import { HeatWaveScoreLog } from './HeatWaveScoreLog'
import { useApp } from '../AppContext'
import {
  formatHeatTotal,
  getHeatInterference,
  heatAthleteTotals,
  heatIsFinished,
  heatIsRunning,
} from '../heatUtils'
import { HEAT_INTERFERENCE_LABELS, type HeatRecord } from '../types'

type Props = {
  heat: HeatRecord
}

export function HeatRunnerPanel({ heat }: Props) {
  const { getAthlete, startHeatTimer, endHeat, logHeatWaveScore, setHeatInterference } = useApp()
  const [scoreAthleteId, setScoreAthleteId] = useState<string | null>(null)
  const [interferenceAthleteId, setInterferenceAthleteId] = useState<string | null>(null)

  const running = heatIsRunning(heat)
  const finished = heatIsFinished(heat)
  const canScore = running && !finished
  const heatStarted = Boolean(heat.timerStartedAt)
  const canPenalize = heatStarted

  const totals = useMemo(() => heatAthleteTotals(heat), [heat])

  const scoreAthlete = scoreAthleteId ? getAthlete(scoreAthleteId) : undefined
  const interferenceAthlete = interferenceAthleteId ? getAthlete(interferenceAthleteId) : undefined

  return (
    <div className="heat-runner">
      <header className="heat-runner__head">
        <h2 className="heat-runner__title">{heat.label}</h2>
        <span className="stats-badge">{heat.athleteIds.length} surfers</span>
      </header>

      <HeatTimer heat={heat} onTimeUp={() => endHeat(heat.id)} />

      <p className="heat-rule muted">
        Heat result = <strong>sum of the 2 best wave scores</strong> per surfer. Interference can halve or
        remove the 2nd best from the total.
      </p>

      <div className="heat-runner__controls">
        {!heat.timerStartedAt ? (
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => startHeatTimer(heat.id)}>
            Start heat
          </button>
        ) : null}
        {running ? (
          <button type="button" className="btn btn--danger btn--block" onClick={() => endHeat(heat.id)}>
            End heat now
          </button>
        ) : null}
      </div>

      {heatStarted ? (
        <div className="heat-surfer-actions">
          <p className="field-label">Surfers</p>
          {heat.athleteIds.map((id) => {
            const name = getAthlete(id)?.name ?? 'Athlete'
            const int = getHeatInterference(heat, id)
            return (
              <div key={id} className="heat-surfer-row">
                <div className="heat-surfer-row__info">
                  <strong>{name}</strong>
                  <span>{formatHeatTotal(totals[id] ?? 0)}</span>
                  {int ? <span className="heat-int-badge">{HEAT_INTERFERENCE_LABELS[int]}</span> : null}
                </div>
                <div className="heat-surfer-row__btns">
                  {canScore ? (
                    <button type="button" className="btn btn--primary btn--small" onClick={() => setScoreAthleteId(id)}>
                      Score wave
                    </button>
                  ) : null}
                  {canPenalize ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => setInterferenceAthleteId(id)}
                    >
                      Interference
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {heat.waveScores.length > 0 ? (
        <div className="heat-leaderboard">
          <HeatWaveScoreLog heat={heat} />
          <h3 className="heat-leaderboard__title">Heat results</h3>
          <p className="muted heat-leaderboard__sub">
            Waves in chronological order · green = counting (2 best) · red = interference.
          </p>
          <HeatResultsTable heat={heat} getAthleteName={(id) => getAthlete(id)?.name ?? 'Athlete'} />
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
