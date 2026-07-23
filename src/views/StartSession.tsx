import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { HEAT_DURATIONS, TRAINING_MODE_LABELS, type TrainingMode } from '../types'

const MODES: TrainingMode[] = ['tecnico', 'combos', 'heats', 'campeonato', 'sea-analysis']

export function StartSession() {
  const {
    draft,
    spots,
    conditions,
    setDraftMode,
    setDraftSpot,
    setDraftCondition,
    setDraftHeatDuration,
    setView,
  } = useApp()

  const showHeatDuration = draft.mode === 'heats' || draft.mode === 'campeonato'
  const isSeaAnalysis = draft.mode === 'sea-analysis'

  const startedLabel = new Date().toLocaleString('en-US', {
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
        <p className="muted stats-panel__sub">Before you hit the water — choose the training type.</p>

        <p className="field-label">Training type</p>
        <div className="chip-row chip-row--pro chip-row--modes">
          {MODES.map((mode) => (
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
            <p className="muted stats-panel__sub">
              {draft.mode === 'heats'
                ? 'Single heat simulation — up to 4 surfers.'
                : 'Default length for each new heat in the contest.'}
            </p>
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
          disabled={!draft.condition}
          onClick={() => setView('select-athletes')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
