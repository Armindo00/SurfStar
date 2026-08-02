import { useApp } from '../AppContext'
import { formatAppDateTime } from '../dateFormat'
import { canUseTrainingMode } from '../planUtils'
import { ScreenHeader } from '../components/ScreenHeader'
import { useI18n } from '../i18n'
import { trainingModeLabel } from '../i18n/labels'
import { HEAT_DURATIONS, type TrainingMode } from '../types'

const ALL_MODES: TrainingMode[] = ['tecnico', 'combos', 'custom', 'heats', 'campeonato', 'sea-analysis']

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
    setDraftChampionshipHeatSize,
    setDraftChampionshipParallelHeats,
    setView,
  } = useApp()
  const { t } = useI18n()
  const s = (key: string, params?: Record<string, string | number>) => t(`session.setup.${key}`, params)

  const planId = subscription?.planId ?? 'team'
  const modes = ALL_MODES.filter((mode) => canUseTrainingMode(planId, mode))
  const lockedModes = ALL_MODES.filter((mode) => !canUseTrainingMode(planId, mode))

  const lockedModesHint = (() => {
    const labels = lockedModes.map((m) => trainingModeLabel(m)).join(', ')
    const needsCoach = lockedModes.some((m) => m === 'heats' || m === 'campeonato')
    const needsPremium = lockedModes.some((m) => m === 'custom' || m === 'sea-analysis')
    if (needsPremium && needsCoach) return s('lockedModesPremiumAndCoach', { modes: labels })
    if (needsPremium) return s('lockedModesPremium', { modes: labels })
    if (needsCoach) return s('lockedModesCoach', { modes: labels })
    return s('lockedModesUpgrade', { modes: labels })
  })()

  const showHeatDuration = draft.mode === 'heats' || draft.mode === 'campeonato'
  const isCampeonato = draft.mode === 'campeonato'
  const isSeaAnalysis = draft.mode === 'sea-analysis'
  const isCustom = draft.mode === 'custom'
  const selectedTemplate = customTemplates.find((tmpl) => tmpl.id === draft.customTemplateId)

  const startedLabel = formatAppDateTime(new Date(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.newSession')} onBack={() => setView('coach-home')} />
      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{s('title')}</h2>
        <p className="muted stats-panel__sub">{s('subtitle')}</p>

        <p className="field-label">{s('trainingType')}</p>
        <div className="chip-row chip-row--pro chip-row--modes">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={draft.mode === mode ? 'chip chip--active' : 'chip'}
              onClick={() => setDraftMode(mode)}
            >
              {trainingModeLabel(mode)}
            </button>
          ))}
        </div>

        {lockedModes.length > 0 ? <p className="plan-lock-note muted">{lockedModesHint}</p> : null}

        {isCustom ? (
          <>
            <p className="field-label">{s('trainingTemplate')}</p>
            {customTemplates.length === 0 ? (
              <div className="custom-start-empty">
                <p className="muted">{s('noTemplatesHint')}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => setView('manage-custom-templates')}
                >
                  {s('manageCustomTemplates')}
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
                    {selectedTemplate.buttons.length === 1
                      ? s('skillButtons', { count: selectedTemplate.buttons.length })
                      : s('skillButtonsPlural', { count: selectedTemplate.buttons.length })}
                    {selectedTemplate.timer.enabled
                      ? ` · ${s('timerMinutes', { minutes: selectedTemplate.timer.durationMinutes })}`
                      : ''}
                    {selectedTemplate.useWaves ? ` · ${s('waveBased')}` : ` · ${s('directLogging')}`}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn btn--ghost btn--block"
                  onClick={() => setView('manage-custom-templates')}
                >
                  {s('editTemplates')}
                </button>
              </>
            )}
          </>
        ) : null}

        {isSeaAnalysis ? <p className="muted stats-panel__sub">{s('seaAnalysisHint')}</p> : null}

        {showHeatDuration ? (
          <>
            <p className="field-label">{s('heatLength')}</p>
            <div className="chip-row chip-row--pro">
              {HEAT_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={draft.heatDurationMinutes === d ? 'chip chip--active' : 'chip'}
                  onClick={() => setDraftHeatDuration(d)}
                >
                  {s('heatMinutes', { minutes: d })}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {isCampeonato ? (
          <>
            <p className="field-label">{s('surfersPerHeat')}</p>
            <div className="chip-row chip-row--pro">
              <button
                type="button"
                className={draft.championshipHeatSize === 2 ? 'chip chip--active' : 'chip'}
                onClick={() => setDraftChampionshipHeatSize(2)}
              >
                {s('heatSize2')}
              </button>
              <button
                type="button"
                className={draft.championshipHeatSize === 4 ? 'chip chip--active' : 'chip'}
                onClick={() => setDraftChampionshipHeatSize(4)}
              >
                {s('heatSize4')}
              </button>
            </div>
            <p className="muted stats-panel__sub">{s('championshipHint')}</p>

            <p className="field-label">{s('heatScheduling')}</p>
            <div className="chip-row chip-row--pro">
              <button
                type="button"
                className={draft.championshipParallelHeats ? 'chip chip--active' : 'chip'}
                onClick={() => setDraftChampionshipParallelHeats(true)}
              >
                {s('parallelHeats')}
              </button>
              <button
                type="button"
                className={!draft.championshipParallelHeats ? 'chip chip--active' : 'chip'}
                onClick={() => setDraftChampionshipParallelHeats(false)}
              >
                {s('sequentialHeats')}
              </button>
            </div>
            <p className="muted stats-panel__sub">
              {draft.championshipParallelHeats ? s('parallelHint') : s('sequentialHint')}
            </p>
          </>
        ) : null}

        <div className="form-pro">
          <p className="field-label">{s('spot')}</p>
          {spots.length === 0 ? (
            <div className="custom-start-empty">
              <p className="muted">{s('noSpotsHint')}</p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => setView('manage-spots')}
              >
                {s('addSpots')}
              </button>
            </div>
          ) : (
            <label className="field field--pro">
              <span>{s('spot')}</span>
              <select value={draft.spotId} onChange={(e) => setDraftSpot(e.target.value)}>
                {spots.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field field--pro">
            <span>{s('seaConditions')}</span>
            <select value={draft.condition} onChange={(e) => setDraftCondition(e.target.value)}>
              <option value="">{t('common.select')}</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--pro">
            <span>{s('sessionTime')}</span>
            <input type="text" readOnly value={startedLabel} className="input-readonly" />
          </label>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={
            !draft.condition ||
            spots.length === 0 ||
            !draft.spotId ||
            modes.length === 0 ||
            (isCustom && (!draft.customTemplateId || customTemplates.length === 0))
          }
          onClick={() => setView('select-athletes')}
        >
          {s('continue')}
        </button>
      </div>
    </div>
  )
}
