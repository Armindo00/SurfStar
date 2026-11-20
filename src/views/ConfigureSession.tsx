import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { SessionSetupSteps } from '../components/SessionSetupSteps'
import { useI18n } from '../i18n'
import { trainingModeLabel } from '../i18n/labels'
import { HEAT_DURATIONS } from '../types'

export function ConfigureSession() {
  const {
    draft,
    spots,
    conditions,
    customTemplates,
    setDraftCustomTemplate,
    setDraftSpot,
    setDraftCondition,
    setDraftHeatDuration,
    setDraftChampionshipHeatSize,
    setDraftChampionshipParallelHeats,
    setView,
    openFromSessionSetup,
    confirmAthletesAndStart,
  } = useApp()
  const { t } = useI18n()
  const s = (key: string, params?: Record<string, string | number>) => t(`session.setup.${key}`, params)

  const showHeatDuration = draft.mode === 'heats' || draft.mode === 'campeonato'
  const isCampeonato = draft.mode === 'campeonato'
  const isSeaAnalysis = draft.mode === 'sea-analysis'
  const isCustom = draft.mode === 'custom'
  const selectedTemplate = customTemplates.find((tmpl) => tmpl.id === draft.customTemplateId)
  const totalSteps = isSeaAnalysis ? 2 : 3

  const missingSpots = spots.length === 0 || !draft.spotId
  const missingCondition = !draft.condition
  const missingTemplate = isCustom && (!draft.customTemplateId || customTemplates.length === 0)
  const canContinue = !missingSpots && !missingCondition && !missingTemplate

  const blockerHint = (() => {
    if (missingSpots) return s('needSpot')
    if (missingCondition) return s('needCondition')
    if (missingTemplate) return s('needTemplate')
    return ''
  })()

  const continueLabel = isSeaAnalysis ? s('startSeaAnalysis') : s('continueToAthletes')

  const onContinue = () => {
    if (!canContinue) return
    if (isSeaAnalysis) {
      confirmAthletesAndStart()
      return
    }
    setView('select-athletes')
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.sessionSettings')} onBack={() => setView('start-session')} />
      <div className="ss-card stats-panel">
        <SessionSetupSteps current={2} totalSteps={totalSteps} />
        <h2 className="stats-panel__title">{s('step2Title')}</h2>
        <p className="muted stats-panel__sub">
          {s('step2Subtitle', { mode: trainingModeLabel(draft.mode) })}
        </p>

        {isCustom ? (
          <>
            <p className="field-label">{s('trainingTemplate')}</p>
            {customTemplates.length === 0 ? (
              <div className="custom-start-empty">
                <p className="muted">{s('noTemplatesHint')}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => openFromSessionSetup('manage-custom-templates')}
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
                  onClick={() => openFromSessionSetup('manage-custom-templates')}
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
          {spots.length === 0 ? (
            <div className="custom-start-empty">
              <p className="field-label">{s('spot')}</p>
              <p className="muted">{s('noSpotsHint')}</p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => openFromSessionSetup('manage-spots')}
              >
                {s('addSpots')}
              </button>
            </div>
          ) : (
            <>
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
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => openFromSessionSetup('manage-spots')}
              >
                {s('manageSpots')}
              </button>
            </>
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
        </div>

        {blockerHint ? <p className="session-setup-blocker muted">{blockerHint}</p> : null}

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={!canContinue}
          onClick={onContinue}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
