import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useApp } from '../AppContext'
import { UNSEEN } from '../unseenDomains'
import { athleteLimitMessage, canUsePsychologyCheckins, planUpgradeHint } from '../planUtils'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ScreenHeader } from '../components/ScreenHeader'
import type { AthleteShareSettings } from '../types'
import { DEFAULT_ATHLETE_SHARE_SETTINGS, normalizeAthleteShareSettings } from '../types'

function shareSettingsEqual(a: AthleteShareSettings, b: AthleteShareSettings): boolean {
  return (Object.keys(a) as (keyof AthleteShareSettings)[]).every((key) => a[key] === b[key])
}

export function ManageAthletes() {
  const { t, messages } = useI18n()
  const ma = messages.ui.manageAthletes
  const shareOptions = ma as Record<keyof AthleteShareSettings, { label: string; hint: string }>
  const SHARE_OPTIONS: { key: keyof AthleteShareSettings; label: string; hint: string }[] = [
    { key: 'technicalStats', ...shareOptions.technicalStats },
    { key: 'comboStats', ...shareOptions.comboStats },
    { key: 'customStats', ...shareOptions.customStats },
    { key: 'sessionHistory', ...shareOptions.sessionHistory },
    { key: 'heatDetails', ...shareOptions.heatDetails },
  ]
  const PSYCHOLOGY_SHARE_OPTION = {
    key: 'psychologyCheckins' as const,
    ...shareOptions.psychologyCheckins,
  }
  const {
    coachAthletes,
    coachLinks,
    coachPlanId,
    requestPairingByCode,
    revokePairing,
    updateAthleteShareSettings,
    setAthleteBlocked,
    setView,
    markSeen,
  } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)
  const [shareDraft, setShareDraft] = useState<AthleteShareSettings | null>(null)
  const [shareDraftBaseline, setShareDraftBaseline] = useState<AthleteShareSettings | null>(null)
  const [shareDraftLinkId, setShareDraftLinkId] = useState<string | null>(null)
  const [shareSaveBusy, setShareSaveBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<{ linkId: string; name: string } | null>(null)

  const pendingLinks = coachLinks.filter((l) => l.status === 'pending')

  useEffect(() => {
    const ids = coachLinks.filter((link) => link.status === 'pending').map((link) => link.id)
    if (ids.length === 0) return
    markSeen(UNSEEN.coachPairing, ids)
  }, [coachLinks, markSeen])

  const shareDraftDirty =
    shareDraft && shareDraftBaseline
      ? !shareSettingsEqual(shareDraft, shareDraftBaseline)
      : false

  const psychologyCheckinsAvailable = canUsePsychologyCheckins(coachPlanId)
  const activeCount = coachAthletes.filter((a) => !a.blocked).length

  const closeSharePanel = () => {
    setExpandedAthleteId(null)
    setShareDraft(null)
    setShareDraftBaseline(null)
    setShareDraftLinkId(null)
    setShareSaveBusy(false)
  }

  const openSharePanel = (athleteId: string) => {
    const athlete = coachAthletes.find((a) => a.id === athleteId)
    if (!athlete?.linkId) return
    const baseline = normalizeAthleteShareSettings(
      athlete.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS,
    )
    setExpandedAthleteId(athleteId)
    setShareDraft({ ...baseline })
    setShareDraftBaseline({ ...baseline })
    setShareDraftLinkId(athlete.linkId)
  }

  const submitCode = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await requestPairingByCode(code)
      if (!result.ok) {
        setError(result.error ?? t('ui.manageAthletes.couldNotSendRequest'))
        return
      }
      setCode('')
      setSuccess(
        t('ui.manageAthletes.requestSent', {
          name: result.athleteName ?? t('ui.manageAthletes.athleteNameFallback'),
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const toggleShareDraft = (key: keyof AthleteShareSettings, enabled: boolean) => {
    setShareDraft((prev) => (prev ? { ...prev, [key]: enabled } : prev))
  }

  const saveShareDraft = async () => {
    if (!shareDraftLinkId || !shareDraft || !shareDraftDirty) return
    setShareSaveBusy(true)
    setActionError('')
    try {
      const result = await updateAthleteShareSettings(shareDraftLinkId, shareDraft)
      if (!result.ok) {
        setActionError(result.error ?? t('ui.manageAthletes.couldNotUpdateAthlete'))
        return
      }
      closeSharePanel()
    } finally {
      setShareSaveBusy(false)
    }
  }

  const toggleBlocked = async (linkId: string, blocked: boolean) => {
    setActionError('')
    setActionBusyId(linkId)
    try {
      const result = await setAthleteBlocked(linkId, blocked)
      if (!result.ok) setActionError(result.error ?? t('ui.manageAthletes.couldNotUpdateAthlete'))
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
        setActionError(result.error ?? t('ui.manageAthletes.couldNotRemoveAthlete'))
        return
      }
      if (expandedAthleteId && revokeTarget.linkId === shareDraftLinkId) closeSharePanel()
      setRevokeTarget(null)
    } finally {
      setActionBusyId(null)
    }
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.athletesAndPairing')} onBack={() => setView('coach-home')} />
      <p className="plan-limit-banner muted">
        {t('ui.manageAthletes.limitBanner', {
          limit: athleteLimitMessage(coachPlanId),
          activeCount,
          pendingCount: pendingLinks.length,
        })}
      </p>
      <div className="ss-card">
        <p className="muted stats-panel__sub">
          {t('ui.manageAthletes.pairingIntroBeforeCode')}{' '}
          <strong>{t('ui.manageAthletes.pairingCodeEmphasis')}</strong>{' '}
          {t('ui.manageAthletes.pairingIntroAfterCode')}{' '}
          <strong>{t('ui.manageAthletes.blockEmphasis')}</strong>{' '}
          {t('ui.manageAthletes.pairingIntroBlock')}{' '}
          <strong>{t('ui.manageAthletes.removeEmphasis')}</strong>{' '}
          {t('ui.manageAthletes.pairingIntroRemove')}
        </p>

        <div className="athlete-login-form">
          <label className="field field--pro">
            <span>{t('ui.manageAthletes.pairingCodeLabel')}</span>
            <input
              type="text"
              placeholder={t('ui.manageAthletes.pairingCodePlaceholder')}
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
            {busy ? t('ui.manageAthletes.sending') : t('ui.manageAthletes.sendPairingRequest')}
          </button>
        </div>

        {pendingLinks.length > 0 ? (
          <div className="pairing-panel">
            <h3 className="pairing-panel__title">{t('ui.manageAthletes.waitingConfirmation')}</h3>
            <ul className="pairing-list">
              {pendingLinks.map((link) => (
                <li key={link.id} className="pairing-list__item">
                  <span className="pairing-list__info">
                    <strong>{link.athleteName ?? t('ui.manageAthletes.athleteFallback')}</strong>
                    <small>{t('ui.manageAthletes.pending')}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {actionError ? <p className="login-error">{actionError}</p> : null}

        <ul className="ss-athlete-list ss-athlete-list--plain athlete-manage-list">
          {coachAthletes.length === 0 ? (
            <li className="muted">{t('ui.manageAthletes.noAthletesLinked')}</li>
          ) : (
            coachAthletes.map((a) => {
              const expanded = expandedAthleteId === a.id
              const linkId = a.linkId ?? a.id
              const busyRow = actionBusyId === linkId
              const draft = expanded && shareDraft ? shareDraft : null

              return (
                <li key={a.id} className="athlete-manage-list__item">
                  <button
                    type="button"
                    className="athlete-manage-list__head"
                    onClick={() => (expanded ? closeSharePanel() : openSharePanel(a.id))}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <small>
                        {t('ui.manageAthletes.codeLabel', { code: a.pairingCode || '—' })}
                      </small>
                      <span className="athlete-manage-list__badges">
                        {a.blocked ? (
                          <span className="badge badge--danger">{t('ui.manageAthletes.blocked')}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="athlete-manage-list__toggle">{expanded ? '−' : '+'}</span>
                  </button>

                  {expanded && a.linkId && draft ? (
                    <div className="athlete-share-panel">
                      <div className="athlete-share-panel__toolbar">
                        <strong className="athlete-share-panel__title">{a.name}</strong>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small athlete-share-panel__close"
                          onClick={closeSharePanel}
                        >
                          {t('ui.manageAthletes.closeSharePanel')}
                        </button>
                      </div>

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
                            ? t('ui.manageAthletes.saving')
                            : a.blocked
                              ? t('ui.manageAthletes.unblockAthlete')
                              : t('ui.manageAthletes.blockAthlete')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          disabled={busyRow}
                          onClick={() => setRevokeTarget({ linkId: a.linkId!, name: a.name })}
                        >
                          {t('ui.manageAthletes.removeFromTeam')}
                        </button>
                      </div>

                      <p className="athlete-share-panel__intro">{t('ui.manageAthletes.sharePanelIntro')}</p>
                      {SHARE_OPTIONS.map((option) => (
                        <label key={option.key} className="athlete-share-option">
                          <input
                            type="checkbox"
                            checked={draft[option.key]}
                            onChange={(e) => toggleShareDraft(option.key, e.target.checked)}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            <small>{option.hint}</small>
                          </span>
                        </label>
                      ))}
                      {psychologyCheckinsAvailable ? (
                        <label className="athlete-share-option athlete-share-option--highlight">
                          <input
                            type="checkbox"
                            checked={draft.psychologyCheckins}
                            onChange={(e) => toggleShareDraft('psychologyCheckins', e.target.checked)}
                          />
                          <span>
                            <strong>{PSYCHOLOGY_SHARE_OPTION.label}</strong>
                            <small>{PSYCHOLOGY_SHARE_OPTION.hint}</small>
                          </span>
                        </label>
                      ) : (
                        <p className="muted athlete-share-panel__upgrade">
                          {planUpgradeHint(coachPlanId, 'psychology')}
                        </p>
                      )}

                      <div className="athlete-share-panel__footer">
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          onClick={closeSharePanel}
                        >
                          {t('ui.manageAthletes.closeSharePanel')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          disabled={!shareDraftDirty || shareSaveBusy}
                          onClick={() => void saveShareDraft()}
                        >
                          {shareSaveBusy
                            ? t('ui.manageAthletes.saving')
                            : t('ui.manageAthletes.saveShareSettings')}
                        </button>
                      </div>
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
          title={t('ui.manageAthletes.removeTitle', { name: revokeTarget.name })}
          message={t('ui.manageAthletes.removeMessage')}
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      ) : null}
    </div>
  )
}
