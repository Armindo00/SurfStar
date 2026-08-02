import { useMemo, useState } from 'react'
import { SessionFeedbackSheet } from './SessionFeedbackSheet'
import { useToast } from './ToastProvider'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { UNSEEN } from '../unseenDomains'

export function SessionFeedbackPortal() {
  const {
    auth,
    pendingSessionFeedback,
    skipSessionFeedback,
    priorityFeedbackSessionId,
    clearPrioritySessionFeedback,
    markSeen,
  } = useApp()
  const { t } = useI18n()
  const { showToast } = useToast()
  const [dismissedSessionIds, setDismissedSessionIds] = useState<string[]>([])

  const session = useMemo(() => {
    if (auth?.role !== 'atleta') return null
    if (priorityFeedbackSessionId) {
      return pendingSessionFeedback.find((row) => row.id === priorityFeedbackSessionId) ?? null
    }
    return pendingSessionFeedback.find((row) => !dismissedSessionIds.includes(row.id)) ?? null
  }, [auth?.role, dismissedSessionIds, pendingSessionFeedback, priorityFeedbackSessionId])

  if (!session) return null

  const dismiss = () => {
    setDismissedSessionIds((prev) =>
      prev.includes(session.id) ? prev : [...prev, session.id],
    )
    clearPrioritySessionFeedback()
  }

  return (
    <SessionFeedbackSheet
      key={session.id}
      session={session}
      onSubmitted={() => {
        dismiss()
        markSeen(UNSEEN.athleteCheckins, [session.id])
        showToast(t('components.sessionFeedback.checkinSubmitted'), 'success')
      }}
      onSkip={() => {
        skipSessionFeedback(session.id)
        dismiss()
      }}
    />
  )
}
