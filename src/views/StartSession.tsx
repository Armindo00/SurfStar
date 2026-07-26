import { useApp } from '../AppContext'
import { canUseTrainingMode } from '../planUtils'
import type { PlanId } from '../plans'
import { ScreenHeader } from '../components/ScreenHeader'
import { HEAT_DURATIONS, TRAINING_MODE_LABELS, type TrainingMode } from '../types'

const ALL_MODES: TrainingMode[] = ['tecnico', 'combos', 'custom', 'heats', 'campeonato', 'sea-analysis']

function lockedModesHint(planId: PlanId, lockedModes: TrainingMode[]): string {
  const labels = lockedModes.map((m) => TRAINING_MODE_LABELS[m]).join(', ')
  const needsCoach = lockedModes.some((m) => m === 'heats' || m === 'campeonato')
  const needsPremium = lockedModes.some((m) => m === 'custom' || m === 'sea-analysis')

  if (planId === 'starter' && needsCoach && needsPremium) {
    return `${labels} — Heats on Coach plan; Custom training & Sea analysis on Coach Premium.`
  }
  if (needsPremium) return `${labels} — available on Coach Premium plan.`
  if (needsCoach) return `${labels} — available on Coach plan and above.`
  return `${labels} — upgrade your plan to unlock.`
}

export function StartSession() {
  const {
    draft,
    spots,
    conditions,
    customTemplates,
    subscription,
    setDraftMode,
    setDraftCustomTemplate,
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
  const isCustom = draft.mode === 'custom'
  const selectedTemplate = customTemplates.find((t) => t.id === draft.customTemplateId)

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
          <p className="plan-lock-note muted">{lockedModesHint(planId, lockedModes)}</p>
        ) : null}

        {isCustom ? (
          <>
            <p className="field-label">Training template</p>
            {customTemplates.length === 0 ? (
              <div className="custom-start-empty">
                <p className="muted">Create a template first to use custom training.</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => setView('manage-custom-templates')}
                >
                  Manage custom templates
                </button>
              </div>
            ) : (
              <>
                <div className="chip-row chip-row--pro chip-row--templates">
                  {customTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={
                        draft.customTemplateId === template.id ? 'chip chip--active' : 'chip'
                      }
                      onClick={() => setDraftCustomTemplate(template.id)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
                {selectedTemplate ? (
                  <p className="muted stats-panel__sub">
                    {selectedTemplate.buttons.length} skill button
                    {selectedTemplate.buttons.length === 1 ? '' : 's'}
                    {selectedTemplate.timer.enabled
                      ? ` · ${selectedTemplate.timer.durationMinutes} min timer`
                      : ''}
                    {selectedTemplate.useWaves ? ' · wave-based' : ' · direct logging'}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn btn--ghost btn--block"
                  onClick={() => setView('manage-custom-templates')}
                >
                  Edit templates
                </button>
              </>
            )}
          </>
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
          disabled={
            !draft.condition ||
            modes.length === 0 ||
            (isCustom && (!draft.customTemplateId || customTemplates.length === 0))
          }
          onClick={() => setView('select-athletes')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
