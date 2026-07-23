import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'

type LoginTab = 'treinador' | 'atleta'
type CoachMode = 'sign-in' | 'register'

export function LoginView() {
  const { loginAsCoach, loginAsStudent, registerCoach, cloudMode } = useApp()
  const [tab, setTab] = useState<LoginTab>('treinador')
  const [coachMode, setCoachMode] = useState<CoachMode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const resetCoachRegister = () => {
    setName('')
    setPasswordConfirm('')
    setError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const trimmedEmail = email.trim()

      if (tab === 'treinador' && coachMode === 'register') {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.')
          return
        }
        const result = await registerCoach(name, trimmedEmail, password)
        if (!result.ok) setError(result.error)
        return
      }

      const result =
        tab === 'treinador'
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

  const isRegister = tab === 'treinador' && coachMode === 'register'

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="app-brandbar__mark login-brand__mark" aria-hidden="true">
            ★
          </span>
          <div>
            <h1>SurfStar</h1>
            <p>Surf stats for coaches and athletes</p>
            {cloudMode ? <p className="login-cloud-tag">Online · cloud version</p> : null}
          </div>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'treinador'}
            className={tab === 'treinador' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'}
            onClick={() => {
              setTab('treinador')
              setError('')
            }}
          >
            Coach
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'atleta'}
            className={tab === 'atleta' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'}
            onClick={() => {
              setTab('atleta')
              setCoachMode('sign-in')
              resetCoachRegister()
            }}
          >
            Athlete
          </button>
        </div>

        {tab === 'treinador' ? (
          <div className="login-subtabs">
            <button
              type="button"
              className={coachMode === 'sign-in' ? 'login-subtabs__btn login-subtabs__btn--on' : 'login-subtabs__btn'}
              onClick={() => {
                setCoachMode('sign-in')
                resetCoachRegister()
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={coachMode === 'register' ? 'login-subtabs__btn login-subtabs__btn--on' : 'login-subtabs__btn'}
              onClick={() => {
                setCoachMode('register')
                setError('')
              }}
            >
              Create account
            </button>
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
                placeholder="Coach name"
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
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create coach account' : 'Sign in'}
          </button>
        </form>

        <aside className="login-demo">
          <p className="login-demo__title">Accounts</p>
          <p>
            <strong>Coach:</strong> create your account here (password min. {MIN_PASSWORD_LENGTH}{' '}
            characters).
          </p>
          <p>
            <strong>Athlete:</strong> your coach adds you under <em>Add Athletes</em> with email and
            password, then you sign in on this tab.
          </p>
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
