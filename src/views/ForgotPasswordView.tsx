import { useState, type FormEvent } from 'react'
import { getContactEmail } from '../config'
import { AuthShell } from '../components/AuthShell'
import { OtpCodeInput } from '../components/OtpCodeInput'
import { ResetPasswordSheet } from '../components/ResetPasswordSheet'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { UserRole } from '../types'
import {
  normalizePasswordResetCode,
  PASSWORD_RESET_OTP_LENGTH,
} from '../passwordRecoveryUtils'

function normalizeCode(value: string): string {
  return normalizePasswordResetCode(value)
}

export function ForgotPasswordView() {
  const {
    requestPasswordReset,
    verifyPasswordResetCode,
    forgotPasswordRole,
    openCoachSignIn,
    openAthleteSignIn,
  } = useApp()
  const { t, messages } = useI18n()
  const f = messages.auth.forgotPasswordFlow
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
        setError(result.error ?? t('errors.sendResetCodeFailed'))
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
    if (normalized.length !== PASSWORD_RESET_OTP_LENGTH) {
      setError(t('auth.forgotPasswordFlow.enterCodeError', { codeLength: PASSWORD_RESET_OTP_LENGTH }))
      return
    }

    setBusy(true)
    try {
      const result = await verifyPasswordResetCode(email, normalized)
      if (!result.ok) {
        setError(result.error ?? t('errors.invalidOrExpiredCode'))
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
        setError(result.error ?? t('errors.resendCodeFailed'))
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
      <AuthShell onBack={back} backLabel={f.backLabel}>
        <div className="auth-badges">
          <span className="auth-badge auth-badge--role">
            {isCoach ? messages.roles.coach : messages.roles.athlete}
          </span>
          <span className="auth-badge auth-badge--mode">{f.passwordReset}</span>
        </div>

        {step === 'email' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">{f.title}</h2>
              <p className="muted auth-card__lead">
                {t('auth.forgotPasswordFlow.lead', {
                  codeLength: PASSWORD_RESET_OTP_LENGTH,
                  contactEmail,
                })}
              </p>
            </header>
            <form className="auth-form" onSubmit={(e) => void sendCode(e)}>
              <label className="auth-field">
                <span>{t('auth.emailAddress')}</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </label>
              {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
              <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
                {busy ? f.sending : f.sendResetCode}
              </button>
            </form>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">{f.enterResetCode}</h2>
              <p className="muted auth-card__lead">
                {t('auth.forgotPasswordFlow.enterResetCodeLead', { codeLength: PASSWORD_RESET_OTP_LENGTH })}
              </p>
            </header>
            <form className="auth-form" onSubmit={(e) => void verifyCode(e)}>
              <label className="auth-field">
                <span>{f.resetCode}</span>
                <OtpCodeInput value={code} onChange={setCode} disabled={busy} />
              </label>
              <p className="muted auth-code-hint">
                {f.sentTo} <strong>{email}</strong>
              </p>
              {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
              <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
                {busy ? f.checking : f.verifyCode}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                disabled={busy}
                onClick={() => void resendCode()}
              >
                {f.resendCode}
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
                {f.useDifferentEmail}
              </button>
            </form>
          </>
        ) : null}

        {step === 'done' ? (
          <>
            <header className="auth-card__head auth-card__head--compact">
              <h2 className="auth-card__title">{f.passwordUpdated}</h2>
              <p className="muted auth-card__lead">{f.passwordUpdatedLead}</p>
            </header>
            <button
              type="button"
              className="btn btn--primary btn--block btn--lg auth-submit"
              onClick={doneIsCoach ? openCoachSignIn : openAthleteSignIn}
            >
              {f.goToSignIn}
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
