import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'
import type { UserRole } from '../types'

type Props = {
  open: boolean
  email: string
  role: UserRole
  onClose: () => void
  onSuccess: (role: UserRole) => void
}

export function ResetPasswordSheet({ open, email, role, onClose, onSuccess }: Props) {
  const { completePasswordRecovery } = useApp()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const result = await completePasswordRecovery(password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPassword('')
      setConfirm('')
      onSuccess(result.role)
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    if (busy) return
    setPassword('')
    setConfirm('')
    setError('')
    onClose()
  }

  const roleLabel = role === 'treinador' ? 'Coach' : 'Athlete'

  return (
    <div className="modal-backdrop" role="presentation" onClick={close}>
      <div
        className="modal sheet sheet--form reset-password-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{roleLabel} · Password reset</p>
            <h2 id="reset-password-title">Choose a new password</h2>
          </div>
          <button type="button" className="sheet__close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted reset-password-sheet__intro">
          Code verified for <strong>{email}</strong>. Save a new password to finish.
        </p>

        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label className="auth-field">
            <span>New password (min. {MIN_PASSWORD_LENGTH})</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </label>
          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </label>
          {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
