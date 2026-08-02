import { useState } from 'react'
import { MIN_PASSWORD_LENGTH, validatePasswordStrength } from '../passwordUtils'
import { AppLogo } from '../components/AppLogo'
import { InstallAppBanner } from '../components/InstallAppBanner'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function ChangePasswordView() {
  const { changePassword, logout } = useApp()
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (password !== confirm) {
      setError(t('ui.changePassword.passwordsMismatch'))
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
      <InstallAppBanner />
      <div className="login-card">
        <div className="login-brand">
          <AppLogo size="lg" />
          <div>
            <h1>{t('ui.changePassword.title')}</h1>
            <p>{t('ui.changePassword.lead')}</p>
          </div>
        </div>

        <div className="athlete-login-form">
          <label className="field field--pro">
            <span>{t('ui.changePassword.newPasswordMin', { min: MIN_PASSWORD_LENGTH })}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="field field--pro">
            <span>{t('ui.changePassword.confirmNewPassword')}</span>
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
            {busy ? t('ui.changePassword.saving') : t('ui.changePassword.saveAndContinue')}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            {t('ui.changePassword.signOut')}
          </button>
        </div>
      </div>
    </div>
  )
}
