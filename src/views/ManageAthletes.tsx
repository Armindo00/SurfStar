import { useState } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import type { AthleteShareSettings } from '../types'
import { DEFAULT_ATHLETE_SHARE_SETTINGS, normalizeAthleteShareSettings } from '../types'

const SHARE_OPTIONS: { key: keyof AthleteShareSettings; label: string; hint: string }[] = [
  {
    key: 'technicalStats',
    label: 'Technical training stats',
    hint: 'Maneuver success rates (R, T, P) and frontside/backside breakdown.',
  },
  {
    key: 'comboStats',
    label: 'Combo stats',
    hint: 'Combo success by level and side.',
  },
  {
    key: 'sessionHistory',
    label: 'Training history',
    hint: 'List of completed sessions with a short summary.',
  },
  {
    key: 'heatDetails',
    label: 'Heat breakdown',
    hint: 'Per-heat score, placement, and wins.',
  },
]

export function ManageAthletes() {
  const { coachAthletes, coachStudents, addAthleteWithLogin, updateAthleteShareSettings, setView } =
    useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)

  const studentEmailByAthlete = new Map(coachStudents.map((s) => [s.athleteId, s.email]))

  const submit = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await addAthleteWithLogin(name, email, password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setName('')
      setEmail('')
      setPassword('')
      setSuccess('Athlete saved. They can sign in on the Athlete tab with this email and password.')
    } finally {
      setBusy(false)
    }
  }

  const toggleShare = (athleteId: string, key: keyof AthleteShareSettings, enabled: boolean) => {
    const athlete = coachAthletes.find((a) => a.id === athleteId)
    if (!athlete) return
    const current = normalizeAthleteShareSettings(athlete.shareSettings)
    updateAthleteShareSettings(athleteId, { ...current, [key]: enabled })
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Athletes & logins" onBack={() => setView('coach-home')} />
      <div className="ss-card">
        <p className="muted stats-panel__sub">
          Each athlete gets an email and password to sign in on the <strong>Athlete</strong> tab.
        </p>

        <div className="athlete-login-form">
          <label className="field field--pro">
            <span>Name</span>
            <input
              type="text"
              placeholder="Athlete name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field field--pro">
            <span>Email</span>
            <input
              type="email"
              placeholder="athlete@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field field--pro">
            <span>Password (min. {MIN_PASSWORD_LENGTH})</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          {success ? <p className="login-success">{success}</p> : null}
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'Saving…' : 'Add athlete with login'}
          </button>
        </div>

        <ul className="ss-athlete-list ss-athlete-list--plain athlete-manage-list">
          {coachAthletes.length === 0 ? (
            <li className="muted">No athletes yet.</li>
          ) : (
            coachAthletes.map((a) => {
              const shareSettings = normalizeAthleteShareSettings(
                a.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS,
              )
              const expanded = expandedAthleteId === a.id

              return (
                <li key={a.id} className="athlete-manage-list__item">
                  <button
                    type="button"
                    className="athlete-manage-list__head"
                    onClick={() => setExpandedAthleteId(expanded ? null : a.id)}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <small>{studentEmailByAthlete.get(a.id) ?? 'No login'}</small>
                    </span>
                    <span className="athlete-manage-list__toggle">{expanded ? '−' : '+'}</span>
                  </button>

                  {expanded ? (
                    <div className="athlete-share-panel">
                      <p className="athlete-share-panel__intro">
                        Choose what this athlete can see beyond the general dashboard (waves,
                        trainings, heat wins, potential wave split, average heat score).
                      </p>
                      {SHARE_OPTIONS.map((option) => (
                        <label key={option.key} className="athlete-share-option">
                          <input
                            type="checkbox"
                            checked={shareSettings[option.key]}
                            onChange={(e) => toggleShare(a.id, option.key, e.target.checked)}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            <small>{option.hint}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
