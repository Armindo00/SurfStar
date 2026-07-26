import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { canAddCoach, canManageOrganizationCoaches, coachSeatLimitMessage } from '../planUtils'
import { getPlan } from '../plans'

export function OrganizationView() {
  const {
    auth,
    subscription,
    organizationMembers,
    refreshOrganizationMembers,
    inviteOrganizationCoach,
    removeOrganizationMember,
    updateOrganizationName,
    setView,
  } = useApp()

  const [inviteEmail, setInviteEmail] = useState('')
  const [teamName, setTeamName] = useState(auth?.role === 'treinador' ? auth.organizationName : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const planId = subscription?.planId ?? 'team'
  const canManageTeam = canManageOrganizationCoaches(planId)
  const isOwner = auth?.role === 'treinador' && auth.organizationRole === 'owner'
  const activeCoachCount = organizationMembers.filter((m) => m.status === 'active' || m.status === 'pending').length
  const seatLimit = getPlan(planId).maxCoaches

  useEffect(() => {
    void refreshOrganizationMembers()
  }, [refreshOrganizationMembers])

  useEffect(() => {
    if (auth?.role === 'treinador') {
      setTeamName(auth.organizationName)
    }
  }, [auth])

  const submitInvite = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!canManageTeam) {
      setError('Multiple coaches are available on the Team Academy plan.')
      return
    }

    if (!canAddCoach(planId, activeCoachCount)) {
      setError(`Coach seat limit reached (${seatLimit} coaches on your plan).`)
      return
    }

    setBusy(true)
    try {
      const result = await inviteOrganizationCoach(inviteEmail)
      if (!result.ok) {
        setError(result.error ?? 'Could not send invite.')
        return
      }
      setInviteEmail('')
      setSuccess('Coach invited. They can sign in or create an account with that email to join your team.')
    } finally {
      setBusy(false)
    }
  }

  const submitRename = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await updateOrganizationName(teamName)
      if (!result.ok) {
        setError(result.error ?? 'Could not update name.')
        return
      }
      setSuccess('Team name updated.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await removeOrganizationMember(memberId)
      if (!result.ok) {
        setError(result.error ?? 'Could not remove member.')
        return
      }
      setSuccess('Coach removed from the team.')
    } finally {
      setBusy(false)
    }
  }

  if (auth?.role !== 'treinador') return null

  return (
    <div className="ss-flow">
      <ScreenHeader title="Team & coaches" onBack={() => setView('coach-home')} />

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{auth.organizationName}</h2>
        <p className="muted">
          {canManageTeam
            ? `${coachSeatLimitMessage(planId)} · ${activeCoachCount}/${seatLimit} seats used`
            : 'Upgrade to Team Academy to add up to 5 coaches with a shared roster and database.'}
        </p>
        <p className="muted">
          All coaches on this team share the same athletes, sessions, spots, templates, and analytics.
        </p>
      </div>

      {isOwner ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">Team name</h2>
          <form className="form-pro" onSubmit={(e) => void submitRename(e)}>
            <label className="field field--pro">
              <span>Organization name</span>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            </label>
            <button type="submit" className="btn btn--secondary btn--block" disabled={busy}>
              Save name
            </button>
          </form>
        </div>
      ) : null}

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Coaches</h2>
        <ul className="org-members-list">
          {organizationMembers.map((member) => (
            <li key={member.id} className="org-members-list__item">
              <div>
                <strong>{member.name}</strong>
                <span className="muted"> · {member.email}</span>
                <div className="org-members-list__meta muted">
                  {member.role === 'owner' ? 'Owner' : 'Coach'}
                  {member.status === 'pending' ? ' · Invite pending' : ''}
                </div>
              </div>
              {isOwner && member.role !== 'owner' ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={busy}
                  onClick={() => void handleRemove(member.id)}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {isOwner && canManageTeam ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">Invite a coach</h2>
          <p className="muted">
            Enter the email of an existing SurfStar coach or someone who will create a coach account.
            They will join this team and share all data.
          </p>
          <form className="form-pro" onSubmit={(e) => void submitInvite(e)}>
            <label className="field field--pro">
              <span>Coach email</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="coach@school.com"
                required
              />
            </label>
            <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
              {busy ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </div>
      ) : null}

      {!canManageTeam ? (
        <div className="ss-card stats-panel">
          <p className="muted">
            The Team Academy plan is built for schools, federations, and surf academies — up to 5 coaches,
            unlimited athletes, and everything in Coach Premium.
          </p>
          <button type="button" className="btn btn--gold btn--block" onClick={() => setView('subscription')}>
            View Team Academy plan
          </button>
        </div>
      ) : null}

      {error ? <p className="login-error">{error}</p> : null}
      {success ? <p className="login-success">{success}</p> : null}
    </div>
  )
}
