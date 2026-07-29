import { useEffect, useState, type FormEvent } from 'react'
import { cloudFetchMyAccountDeletionRequest, cloudRequestAccountDeletion } from '../accountDeletionApi'
import { getContactEmail } from '../config'
import { useApp } from '../AppContext'

type Props = {
  roleLabel: 'coach' | 'athlete'
  subscriptionActive?: boolean
  subscriptionCanceled?: boolean
}

export function DeleteAccountPanel({ roleLabel, subscriptionActive, subscriptionCanceled }: Props) {
  const { cloudMode, logout } = useApp()
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

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
      setSuccess(
        'Deletion request submitted. We will process it within 30 days and email you at the address on your account.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <div className="ss-card stats-panel subscription-delete-panel">
        <h2 className="stats-panel__title">Delete account</h2>
        <p className="login-success">
          Your deletion request is pending review. Contact {getContactEmail()} if you submitted this by mistake.
        </p>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="ss-card stats-panel subscription-delete-panel">
      <h2 className="stats-panel__title">Delete account</h2>
      <p className="muted">
        Request permanent deletion of your SurfStar {roleLabel} account and personal data. This cannot be undone once
        processed.
      </p>
      {roleLabel === 'coach' && subscriptionActive && !subscriptionCanceled ? (
        <p className="checkout-notice__lead">
          We recommend canceling your subscription first. You can still request deletion while subscribed — access ends
          when the account is deleted.
        </p>
      ) : null}
      {!confirmOpen ? (
        <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirmOpen(true)}>
          Request account deletion
        </button>
      ) : (
        <form className="form-pro" onSubmit={(e) => void submit(e)}>
          <label className="field field--pro">
            <span>Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us why you are leaving (optional)"
            />
          </label>
          <p className="muted">By submitting, you confirm you want your account and personal data permanently deleted.</p>
          {error ? <p className="login-error">{error}</p> : null}
          {success ? <p className="login-success">{success}</p> : null}
          <div className="subscription-cancel-confirm__actions">
            <button type="submit" className="btn btn--danger" disabled={busy}>
              {busy ? 'Submitting…' : 'Confirm deletion request'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
