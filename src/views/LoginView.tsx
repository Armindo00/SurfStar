import { useEffect, useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPrice, getPlan } from '../plans'
import { useApp } from '../AppContext'

type AuthMode = 'sign-in' | 'register'

export function LoginView() {
  const {
    loginAsCoach,
    loginAsStudent,
    registerCoach,
    registerAthlete,
    cloudMode,
    loginTab,
    selectedPlanId,
    openLanding,
  } = useApp()
  const [tab, setTab] = useState(loginTab)
  const [authMode, setAuthMode] = useState<AuthMode>(selectedPlanId ? 'register' : 'sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTab(loginTab)
  }, [loginTab])

  useEffect(() => {
    if (selectedPlanId && tab === 'treinador') {
      setAuthMode('register')
    }
  }, [selectedPlanId, tab])

  const resetRegister = () => {
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

      if (authMode === 'register') {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.')
          return
        }
        const result =
          tab === 'treinador'
            ? await registerCoach(name, trimmedEmail, password)
            : await registerAthlete(name, trimmedEmail, password)
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

  const isRegister = authMode === 'register'
  const selectedPlan = selectedPlanId && tab === 'treinador' ? getPlan(selectedPlanId) : null

  return (
    <div className="login-page">
      <div className="login-card">
        <button type="button" className="login-back" onClick={openLanding}>
          ← Voltar ao início
        </button>

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

        {selectedPlan ? (
          <div className="login-plan-banner">
            <span>Pack escolhido</span>
            <strong>
              {selectedPlan.name} · {formatPlanPrice(selectedPlan)}/mês
            </strong>
          </div>
        ) : null}

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'treinador'}
            className={tab === 'treinador' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'}
            onClick={() => {
              setTab('treinador')
              setAuthMode(selectedPlanId ? 'register' : 'sign-in')
              resetRegister()
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
              setAuthMode('sign-in')
              resetRegister()
            }}
          >
            Athlete
          </button>
        </div>

        <div className="login-subtabs">
          <button
            type="button"
            className={authMode === 'sign-in' ? 'login-subtabs__btn login-subtabs__btn--on' : 'login-subtabs__btn'}
            onClick={() => {
              setAuthMode('sign-in')
              resetRegister()
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={authMode === 'register' ? 'login-subtabs__btn login-subtabs__btn--on' : 'login-subtabs__btn'}
            onClick={() => {
              setAuthMode('register')
              setError('')
            }}
          >
            Create account
          </button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {isRegister ? (
            <label className="field field--login">
              <span>Your name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tab === 'treinador' ? 'Coach name' : 'Athlete name'}
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
            {busy
              ? 'Please wait…'
              : isRegister
                ? tab === 'treinador'
                  ? selectedPlan
                    ? `Criar conta · ${selectedPlan.name}`
                    : 'Create coach account'
                  : 'Create athlete account'
                : 'Sign in'}
          </button>
        </form>

        <aside className="login-demo">
          <p className="login-demo__title">Accounts</p>
          {tab === 'treinador' ? (
            <>
              <p>
                <strong>Coach:</strong> escolhe um pack, cria conta e ativa a subscrição para gerir atletas e
                treinos.
              </p>
              <p>
                <strong>Athlete:</strong> muda para o separador Athlete — entrada grátis com código de pairing.
              </p>
            </>
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
