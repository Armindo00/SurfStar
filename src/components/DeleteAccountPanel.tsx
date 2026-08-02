import { useEffect, useState, type FormEvent } from 'react'
import { cloudFetchMyAccountDeletionRequest, cloudRequestAccountDeletion } from '../accountDeletionApi'
import { getContactEmail } from '../config'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

type Props = {
  roleLabel: 'coach' | 'athlete'
  subscriptionActive?: boolean
  subscriptionCanceled?: boolean
}

export function DeleteAccountPanel({ roleLabel, subscriptionActive, subscriptionCanceled }: Props) {
  const { cloudMode, logout } = useApp()
  const { messages, t } = useI18n()
  const d = messages.components.deleteAccount
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  const roleWord = roleLabel === 'coach' ? d.roleCoach : d.roleAthlete

  useEffect(() => {
    if (!cloudMode) return
    void cloudFetchMyAccountDeletionRequest().then((result) => {
      if (result.ok && result.request?.status === 'pending') {
        setPending(true)
      }
    })
  }, [cloudMode])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!cloudMode) {
      window.location.href = `mailto:${getContactEmail()}?subject=${encodeURIComponent('Account deletion request')}`
      return
    }

    setBusy(true)
    try {
      const result = await cloudRequestAccountDeletion(reason)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPending(true)
      setConfirmOpen(false)
      setSuccess(d.successMessage)
    } finally {
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <div className="ss-card stats-panel subscription-delete-panel">
        <h2 className="stats-panel__title">{d.title}</h2>
        <p className="login-success">
          {t('components.deleteAccount.pendingMessage', { email: getContactEmail() })}
        </p>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => void logout()}>
          {d.signOut}
        </button>
      </div>
    )
  }

  return (
    <div className="ss-card stats-panel subscription-delete-panel">
      <h2 className="stats-panel__title">{d.title}</h2>
      <p className="muted">{t('components.deleteAccount.description', { role: roleWord })}</p>
      {roleLabel === 'coach' && subscriptionActive && !subscriptionCanceled ? (
        <p className="checkout-notice__lead">{d.cancelSubscriptionHint}</p>
      ) : null}
      {!confirmOpen ? (
        <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirmOpen(true)}>
          {d.requestDeletion}
        </button>
      ) : (
        <form className="form-pro" onSubmit={(e) => void submit(e)}>
          <label className="field field--pro">
            <span>{d.reasonOptional}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={d.reasonPlaceholder}
            />
          </label>
          <p className="muted">{d.confirmHint}</p>
          {error ? <p className="login-error">{error}</p> : null}
          {success ? <p className="login-success">{success}</p> : null}
          <div className="subscription-cancel-confirm__actions">
            <button type="submit" className="btn btn--danger" disabled={busy}>
              {busy ? d.submitting : d.confirmDeletion}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => setConfirmOpen(false)}
            >
              {d.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
