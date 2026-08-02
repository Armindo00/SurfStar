import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { useApp } from '../AppContext'
import {
  describeFullBracket,
  isValidChampionshipField,
  previewBracketRounds,
} from '../championshipUtils'
import { ScreenHeader } from '../components/ScreenHeader'
import { MAX_HEAT_ATHLETES } from '../heatUtils'

export function SelectAthletes() {
  const { t } = useI18n()
  const {
    activeCoachAthletes,
    draft,
    addDraftAthlete,
    removeDraftAthlete,
    confirmAthletesAndStart,
    setView,
  } = useApp()

  const heatCap = draft.mode === 'heats'
  const isCampeonato = draft.mode === 'campeonato'
  const isSeaAnalysis = draft.mode === 'sea-analysis'

  const selectedCount = draft.athleteIds.length

  const bracketPreview = useMemo(() => {
    if (!isCampeonato || selectedCount < 2) return []
    return previewBracketRounds(selectedCount, draft.championshipHeatSize)
  }, [draft.championshipHeatSize, isCampeonato, selectedCount])

  const bracketDetail = useMemo(() => {
    if (!isCampeonato || selectedCount < 2) return ''
    return describeFullBracket(selectedCount, draft.championshipHeatSize)
  }, [draft.championshipHeatSize, isCampeonato, selectedCount])

  const bracketReady = useMemo(() => {
    if (!isCampeonato) return true
    return isValidChampionshipField(selectedCount, draft.championshipHeatSize)
  }, [draft.championshipHeatSize, isCampeonato, selectedCount])

  const toggleAthlete = (id: string) => {
    if (draft.athleteIds.includes(id)) removeDraftAthlete(id)
    else addDraftAthlete(id)
  }

  if (isSeaAnalysis) {
    return (
      <div className="ss-flow">
        <ScreenHeader title={t('nav.seaAnalysis')} onBack={() => setView('start-session')} />
        <div className="ss-card">
          <h2 className="page-title">{t('ui.selectAthletes.readyToObserve')}</h2>
          <p className="muted">{t('ui.selectAthletes.readyToObserveHint')}</p>
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={confirmAthletesAndStart}>
            {t('ui.selectAthletes.openAnalysisScreen')}
          </button>
        </div>
      </div>
    )
  }

  const selectHint = heatCap
    ? t('ui.selectAthletes.heatSelectHint', { max: MAX_HEAT_ATHLETES })
    : isCampeonato
      ? t('ui.selectAthletes.championshipSelectHint')
      : t('ui.selectAthletes.defaultSelectHint')

  const surfersSelectedLabel =
    selectedCount === 1
      ? t('ui.selectAthletes.surfersSelected', { count: selectedCount })
      : t('ui.selectAthletes.surfersSelectedPlural', { count: selectedCount })

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.athletesInSession')} onBack={() => setView('start-session')} />

      <div className="ss-card">
        <h2 className="page-title">{t('ui.selectAthletes.whoIsTraining')}</h2>
        <p className="muted">{selectHint}</p>

        {isCampeonato ? (
          <p className="muted stats-panel__sub">
            {surfersSelectedLabel}
            {selectedCount >= 2 && bracketReady
              ? ` · ${draft.championshipHeatSize === 2 ? t('ui.selectAthletes.bracketTop1') : t('ui.selectAthletes.bracketTop2')} · ${draft.championshipParallelHeats ? t('ui.selectAthletes.parallel') : t('ui.selectAthletes.sequential')}`
              : ''}
          </p>
        ) : null}

        {bracketPreview.length > 0 ? (
          <p className="muted stats-panel__sub">
            {t('ui.selectAthletes.roundsPreview', { rounds: bracketPreview.join(' → ') })}
          </p>
        ) : null}

        {bracketDetail ? (
          <p className="champ-bracket-preview-detail">{bracketDetail}</p>
        ) : isCampeonato && selectedCount === 1 ? (
          <p className="muted stats-panel__sub">{t('ui.selectAthletes.selectMoreForBracket')}</p>
        ) : null}

        <div className="athlete-grid">
          {activeCoachAthletes.length === 0 ? (
            <p className="muted">{t('ui.selectAthletes.noActiveAthletes')}</p>
          ) : null}
          {activeCoachAthletes.map((a) => {
            const selected = draft.athleteIds.includes(a.id)
            return (
              <button
                key={a.id}
                type="button"
                className={selected ? 'athlete-tile athlete-tile--selected' : 'athlete-tile'}
                onClick={() => toggleAthlete(a.id)}
              >
                <span className="athlete-tile__avatar" aria-hidden="true">
                  {a.name.charAt(0).toUpperCase()}
                </span>
                <span className="athlete-tile__name">{a.name}</span>
                {selected && <span className="athlete-tile__check">✓</span>}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={
            draft.athleteIds.length === 0 ||
            (isCampeonato && (selectedCount < 2 || !bracketReady))
          }
          onClick={confirmAthletesAndStart}
        >
          {isCampeonato ? t('ui.selectAthletes.startChampionship') : t('ui.selectAthletes.startTraining')}
        </button>
      </div>
    </div>
  )
}
