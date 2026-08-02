import { useState } from 'react'
import { LEVELS } from '../sessionStats'
import { levelLabelEn, maneuverLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { ManeuverKind, ManeuverLevel, ManeuverLog, WaveSide } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

type Props = {
  log: ManeuverLog
  onSave: (patch: Pick<ManeuverLog, 'kind' | 'side' | 'level' | 'success'>) => void
  onClose: () => void
}

export function ManeuverEditModal({ log, onSave, onClose }: Props) {
  const { t, messages } = useI18n()
  const r = messages.session.register as Record<string, string>
  const [kind, setKind] = useState(log.kind)
  const [side, setSide] = useState(log.side)
  const [level, setLevel] = useState(log.level)
  const [success, setSuccess] = useState(log.success)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="maneuver-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{r.editEntry}</p>
            <h2 id="maneuver-edit-title">{r.maneuver}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <label className="field field--pro">
          <span>{r.type}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ManeuverKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {maneuverLabel(k)}
              </option>
            ))}
          </select>
        </label>

        <p className="field-label">{r.side}</p>
        <div className="sea-edit-peak-pick">
          {(['frontside', 'backside'] as WaveSide[]).map((s) => (
            <button
              key={s}
              type="button"
              className={side === s ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
              onClick={() => setSide(s)}
            >
              {s === 'frontside' ? r.frontside : r.backside}
            </button>
          ))}
        </div>

        <label className="field field--pro">
          <span>{t('ui.stats.level')}</span>
          <select value={String(level)} onChange={(e) => setLevel(e.target.value === 'estrela' ? 'estrela' : (Number(e.target.value) as ManeuverLevel))}>
            {LEVELS.map((lvl) => (
              <option key={String(lvl)} value={String(lvl)}>
                {levelLabelEn(lvl)}
              </option>
            ))}
          </select>
        </label>

        <p className="field-label">{r.outcome}</p>
        <div className="sea-edit-peak-pick">
          <button
            type="button"
            className={success ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
            onClick={() => setSuccess(true)}
          >
            {r.success} ✓
          </button>
          <button
            type="button"
            className={!success ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
            onClick={() => setSuccess(false)}
          >
            {r.fail} ✕
          </button>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => onSave({ kind, side, level, success })}
        >
          {r.saveChanges}
        </button>
      </div>
    </div>
  )
}
