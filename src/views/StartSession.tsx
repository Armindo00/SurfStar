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

  const startedLabel = new Date().toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="ss-flow">
      <ScreenHeader title="Nova sessão" onBack={() => setView('coach-home')} />
      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Configurar sessão</h2>
        <p className="muted stats-panel__sub">Escolhe o tipo de treino antes de entrar na água.</p>

        <p className="field-label">Tipo de treino</p>
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
            {lockedModes.map((m) => TRAINING_MODE_LABELS[m]).join(', ')} — disponível no pack Club.
          </p>
        ) : null}

        {isSeaAnalysis ? (
          <p className="muted stats-panel__sub">
            Janela fixa de <strong>30 minutos</strong> · Pico 1 e Pico 2 · sem atletas.
          </p>
        ) : null}

        {showHeatDuration ? (
          <>
            <p className="field-label">Duração do heat</p>
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
            <span>Condições</span>
            <select value={draft.condition} onChange={(e) => setDraftCondition(e.target.value)}>
              <option value="">Seleccionar…</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--pro">
            <span>Hora</span>
            <input type="text" readOnly value={startedLabel} className="input-readonly" />
          </label>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={!draft.condition || modes.length === 0}
          onClick={() => setView('select-athletes')}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
