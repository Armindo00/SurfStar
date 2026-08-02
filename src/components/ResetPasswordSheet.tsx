import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
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
  const { t, messages } = useI18n()
  const r = messages.auth.resetPassword
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(messages.auth.passwordsMismatch)
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

  const roleLabel = role === 'treinador' ? messages.roles.coach : messages.roles.athlete

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
            <p className="sheet__eyebrow">{t('auth.resetPassword.sheetEyebrow', { roleLabel })}</p>
            <h2 id="reset-password-title">{r.chooseNewPassword}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={close} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <p className="muted reset-password-sheet__intro">
          {t('auth.resetPassword.codeVerifiedFor', { email })}
        </p>

        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label className="auth-field">
            <span>{t('auth.resetPassword.newPasswordMin', { minLength: MIN_PASSWORD_LENGTH })}</span>
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
            <span>{r.confirmNewPassword}</span>
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
            {busy ? r.saving : r.saveNewPassword}
          </button>
        </form>
      </div>
    </div>
  )
}
