import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPrice, getPlan } from '../plans'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'
import type { AuthPublicView } from '../types'

const SCREEN_COPY: Record<
  AuthPublicView,
  { title: string; submitSignIn: string; submitSignUp: string; switchPrompt: string; switchAction: string }
> = {
  'coach-sign-in': {
    title: 'Coach sign in',
    submitSignIn: 'Sign in',
    submitSignUp: '',
    switchPrompt: 'New coach?',
    switchAction: 'Create coach account',
  },
  'coach-sign-up': {
    title: 'Create coach account',
    submitSignIn: '',
    submitSignUp: 'Create coach account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Coach sign in',
  },
  'athlete-sign-in': {
    title: 'Athlete sign in',
    submitSignIn: 'Sign in',
    submitSignUp: '',
    switchPrompt: 'New athlete?',
    switchAction: 'Create athlete account',
  },
  'athlete-sign-up': {
    title: 'Create athlete account',
    submitSignIn: '',
    submitSignUp: 'Create athlete account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Athlete sign in',
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
  const copy = SCREEN_COPY[screen]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedPlan = selectedPlanId && isCoach ? getPlan(selectedPlanId) : null

  const switchAuthScreen = () => {
    setError('')
    setName('')
    setPasswordConfirm('')
    if (screen === 'coach-sign-in') openCoachPlanSelection()
    else if (screen === 'coach-sign-up') openCoachSignIn()
    else if (screen === 'athlete-sign-in') openAthleteSignUp()
    else openAthleteSignIn()
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
        if (!result.ok) setError(result.error)
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
    <div className="login-page">
      <div className="login-card">
        <button type="button" className="login-back" onClick={openLanding}>
          ← Back to home
        </button>

        <div className="login-brand">
          <AppLogo size="xl" />
          <div>
            <p>Surf stats for coaches and athletes</p>
            {cloudMode ? <p className="login-cloud-tag">Online · cloud version</p> : null}
          </div>
        </div>

        <p className="login-role-tag">{isCoach ? 'Coach' : 'Athlete'}</p>
        <h1 className="login-screen-title">{copy.title}</h1>

        {selectedPlan ? (
          <div className="login-plan-banner">
            <span>Selected plan</span>
            <strong>
              {selectedPlan.name} · {formatPlanPrice(selectedPlan)}/mo
            </strong>
          </div>
        ) : null}

        <form className="login-form" onSubmit={submit}>
          {isRegister ? (
            <label className="field field--login">
              <span>Your name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isCoach ? 'Coach name' : 'Athlete name'}
                required
              />
            </label>
          ) : null}

          <label className="field field--login">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field field--login">
            <span>Password</span>
            <input
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
              required
            />
          </label>

          {isRegister ? (
            <label className="field field--login">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            </label>
          ) : null}

          {error && <p className="login-error">{error}</p>}
          {!isRegister && cloudMode && isCoach ? (
            <button type="button" className="login-forgot btn btn--ghost btn--block" onClick={openForgotPassword}>
              Forgot password
            </button>
          ) : null}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy
              ? 'Please wait…'
              : isRegister
                ? selectedPlan
                  ? `Create account · ${selectedPlan.name}`
                  : copy.submitSignUp
                : copy.submitSignIn}
          </button>
        </form>

        <p className="login-switch">
          {copy.switchPrompt}{' '}
          <button type="button" className="login-switch__btn" onClick={switchAuthScreen}>
            {copy.switchAction}
          </button>
        </p>

        <aside className="login-demo">
          <p className="login-demo__title">Accounts</p>
          {isCoach ? (
            <p>
              <strong>Coach:</strong> pick a plan, create an account, and activate your subscription to manage
              athletes and sessions.
            </p>
          ) : (
            <p>
              <strong>Athlete:</strong> create your own account once. Share your pairing code with each coach.
            </p>
          )}
          <p className="muted login-demo__note">
            {cloudMode
              ? 'Accounts and sessions are stored securely in the cloud — use the same login on any device.'
              : 'Data stays on this device (browser). Use the same phone/browser to keep your sessions.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
