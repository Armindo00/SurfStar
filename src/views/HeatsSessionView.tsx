import { useState } from 'react'
import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'

export function HeatsSessionView() {
  const { activeSession, setView, endActiveSession, cancelActiveSession } = useApp()
  const [toolsOpen, setToolsOpen] = useState(false)

  const heat = activeSession?.heats[0]

  if (!activeSession || activeSession.mode !== 'heats') {
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
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Heats" onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <HeatRunnerPanel heat={heat} />
      </div>

      <section className="ss-card ss-tools-wrap">
        <button type="button" className="ss-tools__toggle" onClick={() => setToolsOpen((v) => !v)}>
          Session tools
        </button>
        {toolsOpen && (
          <div className="ss-tools__body">
            <button type="button" className="btn btn--danger btn--block" onClick={cancelActiveSession}>
              Cancel session
            </button>
            <button type="button" className="btn btn--primary btn--block" onClick={endActiveSession}>
              End session
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
