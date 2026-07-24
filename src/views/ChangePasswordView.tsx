import { useState } from 'react'
import { MIN_PASSWORD_LENGTH, validatePasswordStrength } from '../passwordUtils'
import { useApp } from '../AppContext'

export function ChangePasswordView() {
  const { changePassword, logout } = useApp()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    const pwdError = validatePasswordStrength(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    setBusy(true)
    try {
      const result = await changePassword(password)
      if (!result.ok) {
        setError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand__mark" aria-hidden="true">
            ★
          </span>
          <h1>Set your password</h1>
          <p>
            Your coach created your account. Choose a new password before continuing — you will use
            this password from now on.
          </p>
        </div>

        <div className="athlete-login-form">
          <label className="field field--pro">
            <span>New password (min. {MIN_PASSWORD_LENGTH})</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="field field--pro">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={busy || !password || !confirm}
            onClick={submit}
          >
            {busy ? 'Saving…' : 'Save password and continue'}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
