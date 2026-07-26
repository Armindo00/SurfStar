import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { useApp } from '../AppContext'

export function ForgotPasswordView() {
  const { requestPasswordReset, openCoachSignIn } = useApp()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await requestPasswordReset(email)
      if (!result.ok) {
        setError(result.error ?? 'Could not send reset email.')
        return
      }
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={openCoachSignIn} backLabel="Sign in">
      <div className="auth-badges">
        <span className="auth-badge auth-badge--role">Coach</span>
        <span className="auth-badge auth-badge--mode">Password reset</span>
      </div>

      <header className="auth-card__head auth-card__head--compact">
        <h2 className="auth-card__title">Forgot password</h2>
      </header>

      {sent ? (
        <p className="auth-alert auth-alert--success">
          If an account exists with that email, you will receive reset instructions shortly.
        </p>
      ) : (
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
          <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
