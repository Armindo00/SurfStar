import { useState } from 'react'
import type { UserRole } from '../types'
import { AuthShell } from '../components/AuthShell'
import { ResetPasswordSheet } from '../components/ResetPasswordSheet'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function ResetPasswordView() {
  const {
    auth,
    authReady,
    forgotPasswordRole,
    openCoachSignIn,
    openAthleteSignIn,
    openForgotPassword,
  } = useApp()
  const { messages } = useI18n()
  const r = messages.auth.resetPassword
  const f = messages.auth.forgotPasswordFlow
  const [done, setDone] = useState(false)
  const [savedRole, setSavedRole] = useState<UserRole | null>(null)

  const role = savedRole ?? auth?.role ?? forgotPasswordRole
  const isCoach = role === 'treinador'
  const roleLabel = isCoach ? messages.roles.coach : messages.roles.athlete

  if (!authReady) {
    return (
      <AuthShell backLabel={f.backLabel} onBack={openCoachSignIn}>
        <p className="muted auth-card__lead">{r.verifyingLink}</p>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell onBack={isCoach ? openCoachSignIn : openAthleteSignIn} backLabel={f.backLabel}>
        <div className="auth-badges">
          <span className="auth-badge auth-badge--role">{roleLabel}</span>
          <span className="auth-badge auth-badge--mode">{r.passwordUpdated}</span>
        </div>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">{r.passwordSaved}</h2>
          <p className="muted auth-card__lead">{r.passwordSavedLead}</p>
        </header>
        <button
          type="button"
          className="btn btn--primary btn--block btn--lg auth-submit"
          onClick={isCoach ? openCoachSignIn : openAthleteSignIn}
        >
          {f.goToSignIn}
        </button>
      </AuthShell>
    )
  }

  if (!auth) {
    return (
      <AuthShell onBack={openCoachSignIn} backLabel={f.backLabel}>
        <div className="auth-badges">
          <span className="auth-badge auth-badge--mode">{f.passwordReset}</span>
        </div>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">{r.resetExpired}</h2>
          <p className="muted auth-card__lead">{r.resetExpiredLead}</p>
        </header>
        <div className="auth-form">
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg auth-submit"
            onClick={() => openForgotPassword('treinador')}
          >
            {r.resetPasswordCoach}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => openForgotPassword('atleta')}
          >
            {r.resetPasswordAthlete}
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <>
      <AuthShell onBack={isCoach ? openCoachSignIn : openAthleteSignIn} backLabel={f.backLabel}>
        <p className="muted auth-card__lead">{r.linkVerified}</p>
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
