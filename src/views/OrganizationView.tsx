import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { useI18n } from '../i18n'
import { canAddCoach, canManageOrganizationCoaches, coachSeatLimitMessage } from '../planUtils'
import { getPlan } from '../plans'
import { UNSEEN } from '../unseenDomains'

export function OrganizationView() {
  const { t } = useI18n()
  const {
    auth,
    subscription,
    organizationMembers,
    refreshOrganizationMembers,
    inviteOrganizationCoach,
    removeOrganizationMember,
    updateOrganizationName,
    openTeamAcademyRequest,
    setView,
    markSeen,
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
    const ids = organizationMembers
      .filter((member) => member.status === 'pending')
      .map((member) => member.id)
    if (ids.length === 0) return
    markSeen(UNSEEN.coachOrgInvites, ids)
  }, [markSeen, organizationMembers])

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
      setError(t('ui.organization.multipleCoachesPlan'))
      return
    }

    if (!canAddCoach(planId, activeCoachCount)) {
      setError(t('ui.organization.seatLimitReached', { limit: seatLimit }))
      return
    }

    setBusy(true)
    try {
      const result = await inviteOrganizationCoach(inviteEmail)
      if (!result.ok) {
        setError(result.error ?? t('errors.generic'))
        return
      }
      setInviteEmail('')
      setSuccess(t('ui.organization.inviteSuccess'))
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
        setError(result.error ?? t('errors.generic'))
        return
      }
      setSuccess(t('ui.organization.nameUpdated'))
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
        setError(result.error ?? t('errors.generic'))
        return
      }
      setSuccess(t('ui.organization.coachRemoved'))
    } finally {
      setBusy(false)
    }
  }

  if (auth?.role !== 'treinador') return null

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.teamAndCoaches')} onBack={() => setView('coach-home')} />

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{auth.organizationName}</h2>
        <p className="muted">
          {canManageTeam
            ? `${coachSeatLimitMessage(planId)} · ${activeCoachCount}/${seatLimit}`
            : t('ui.organization.upgradeTeamAcademyHint')}
        </p>
        <p className="muted">{t('ui.organization.sharedRosterHint')}</p>
      </div>

      {isOwner ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">{t('ui.organization.teamName')}</h2>
          <form className="form-pro" onSubmit={(e) => void submitRename(e)}>
            <label className="field field--pro">
              <span>{t('ui.organization.organizationName')}</span>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            </label>
            <button type="submit" className="btn btn--secondary btn--block" disabled={busy}>
              {t('ui.organization.saveName')}
            </button>
          </form>
        </div>
      ) : null}

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('ui.organization.coaches')}</h2>
        <ul className="org-members-list">
          {organizationMembers.map((member) => (
            <li key={member.id} className="org-members-list__item">
              <div>
                <strong>{member.name}</strong>
                <span className="muted"> · {member.email}</span>
                <div className="org-members-list__meta muted">
                  {member.role === 'owner' ? t('ui.organization.owner') : t('ui.organization.coach')}
                  {member.status === 'pending' ? ` · ${t('ui.organization.invitePending')}` : ''}
                </div>
              </div>
              {isOwner && member.role !== 'owner' ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={busy}
                  onClick={() => void handleRemove(member.id)}
                >
                  {t('ui.organization.remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {isOwner && canManageTeam ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">{t('ui.organization.inviteCoach')}</h2>
          <p className="muted">{t('ui.organization.inviteHint')}</p>
          <form className="form-pro" onSubmit={(e) => void submitInvite(e)}>
            <label className="field field--pro">
              <span>{t('ui.organization.coachEmail')}</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('ui.organization.coachEmailPlaceholder')}
                required
              />
            </label>
            <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
              {busy ? t('ui.organization.sending') : t('ui.organization.sendInvite')}
            </button>
          </form>
        </div>
      ) : null}

      {!canManageTeam ? (
        <div className="ss-card stats-panel">
          <p className="muted">{t('ui.organization.teamAcademyPitch')}</p>
          <button type="button" className="btn btn--gold btn--block" onClick={openTeamAcademyRequest}>
            {t('ui.organization.requestTeamAcademyAccess')}
          </button>
        </div>
      ) : null}

      {error ? <p className="login-error">{error}</p> : null}
      {success ? <p className="login-success">{success}</p> : null}
    </div>
  )
}
