import { useState } from 'react'
import { useApp } from '../AppContext'

export function SessionTools() {
  const { cancelActiveSession, openEndSessionSheet } = useApp()
  const [toolsOpen, setToolsOpen] = useState(false)

  return (
    <section className="ss-card ss-tools-wrap">
      <button type="button" className="ss-tools__toggle" onClick={() => setToolsOpen((v) => !v)}>
        Session tools
      </button>
      {toolsOpen ? (
        <div className="ss-tools__body">
          <button type="button" className="btn btn--danger btn--block" onClick={cancelActiveSession}>
            Cancel session
          </button>
          <button type="button" className="btn btn--primary btn--block" onClick={openEndSessionSheet}>
            End session
          </button>
        </div>
      ) : null}
    </section>
  )
}
