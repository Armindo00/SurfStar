import { useState, type FormEvent } from 'react'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'

export function ForgotPasswordView() {
  const { requestPasswordReset, openCoachLogin } = useApp()
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
        setError(result.error)
        return
      }
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <button type="button" className="login-back" onClick={openCoachLogin}>
          ← Back
        </button>

        <div className="login-brand">
          <AppLogo size="lg" />
          <h1>Reset password</h1>
          <p className="muted">We&apos;ll send a link to your email.</p>
        </div>

        {sent ? (
          <p className="login-success">
            If an account exists with that email, you&apos;ll receive reset instructions shortly.
          </p>
        ) : (
          <form className="login-form" onSubmit={(e) => void submit(e)}>
            <label className="field field--login">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
