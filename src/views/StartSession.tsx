import { useApp } from '../AppContext'
import { canUseTrainingMode } from '../planUtils'
import { ScreenHeader } from '../components/ScreenHeader'
import { HEAT_DURATIONS, TRAINING_MODE_LABELS, type TrainingMode } from '../types'

const ALL_MODES: TrainingMode[] = ['tecnico', 'combos', 'heats', 'campeonato', 'sea-analysis']

export function StartSession() {
  const {
    draft,
    spots,
    conditions,
    subscription,
    setDraftMode,
    setDraftSpot,
    setDraftCondition,
    setDraftHeatDuration,
    setView,
  } = useApp()

  const planId = subscription?.planId ?? 'starter'
  const modes = ALL_MODES.filter((mode) => canUseTrainingMode(planId, mode))
  const lockedModes = ALL_MODES.filter((mode) => !canUseTrainingMode(planId, mode))

  const showHeatDuration = draft.mode === 'heats' || draft.mode === 'campeonato'
  const isSeaAnalysis = draft.mode === 'sea-analysis'

  const startedLabel = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="ss-flow">
      <ScreenHeader title="New session" onBack={() => setView('coach-home')} />
      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Session setup</h2>
        <p className="muted stats-panel__sub">Choose the training type before you hit the water.</p>

        <p className="field-label">Training type</p>
        <div className="chip-row chip-row--pro chip-row--modes">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={draft.mode === mode ? 'chip chip--active' : 'chip'}
              onClick={() => setDraftMode(mode)}
            >
              {TRAINING_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {lockedModes.length > 0 ? (
          <p className="plan-lock-note muted">
            {lockedModes.map((m) => TRAINING_MODE_LABELS[m]).join(', ')} — available on Club plan.
          </p>
        ) : null}

        {isSeaAnalysis ? (
          <p className="muted stats-panel__sub">
            Fixed <strong>30 minute</strong> observation window · Peak 1 & Peak 2 · no athletes required.
          </p>
        ) : null}

        {showHeatDuration ? (
          <>
            <p className="field-label">Heat length</p>
            <div className="chip-row chip-row--pro">
              {HEAT_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={draft.heatDurationMinutes === d ? 'chip chip--active' : 'chip'}
                  onClick={() => setDraftHeatDuration(d)}
                >
                  {d} min
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className="form-pro">
          <label className="field field--pro">
            <span>Spot</span>
            <select value={draft.spotId} onChange={(e) => setDraftSpot(e.target.value)}>
              {spots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--pro">
            <span>Sea conditions</span>
            <select value={draft.condition} onChange={(e) => setDraftCondition(e.target.value)}>
              <option value="">Select…</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--pro">
            <span>Session time</span>
            <input type="text" readOnly value={startedLabel} className="input-readonly" />
          </label>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={!draft.condition || modes.length === 0}
          onClick={() => setView('select-athletes')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
