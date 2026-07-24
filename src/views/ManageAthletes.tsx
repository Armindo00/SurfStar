import { useState } from 'react'
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
    coachLinks,
    requestPairingByCode,
    revokePairing,
    updateAthleteShareSettings,
    setAthleteBlocked,
    setView,
  } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<{ linkId: string; name: string } | null>(null)

  const pendingLinks = coachLinks.filter((l) => l.status === 'pending')

  const submitCode = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await requestPairingByCode(code)
      if (!result.ok) {
        setError(result.error ?? 'Could not send request.')
        return
      }
      setCode('')
      setSuccess(
        `Request sent to ${result.athleteName ?? 'athlete'}. They must accept before you can add them to sessions.`,
      )
    } finally {
      setBusy(false)
    }
  }

  const toggleShare = (linkId: string, key: keyof AthleteShareSettings, enabled: boolean) => {
    const athlete = coachAthletes.find((a) => a.linkId === linkId)
    if (!athlete?.linkId) return
    const current = normalizeAthleteShareSettings(athlete.shareSettings)
    updateAthleteShareSettings(linkId, { ...current, [key]: enabled })
  }

  const toggleBlocked = async (linkId: string, blocked: boolean) => {
    setActionError('')
    setActionBusyId(linkId)
    try {
      const result = await setAthleteBlocked(linkId, blocked)
      if (!result.ok) setActionError(result.error ?? 'Could not update athlete.')
    } finally {
      setActionBusyId(null)
    }
  }

  const confirmRevoke = async () => {
    if (!revokeTarget) return
    setActionError('')
    setActionBusyId(revokeTarget.linkId)
    try {
      const result = await revokePairing(revokeTarget.linkId)
      if (!result.ok) {
        setActionError(result.error ?? 'Could not remove athlete.')
        return
      }
      if (expandedAthleteId === revokeTarget.linkId) setExpandedAthleteId(null)
      setRevokeTarget(null)
    } finally {
      setActionBusyId(null)
    }
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Athletes & pairing" onBack={() => setView('coach-home')} />
      <div className="ss-card">
        <p className="muted stats-panel__sub">
          Ask the athlete for their <strong>pairing code</strong> from their SurfStar account. After
          they accept your request, you can add them to training sessions. Use <strong>Block</strong>{' '}
          to suspend them on your team, or <strong>Remove</strong> to unlink (their stats stay on
          their account).
        </p>

        <div className="athlete-login-form">
          <label className="field field--pro">
            <span>Athlete pairing code</span>
            <input
              type="text"
              placeholder="e.g. A3K9P2"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          {success ? <p className="login-success">{success}</p> : null}
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={busy || !code.trim()}
            onClick={submitCode}
          >
            {busy ? 'Sending…' : 'Send pairing request'}
          </button>
        </div>

        {pendingLinks.length > 0 ? (
          <div className="pairing-panel">
            <h3 className="pairing-panel__title">Waiting for athlete confirmation</h3>
            <ul className="pairing-list">
              {pendingLinks.map((link) => (
                <li key={link.id} className="pairing-list__item">
                  <span>
                    <strong>{link.athleteName ?? 'Athlete'}</strong>
                    <small>Pending</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {actionError ? <p className="login-error">{actionError}</p> : null}

        <ul className="ss-athlete-list ss-athlete-list--plain athlete-manage-list">
          {coachAthletes.length === 0 ? (
            <li className="muted">No athletes linked yet.</li>
          ) : (
            coachAthletes.map((a) => {
              const shareSettings = normalizeAthleteShareSettings(
                a.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS,
              )
              const expanded = expandedAthleteId === a.id
              const linkId = a.linkId ?? a.id
              const busyRow = actionBusyId === linkId

              return (
                <li key={a.id} className="athlete-manage-list__item">
                  <button
                    type="button"
                    className="athlete-manage-list__head"
                    onClick={() => setExpandedAthleteId(expanded ? null : a.id)}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <small>Code {a.pairingCode || '—'}</small>
                      <span className="athlete-manage-list__badges">
                        {a.blocked ? <span className="badge badge--danger">Blocked</span> : null}
                      </span>
                    </span>
                    <span className="athlete-manage-list__toggle">{expanded ? '−' : '+'}</span>
                  </button>

                  {expanded && a.linkId ? (
                    <div className="athlete-share-panel">
                      <div className="athlete-manage-actions">
                        <button
                          type="button"
                          className={
                            a.blocked ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'
                          }
                          disabled={busyRow}
                          onClick={() => toggleBlocked(a.linkId!, !a.blocked)}
                        >
                          {busyRow
                            ? 'Saving…'
                            : a.blocked
                              ? 'Unblock athlete'
                              : 'Block athlete'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          disabled={busyRow}
                          onClick={() => setRevokeTarget({ linkId: a.linkId!, name: a.name })}
                        >
                          Remove from my team
                        </button>
                      </div>

                      <p className="athlete-share-panel__intro">
                        Choose what this athlete can see from your sessions beyond the general
                        dashboard.
                      </p>
                      {SHARE_OPTIONS.map((option) => (
                        <label key={option.key} className="athlete-share-option">
                          <input
                            type="checkbox"
                            checked={shareSettings[option.key]}
                            onChange={(e) => toggleShare(a.linkId!, option.key, e.target.checked)}
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

      {revokeTarget ? (
        <ConfirmDeleteModal
          title={`Remove ${revokeTarget.name}?`}
          message="This removes the athlete from your team. Their account and stats are kept — they can pair with you again later using their code."
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      ) : null}
    </div>
  )
}
