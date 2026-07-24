import { useState } from 'react'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
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
  const {
    coachAthletes,
    coachStudents,
    addAthleteWithLogin,
    updateAthleteShareSettings,
    setAthleteBlocked,
    deleteAthlete,
    canDeleteAthlete,
    setView,
  } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const studentByAthlete = new Map(coachStudents.map((s) => [s.athleteId, s]))

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
      setSuccess(
        'Athlete saved. Share the email and temporary password — on first sign-in they must choose a new password.',
      )
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

  const toggleBlocked = async (athleteId: string, blocked: boolean) => {
    setActionError('')
    setActionBusyId(athleteId)
    try {
      const result = await setAthleteBlocked(athleteId, blocked)
      if (!result.ok) {
        setActionError(result.error ?? 'Could not update athlete.')
      }
    } finally {
      setActionBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setActionError('')
    setActionBusyId(deleteTarget.id)
    try {
      const result = await deleteAthlete(deleteTarget.id)
      if (!result.ok) {
        setActionError(result.error ?? 'Could not delete athlete.')
        return
      }
      if (expandedAthleteId === deleteTarget.id) {
        setExpandedAthleteId(null)
      }
      setDeleteTarget(null)
    } finally {
      setActionBusyId(null)
    }
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Athletes & logins" onBack={() => setView('coach-home')} />
      <div className="ss-card">
        <p className="muted stats-panel__sub">
          Each athlete gets an email and a temporary password. On first login they must set their own
          password. Use <strong>Block</strong> to suspend access; use <strong>Delete</strong> only if
          you added someone by mistake (no training history).
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
            <span>Temporary password (min. {MIN_PASSWORD_LENGTH})</span>
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

        {actionError ? <p className="login-error">{actionError}</p> : null}

        <ul className="ss-athlete-list ss-athlete-list--plain athlete-manage-list">
          {coachAthletes.length === 0 ? (
            <li className="muted">No athletes yet.</li>
          ) : (
            coachAthletes.map((a) => {
              const shareSettings = normalizeAthleteShareSettings(
                a.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS,
              )
              const student = studentByAthlete.get(a.id)
              const expanded = expandedAthleteId === a.id
              const deletable = canDeleteAthlete(a.id)
              const busyRow = actionBusyId === a.id

              return (
                <li key={a.id} className="athlete-manage-list__item">
                  <button
                    type="button"
                    className="athlete-manage-list__head"
                    onClick={() => setExpandedAthleteId(expanded ? null : a.id)}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <small>{student?.email ?? 'No login'}</small>
                      <span className="athlete-manage-list__badges">
                        {a.blocked ? <span className="badge badge--danger">Blocked</span> : null}
                        {student?.mustChangePassword ? (
                          <span className="badge badge--warn">Pending first login</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="athlete-manage-list__toggle">{expanded ? '−' : '+'}</span>
                  </button>

                  {expanded ? (
                    <div className="athlete-share-panel">
                      <div className="athlete-manage-actions">
                        <button
                          type="button"
                          className={a.blocked ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
                          disabled={busyRow}
                          onClick={() => toggleBlocked(a.id, !a.blocked)}
                        >
                          {busyRow
                            ? 'Saving…'
                            : a.blocked
                              ? 'Unblock athlete'
                              : 'Block athlete'}
                        </button>
                        {deletable ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--small"
                            disabled={busyRow}
                            onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                          >
                            Delete (added by mistake)
                          </button>
                        ) : (
                          <p className="muted athlete-manage-actions__hint">
                            Cannot delete — this athlete has training sessions. Use Block instead.
                          </p>
                        )}
                      </div>

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

      {deleteTarget ? (
        <ConfirmDeleteModal
          title={`Delete ${deleteTarget.name}?`}
          message="Only use this if you added the athlete by mistake. This removes their login and profile permanently. Athletes with training history cannot be deleted."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  )
}
