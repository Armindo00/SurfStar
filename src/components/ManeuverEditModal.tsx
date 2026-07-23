import { useState } from 'react'
import { LEVELS } from '../sessionStats'
import {
  MANEUVER_LABELS,
  type ManeuverKind,
  type ManeuverLevel,
  type ManeuverLog,
  type WaveSide,
} from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

type Props = {
  log: ManeuverLog
  onSave: (patch: Pick<ManeuverLog, 'kind' | 'side' | 'level' | 'success'>) => void
  onClose: () => void
}

function levelLabel(level: ManeuverLevel) {
  return level === 'estrela' ? 'Star ★' : `Level ${level}`
}

export function ManeuverEditModal({ log, onSave, onClose }: Props) {
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
            <p className="sheet__eyebrow">Edit entry</p>
            <h2 id="maneuver-edit-title">Maneuver</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="field field--pro">
          <span>Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ManeuverKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {MANEUVER_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <p className="field-label">Side</p>
        <div className="sea-edit-peak-pick">
          {(['frontside', 'backside'] as WaveSide[]).map((s) => (
            <button
              key={s}
              type="button"
              className={side === s ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
              onClick={() => setSide(s)}
            >
              {s === 'frontside' ? 'Frontside' : 'Backside'}
            </button>
          ))}
        </div>

        <label className="field field--pro">
          <span>Level</span>
          <select value={String(level)} onChange={(e) => setLevel(e.target.value === 'estrela' ? 'estrela' : (Number(e.target.value) as ManeuverLevel))}>
            {LEVELS.map((lvl) => (
              <option key={String(lvl)} value={String(lvl)}>
                {levelLabel(lvl)}
              </option>
            ))}
          </select>
        </label>

        <p className="field-label">Outcome</p>
        <div className="sea-edit-peak-pick">
          <button
            type="button"
            className={success ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
            onClick={() => setSuccess(true)}
          >
            Success ✓
          </button>
          <button
            type="button"
            className={!success ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
            onClick={() => setSuccess(false)}
          >
            Miss ✕
          </button>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => onSave({ kind, side, level, success })}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
