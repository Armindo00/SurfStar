import { useState } from 'react'
import type { UserRole } from '../types'
import { AuthShell } from '../components/AuthShell'
import { ResetPasswordSheet } from '../components/ResetPasswordSheet'
import { useApp } from '../AppContext'

export function ResetPasswordView() {
  const {
    auth,
    authReady,
    forgotPasswordRole,
    openCoachSignIn,
    openAthleteSignIn,
    openForgotPassword,
  } = useApp()
  const [done, setDone] = useState(false)
  const [savedRole, setSavedRole] = useState<UserRole | null>(null)

  const role = savedRole ?? auth?.role ?? forgotPasswordRole
  const isCoach = role === 'treinador'
  const roleLabel = isCoach ? 'Coach' : 'Athlete'

  if (!authReady) {
    return (
      <AuthShell backLabel="Sign in" onBack={openCoachSignIn}>
        <p className="muted auth-card__lead">Verifying reset link…</p>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell onBack={isCoach ? openCoachSignIn : openAthleteSignIn} backLabel="Sign in">
        <div className="auth-badges">
          <span className="auth-badge auth-badge--role">{roleLabel}</span>
          <span className="auth-badge auth-badge--mode">Password updated</span>
        </div>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">Password saved</h2>
          <p className="muted auth-card__lead">Your new password is ready. Sign in to continue.</p>
        </header>
        <button
          type="button"
          className="btn btn--primary btn--block btn--lg auth-submit"
          onClick={isCoach ? openCoachSignIn : openAthleteSignIn}
        >
          Go to sign in
        </button>
      </AuthShell>
    )
  }

  if (!auth) {
    return (
      <AuthShell onBack={openCoachSignIn} backLabel="Sign in">
        <div className="auth-badges">
          <span className="auth-badge auth-badge--mode">Password reset</span>
        </div>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">Reset expired</h2>
          <p className="muted auth-card__lead">
            Request a new code from the sign-in page and enter it in the app.
          </p>
        </header>
        <div className="auth-form">
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg auth-submit"
            onClick={() => openForgotPassword('treinador')}
          >
            Reset password (Coach)
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => openForgotPassword('atleta')}
          >
            Reset password (Athlete)
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <>
      <AuthShell onBack={isCoach ? openCoachSignIn : openAthleteSignIn} backLabel="Sign in">
        <p className="muted auth-card__lead">Link verified. Choose your new password below.</p>
      </AuthShell>
      <ResetPasswordSheet
        open
        email={auth.email}
        role={auth.role}
        onClose={isCoach ? openCoachSignIn : openAthleteSignIn}
        onSuccess={(nextRole) => {
          setSavedRole(nextRole)
          setDone(true)
        }}
      />
    </>
  )
}
