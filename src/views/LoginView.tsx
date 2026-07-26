import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { AppLogo } from '../components/AppLogo'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPrice, getPlan } from '../plans'
import { useApp } from '../AppContext'
import type { AuthPublicView } from '../types'

const COACH_BULLETS = [
  'Live stats, heats, and full championship brackets',
  'Team analytics with month-by-month evolution',
  'Pair unlimited athletes with a simple code',
]

const ATHLETE_BULLETS = [
  'Global stats that follow you across every coach',
  'Session history, heat results, and season totals',
  'One account — pair with as many coaches as you need',
]

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

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedPlan = selectedPlanId && isCoach ? getPlan(selectedPlanId) : null

  const switchRole = (coach: boolean) => {
    setError('')
    setName('')
    setPasswordConfirm('')
    if (coach) {
      if (isRegister) openCoachPlanSelection()
      else openCoachSignIn()
    } else if (isRegister) {
      openAthleteSignUp()
    } else {
      openAthleteSignIn()
    }
  }

  const switchMode = (register: boolean) => {
    setError('')
    setName('')
    setPasswordConfirm('')
    if (isCoach) {
      if (register) openCoachPlanSelection()
      else openCoachSignIn()
    } else if (register) {
      openAthleteSignUp()
    } else {
      openAthleteSignIn()
    }
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

  const heroTitle = isCoach
    ? 'Professional surf coaching, powered by data'
    : 'Your surfing progress, measured and visible'

  const heroSubtitle = isCoach
    ? 'Run sessions, build brackets, and give athletes feedback backed by real numbers — not guesswork.'
    : 'See every session, heat result, and season stat in one place — no matter which coach you train with.'

  return (
    <AuthShell
      onBack={openLanding}
      backLabel="Home"
      heroEyebrow={isCoach ? 'For coaches & schools' : 'For athletes'}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      heroBullets={isCoach ? COACH_BULLETS : ATHLETE_BULLETS}
      cloudMode={cloudMode}
    >
      <div className="auth-card__mobile-brand">
        <AppLogo size="lg" />
        <p className="auth-card__mobile-tagline">Surf stats for coaches and athletes</p>
      </div>

      <div className="auth-role-tabs" role="tablist" aria-label="Account type">
        <button
          type="button"
          role="tab"
          aria-selected={isCoach}
          className={isCoach ? 'auth-role-tabs__btn auth-role-tabs__btn--on' : 'auth-role-tabs__btn'}
          onClick={() => switchRole(true)}
        >
          Coach
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCoach}
          className={!isCoach ? 'auth-role-tabs__btn auth-role-tabs__btn--on' : 'auth-role-tabs__btn'}
          onClick={() => switchRole(false)}
        >
          Athlete
        </button>
      </div>

      <div className="auth-mode-tabs" role="tablist" aria-label="Sign in or register">
        <button
          type="button"
          role="tab"
          aria-selected={!isRegister}
          className={!isRegister ? 'auth-mode-tabs__btn auth-mode-tabs__btn--on' : 'auth-mode-tabs__btn'}
          onClick={() => switchMode(false)}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isRegister}
          className={isRegister ? 'auth-mode-tabs__btn auth-mode-tabs__btn--on' : 'auth-mode-tabs__btn'}
          onClick={() => switchMode(true)}
        >
          Create account
        </button>
      </div>

      <header className="auth-card__head">
        <h2 className="auth-card__title">
          {isRegister
            ? isCoach
              ? 'Create your coach account'
              : 'Create your athlete account'
            : isCoach
              ? 'Welcome back, coach'
              : 'Welcome back'}
        </h2>
        <p className="auth-card__subtitle muted">
          {isRegister
            ? isCoach
              ? 'Start your subscription after sign-up to unlock sessions and analytics.'
              : 'Free for athletes — pair with your coach using a simple code.'
            : 'Enter your credentials to continue to SurfStar.'}
        </p>
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
            : isRegister
              ? selectedPlan
                ? `Create account · ${selectedPlan.name}`
                : 'Create account'
              : 'Sign in'}
        </button>
      </form>

      <footer className="auth-trust">
        <span>Encrypted sign-in</span>
        <span aria-hidden="true">·</span>
        <span>Built for surf schools</span>
      </footer>
    </AuthShell>
  )
}
