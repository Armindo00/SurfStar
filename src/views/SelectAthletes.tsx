import { useApp } from '../AppContext'
import { previewBracketRounds } from '../championshipUtils'
import { ScreenHeader } from '../components/ScreenHeader'
import { MAX_HEAT_ATHLETES } from '../heatUtils'

export function SelectAthletes() {
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

  const bracketPreview =
    isCampeonato && draft.athleteIds.length >= 2
      ? previewBracketRounds(draft.athleteIds.length, draft.championshipHeatSize)
      : []

  const toggleAthlete = (id: string) => {
    if (draft.athleteIds.includes(id)) removeDraftAthlete(id)
    else addDraftAthlete(id)
  }

  if (isSeaAnalysis) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Sea analysis" onBack={() => setView('start-session')} />
        <div className="ss-card">
          <h2 className="page-title">Ready to observe</h2>
          <p className="muted">
            You will watch the ocean for 30 minutes and log sets and intermediate waves at Peak 1 and
            Peak 2. No athletes need to be selected.
          </p>
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={confirmAthletesAndStart}>
            Open analysis screen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Athletes in session" onBack={() => setView('start-session')} />

      <div className="ss-card">
        <h2 className="page-title">Who is training today?</h2>
        <p className="muted">
          {heatCap
            ? `Select up to ${MAX_HEAT_ATHLETES} surfers for this heat.`
            : isCampeonato
              ? 'Select everyone in today\'s contest. Heats will have 3 or 4 surfers depending on the total — SurfStar builds the full bracket.'
              : 'Tap to select or deselect. You can pick multiple athletes.'}
        </p>

        {bracketPreview.length > 0 ? (
          <p className="muted stats-panel__sub">
            Bracket preview: {bracketPreview.join(' → ')}
          </p>
        ) : null}

        <div className="athlete-grid">
          {activeCoachAthletes.length === 0 ? (
            <p className="muted">No active athletes. Pair with athletes using their code in Athletes & pairing.</p>
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
          disabled={draft.athleteIds.length === 0 || (isCampeonato && draft.athleteIds.length < 2)}
          onClick={confirmAthletesAndStart}
        >
          {isCampeonato ? 'Start championship' : 'Start training'}
        </button>
      </div>
    </div>
  )
}
