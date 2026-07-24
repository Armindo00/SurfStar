import { useApp } from '../AppContext'
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
  const isSeaAnalysis = draft.mode === 'sea-analysis'

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
            : 'Tap to select or deselect. You can pick multiple athletes.'}
        </p>

        <div className="athlete-grid">
          {activeCoachAthletes.length === 0 ? (
            <p className="muted">No active athletes. Add athletes or unblock someone in Athletes & logins.</p>
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
          disabled={draft.athleteIds.length === 0}
          onClick={confirmAthletesAndStart}
        >
          Start training
        </button>
      </div>
    </div>
  )
}
