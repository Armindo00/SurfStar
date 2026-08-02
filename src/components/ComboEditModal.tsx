import { useState } from 'react'
import { LEVELS } from '../sessionStats'
import { comboLevelLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { ComboAttemptLog, ComboLevel, WaveSide } from '../types'

type Props = {
  log: ComboAttemptLog
  onSave: (patch: Pick<ComboAttemptLog, 'level' | 'side' | 'success'>) => void
  onClose: () => void
}

export function ComboEditModal({ log, onSave, onClose }: Props) {
  const { t, messages } = useI18n()
  const r = messages.session.register as Record<string, string>
  const combo = messages.session.combo as Record<string, string>
  const [level, setLevel] = useState(log.level)
  const [side, setSide] = useState(log.side)
  const [success, setSuccess] = useState(log.success)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{r.editEntry}</p>
            <h2 id="combo-edit-title">{combo.attempt}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <label className="field field--pro">
          <span>{t('ui.stats.level')}</span>
          <select
            value={String(level)}
            onChange={(e) =>
              setLevel(e.target.value === 'estrela' ? 'estrela' : (Number(e.target.value) as ComboLevel))
            }
          >
            {LEVELS.map((lvl) => (
              <option key={String(lvl)} value={String(lvl)}>
                {comboLevelLabel(lvl)}
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
          onClick={() => onSave({ level, side, success })}
        >
          {r.saveChanges}
        </button>
      </div>
    </div>
  )
}
