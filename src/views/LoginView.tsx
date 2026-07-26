import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPrice, getPlan } from '../plans'
import { useApp } from '../AppContext'
import type { AuthPublicView } from '../types'

const SCREEN_COPY: Record<
  AuthPublicView,
  {
    roleLabel: string
    modeLabel: string
    title: string
    submit: string
    switchPrompt: string
    switchActionLabel: string
    otherRolePrompt: string
    otherRoleActionLabel: string
  }
> = {
  'coach-sign-in': {
    roleLabel: 'Coach',
    modeLabel: 'Sign in',
    title: 'Coach sign in',
    submit: 'Sign in',
    switchPrompt: 'New coach?',
    switchActionLabel: 'Create coach account',
    otherRolePrompt: 'Are you an athlete?',
    otherRoleActionLabel: 'Athlete sign in',
  },
  'coach-sign-up': {
    roleLabel: 'Coach',
    modeLabel: 'Create account',
    title: 'Create coach account',
    submit: 'Create coach account',
    switchPrompt: 'Already have a coach account?',
    switchActionLabel: 'Coach sign in',
    otherRolePrompt: 'Are you an athlete?',
    otherRoleActionLabel: 'Create athlete account',
  },
  'athlete-sign-in': {
    roleLabel: 'Athlete',
    modeLabel: 'Sign in',
    title: 'Athlete sign in',
    submit: 'Sign in',
    switchPrompt: 'New athlete?',
    switchActionLabel: 'Create athlete account',
    otherRolePrompt: 'Are you a coach?',
    otherRoleActionLabel: 'Coach sign in',
  },
  'athlete-sign-up': {
    roleLabel: 'Athlete',
    modeLabel: 'Create account',
    title: 'Create athlete account',
    submit: 'Create athlete account',
    switchPrompt: 'Already have an athlete account?',
    switchActionLabel: 'Athlete sign in',
    otherRolePrompt: 'Are you a coach?',
    otherRoleActionLabel: 'Create coach account',
  },
}

export function LoginView() {
  const {
    loginAsCoach,
    loginAsStudent,
    registerCoach,
    registerAthlete,
    cloudMode,
    publicView,
    selectedPlanId,
    openLanding,
    openForgotPassword,
    openCoachSignIn,
    openCoachPlanSelection,
    openAthleteSignIn,
    openAthleteSignUp,
  } = useApp()

  const screen = publicView as AuthPublicView
  const isCoach = screen.startsWith('coach')
  const isRegister = screen.endsWith('sign-up')

  const copy = (() => {
    const base = SCREEN_COPY[screen]
    const switchAction =
      screen === 'coach-sign-in'
        ? openCoachPlanSelection
        : screen === 'coach-sign-up'
          ? openCoachSignIn
          : screen === 'athlete-sign-in'
            ? openAthleteSignUp
            : openAthleteSignIn
    const otherRoleAction =
      isCoach
        ? screen === 'coach-sign-up'
          ? openAthleteSignUp
          : openAthleteSignIn
        : screen === 'athlete-sign-up'
          ? openCoachPlanSelection
          : openCoachSignIn
    return { ...base, switchAction, otherRoleAction }
  })()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedPlan = selectedPlanId && isCoach ? getPlan(selectedPlanId) : null

  const goToAlternateScreen = () => {
    setError('')
    setName('')
    setPasswordConfirm('')
    copy.switchAction()
  }

  const goToOtherRole = () => {
    setError('')
    setName('')
    setPasswordConfirm('')
    copy.otherRoleAction()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const trimmedEmail = email.trim()

      if (isRegister) {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.')
          return
        }
        const result = isCoach
          ? await registerCoach(name, trimmedEmail, password)
          : await registerAthlete(name, trimmedEmail, password)
        if (!result.ok) setError(result.error ?? 'Could not create account.')
        return
      }

      const result = isCoach
        ? await loginAsCoach(trimmedEmail, password)
        : await loginAsStudent(trimmedEmail, password)
      if (!result.ok) setError(result.error ?? 'Sign in failed.')
    } catch (err) {
      console.error('Login submit failed', err)
      setError(err instanceof Error ? err.message : 'Sign in failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={openLanding} backLabel="Home" showTagline>
      <div className="auth-badges">
        <span className="auth-badge auth-badge--role">{copy.roleLabel}</span>
        <span className="auth-badge auth-badge--mode">{copy.modeLabel}</span>
      </div>

      <header className="auth-card__head auth-card__head--compact">
        <h2 className="auth-card__title">{copy.title}</h2>
      </header>

      {selectedPlan ? (
        <div className="auth-plan-banner">
          <span className="auth-plan-banner__label">Selected plan</span>
          <strong>
            {selectedPlan.name} · {formatPlanPrice(selectedPlan)}/mo
          </strong>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        {isRegister ? (
          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCoach ? 'e.g. João Silva' : 'e.g. Maria Costa'}
              required
            />
          </label>
        ) : null}

        <label className="auth-field">
          <span>Email address</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
            placeholder={isRegister ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
            required
          />
        </label>

        {isRegister ? (
          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              placeholder="Repeat password"
              required
            />
          </label>
        ) : null}

        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}

        {!isRegister && cloudMode && isCoach ? (
          <button type="button" className="auth-forgot" onClick={openForgotPassword}>
            Forgot password?
          </button>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
          {busy
            ? 'Please wait…'
            : isRegister && selectedPlan
              ? `Create account · ${selectedPlan.name}`
              : copy.submit}
        </button>
      </form>

      <p className="auth-switch">
        {copy.switchPrompt}{' '}
        <button type="button" className="auth-switch__btn" onClick={goToAlternateScreen}>
          {copy.switchActionLabel}
        </button>
      </p>

      <p className="auth-switch auth-switch--muted">
        {copy.otherRolePrompt}{' '}
        <button type="button" className="auth-switch__btn" onClick={goToOtherRole}>
          {copy.otherRoleActionLabel}
        </button>
      </p>
    </AuthShell>
  )
}
