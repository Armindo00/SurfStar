import { useState, type FormEvent } from 'react'
import { getContactEmail } from '../config'
import { AuthShell } from '../components/AuthShell'
import { OtpCodeInput } from '../components/OtpCodeInput'
import { ResetPasswordSheet } from '../components/ResetPasswordSheet'
import { useApp } from '../AppContext'
import type { UserRole } from '../types'

function normalizeCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function ForgotPasswordView() {
  const {
    requestPasswordReset,
    verifyPasswordResetCode,
    forgotPasswordRole,
    openCoachSignIn,
    openAthleteSignIn,
  } = useApp()
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [savedRole, setSavedRole] = useState<UserRole | null>(null)

  const isCoach = forgotPasswordRole === 'treinador'
  const back = isCoach ? openCoachSignIn : openAthleteSignIn
  const contactEmail = getContactEmail()

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await requestPasswordReset(email)
      if (!result.ok) {
        setError(result.error ?? 'Could not send reset code.')
        return
      }
      setStep('code')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const normalized = normalizeCode(code)
    if (normalized.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setBusy(true)
    try {
      const result = await verifyPasswordResetCode(email, normalized)
      if (!result.ok) {
        setError(result.error ?? 'Invalid or expired code.')
        return
      }
      setSheetOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const resendCode = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await requestPasswordReset(email)
      if (!result.ok) {
        setError(result.error ?? 'Could not resend code.')
        return
      }
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const handlePasswordSaved = (role: UserRole) => {
    setSheetOpen(false)
    setSavedRole(role)
    setStep('done')
  }

  const doneRole = savedRole ?? forgotPasswordRole
  const doneIsCoach = doneRole === 'treinador'

  return (
    <>
      <AuthShell onBack={back} backLabel="Sign in">
        <div className="auth-badges">
          <span className="auth-badge auth-badge--role">{isCoach ? 'Coach' : 'Athlete'}</span>
          <span className="auth-badge auth-badge--mode">Password reset</span>
        </div>

        {step === 'email' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">Forgot password</h2>
              <p className="muted auth-card__lead">
                Enter your account email. We&apos;ll send a 6-digit code from{' '}
                <strong>{contactEmail}</strong> so you can set a new password.
              </p>
            </header>
            <form className="auth-form" onSubmit={(e) => void sendCode(e)}>
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
                {busy ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">Enter reset code</h2>
              <p className="muted auth-card__lead">
                Check your inbox for an email from SurfStar. Paste the 6-digit code below.
              </p>
            </header>
            <form className="auth-form" onSubmit={(e) => void verifyCode(e)}>
              <label className="auth-field">
                <span>Reset code</span>
                <OtpCodeInput value={code} onChange={setCode} disabled={busy} />
              </label>
              <p className="muted auth-code-hint">
                Sent to <strong>{email}</strong>
              </p>
              {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
              <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
                {busy ? 'Checking…' : 'Verify code'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                disabled={busy}
                onClick={() => void resendCode()}
              >
                Resend code
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                disabled={busy}
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError('')
                }}
              >
                Use a different email
              </button>
            </form>
          </>
        ) : null}

        {step === 'done' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">Password updated</h2>
              <p className="muted auth-card__lead">
                Your new password is ready. Sign in to continue using SurfStar.
              </p>
            </header>
            <button
              type="button"
              className="btn btn--primary btn--block btn--lg auth-submit"
              onClick={doneIsCoach ? openCoachSignIn : openAthleteSignIn}
            >
              Go to sign in
            </button>
          </>
        ) : null}
      </AuthShell>

      <ResetPasswordSheet
        open={sheetOpen}
        email={email}
        role={forgotPasswordRole}
        onClose={() => setSheetOpen(false)}
        onSuccess={handlePasswordSaved}
      />
    </>
  )
}
