import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { SessionStickyBar } from '../components/SessionStickyBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { resolveSessionMode } from '../sessionModeUtils'

export function HeatsSessionView() {
  const { activeSession, setView } = useApp()

  const heat = activeSession?.heats[0]
  const sessionMode = activeSession ? resolveSessionMode(activeSession) : null

  if (!activeSession || sessionMode !== 'heats') {
    return (
      <div className="ss-flow">
        <p className="muted">No active heats session.</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          Back
        </button>
      </div>
    )
  }

  if (!heat) {
    return (
      <div className="ss-flow">
        <p className="muted">Heat setup missing.</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training ss-flow--with-sticky">
      <ScreenHeader title="Heats" onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <HeatRunnerPanel heat={heat} />
      </div>

      <SessionStickyBar />
    </div>
  )
}
