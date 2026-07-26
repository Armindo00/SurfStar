import { sortCustomLevels } from '../customTrainingUtils'
import type { CustomButton } from '../types'

type Props = {
  button: CustomButton
  step: 'level' | 'outcome'
  selectedLevelId?: string | null
  onPickLevel: (levelId: string) => void
  onPickOutcome: (success: boolean) => void
  onClose: () => void
}

export function CustomAttemptModal({
  button,
  step,
  selectedLevelId,
  onPickLevel,
  onPickOutcome,
  onClose,
}: Props) {
  const levels = sortCustomLevels(button.levels)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--maneuver"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-attempt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">Quick log</p>
            <h2 id="custom-attempt-title">{button.label}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {step === 'level' && levels.length > 0 ? (
          <div className="custom-level-grid">
            {levels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={
                  selectedLevelId === level.id ? 'key key--custom key--active' : 'key key--custom'
                }
                style={{ borderColor: button.color }}
                onClick={() => onPickLevel(level.id)}
              >
                {level.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 'outcome' ? (
          <div className="custom-outcome-pick">
            <button
              type="button"
              className="btn-outcome btn-outcome--ok"
              aria-label="Success"
              onClick={() => onPickOutcome(true)}
            >
              ✓ Complete
            </button>
            <button
              type="button"
              className="btn-outcome btn-outcome--fail"
              aria-label="Miss"
              onClick={() => onPickOutcome(false)}
            >
              ✕ Fail
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
