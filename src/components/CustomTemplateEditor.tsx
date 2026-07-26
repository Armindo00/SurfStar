import { useState } from 'react'
import {
  CUSTOM_BUTTON_COLORS,
  createCustomButton,
  createCustomLevel,
  defaultCustomRules,
  defaultCustomTimer,
  sortCustomButtons,
  validateCustomTemplate,
} from '../customTrainingUtils'
import type { CustomButton, CustomTrainingTemplate } from '../types'

type Props = {
  template: CustomTrainingTemplate
  onSave: (template: CustomTrainingTemplate) => void
  onCancel: () => void
}

export function CustomTemplateEditor({ template: initial, onSave, onCancel }: Props) {
  const [template, setTemplate] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  const updateButton = (buttonId: string, patch: Partial<CustomButton>) => {
    setTemplate((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b) => (b.id === buttonId ? { ...b, ...patch } : b)),
    }))
  }

  const addButton = () => {
    const nextOrder = template.buttons.length
    setTemplate((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        createCustomButton({
          sortOrder: nextOrder,
          color: CUSTOM_BUTTON_COLORS[nextOrder % CUSTOM_BUTTON_COLORS.length],
        }),
      ],
    }))
  }

  const removeButton = (buttonId: string) => {
    setTemplate((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((b) => b.id !== buttonId),
    }))
  }

  const moveButton = (buttonId: string, direction: -1 | 1) => {
    const sorted = sortCustomButtons(template.buttons)
    const index = sorted.findIndex((b) => b.id === buttonId)
    const swapIndex = index + direction
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return

    const reordered = [...sorted]
    const temp = reordered[index].sortOrder
    reordered[index] = { ...reordered[index], sortOrder: reordered[swapIndex].sortOrder }
    reordered[swapIndex] = { ...reordered[swapIndex], sortOrder: temp }

    setTemplate((prev) => ({ ...prev, buttons: reordered }))
  }

  const submit = () => {
    const validation = validateCustomTemplate(template)
    if (validation) {
      setError(validation)
      return
    }
    onSave({ ...template, updatedAt: new Date().toISOString() })
  }

  const sortedButtons = sortCustomButtons(template.buttons)

  return (
    <div className="ss-flow custom-editor">
      <div className="ss-card">
        <h2 className="page-title">Template settings</h2>
        {error ? <p className="login-error">{error}</p> : null}

        <div className="form-pro">
          <label className="field field--pro">
            <span>Template name</span>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Air training, Contest prep"
            />
          </label>

          <label className="field field--pro">
            <span>Description (shown during session)</span>
            <textarea
              rows={2}
              value={template.description ?? ''}
              onChange={(e) => setTemplate((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief goal for this training format"
            />
          </label>

          <label className="field field--pro">
            <span>Rules & notes (shown during session)</span>
            <textarea
              rows={3}
              value={template.rulesNotes ?? ''}
              onChange={(e) => setTemplate((prev) => ({ ...prev, rulesNotes: e.target.value }))}
              placeholder="Scoring rules, focus points, coach reminders…"
            />
          </label>
        </div>
      </div>

      <div className="ss-card">
        <header className="stats-panel__head">
          <h2 className="stats-panel__title">Session timer</h2>
        </header>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={template.timer.enabled}
            onChange={(e) =>
              setTemplate((prev) => ({
                ...prev,
                timer: { ...(prev.timer ?? defaultCustomTimer()), enabled: e.target.checked },
              }))
            }
          />
          <span>Enable countdown timer</span>
        </label>

        {template.timer.enabled ? (
          <div className="form-pro custom-editor__timer-fields">
            <label className="field field--pro">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min={1}
                max={180}
                value={template.timer.durationMinutes}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      durationMinutes: Math.max(1, Number(e.target.value) || 1),
                    },
                  }))
                }
              />
            </label>
            <label className="field field--pro">
              <span>Timer label</span>
              <input
                type="text"
                value={template.timer.label ?? ''}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    timer: { ...prev.timer, label: e.target.value },
                  }))
                }
                placeholder="Session timer"
              />
            </label>
            <label className="field field--check">
              <input
                type="checkbox"
                checked={template.timer.autoStart}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    timer: { ...prev.timer, autoStart: e.target.checked },
                  }))
                }
              />
              <span>Auto-start when session begins</span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="ss-card">
        <header className="stats-panel__head">
          <h2 className="stats-panel__title">Session rules</h2>
        </header>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={template.useWaves}
            onChange={(e) => setTemplate((prev) => ({ ...prev, useWaves: e.target.checked }))}
          />
          <span>Use waves (start/close wave before logging)</span>
        </label>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={template.rules.requireWaveBeforeLog}
            onChange={(e) =>
              setTemplate((prev) => ({
                ...prev,
                rules: { ...prev.rules, requireWaveBeforeLog: e.target.checked },
              }))
            }
          />
          <span>Require open wave before logging</span>
        </label>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={template.rules.showRulesPanel}
            onChange={(e) =>
              setTemplate((prev) => ({
                ...prev,
                rules: { ...prev.rules, showRulesPanel: e.target.checked },
              }))
            }
          />
          <span>Show rules panel during session</span>
        </label>
        <label className="field field--pro">
          <span>Max attempts per wave (empty = unlimited)</span>
          <input
            type="number"
            min={1}
            placeholder="Unlimited"
            value={template.rules.maxAttemptsPerWave ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim()
              setTemplate((prev) => ({
                ...prev,
                rules: {
                  ...prev.rules,
                  maxAttemptsPerWave: raw ? Math.max(1, Number(raw) || 1) : null,
                },
              }))
            }}
          />
        </label>
      </div>

      <div className="ss-card">
        <header className="stats-panel__head">
          <h2 className="stats-panel__title">Skill buttons ({sortedButtons.length})</h2>
          <button type="button" className="btn btn--primary btn--small" onClick={addButton}>
            + Add button
          </button>
        </header>
        <p className="muted stats-panel__sub">
          Each button can have custom levels and optional success/fail tracking.
        </p>

        <div className="custom-editor__buttons">
          {sortedButtons.map((button, index) => (
            <article key={button.id} className="custom-editor__button-card">
              <div className="custom-editor__button-head">
                <span
                  className="custom-editor__color-dot"
                  style={{ backgroundColor: button.color }}
                  aria-hidden="true"
                />
                <strong>Button {index + 1}</strong>
                <div className="custom-editor__button-actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={index === 0}
                    onClick={() => moveButton(button.id, -1)}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={index === sortedButtons.length - 1}
                    onClick={() => moveButton(button.id, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={sortedButtons.length <= 1}
                    onClick={() => removeButton(button.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="form-pro">
                <label className="field field--pro">
                  <span>Button name</span>
                  <input
                    type="text"
                    value={button.label}
                    onChange={(e) => updateButton(button.id, { label: e.target.value })}
                  />
                </label>
                <label className="field field--pro">
                  <span>Short label (on button)</span>
                  <input
                    type="text"
                    value={button.shortLabel ?? ''}
                    onChange={(e) => updateButton(button.id, { shortLabel: e.target.value })}
                    placeholder={button.label}
                  />
                </label>
                <label className="field field--pro">
                  <span>Color</span>
                  <div className="custom-color-row">
                    {CUSTOM_BUTTON_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={
                          button.color === color
                            ? 'custom-color-swatch custom-color-swatch--on'
                            : 'custom-color-swatch'
                        }
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                        onClick={() => updateButton(button.id, { color })}
                      />
                    ))}
                  </div>
                </label>
                <label className="field field--check">
                  <input
                    type="checkbox"
                    checked={button.trackSuccess}
                    onChange={(e) => updateButton(button.id, { trackSuccess: e.target.checked })}
                  />
                  <span>Track success / fail</span>
                </label>
              </div>

              <div className="custom-editor__levels">
                <div className="custom-editor__levels-head">
                  <span className="field-label">Levels</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() =>
                      updateButton(button.id, {
                        levels: [
                          ...button.levels,
                          createCustomLevel(String(button.levels.length + 1), button.levels.length),
                        ],
                      })
                    }
                  >
                    + Level
                  </button>
                </div>
                {button.levels.length === 0 ? (
                  <p className="muted">No levels — tap logs directly (or success/fail only).</p>
                ) : (
                  button.levels.map((level) => (
                    <div key={level.id} className="custom-editor__level-row">
                      <input
                        type="text"
                        value={level.label}
                        onChange={(e) =>
                          updateButton(button.id, {
                            levels: button.levels.map((l) =>
                              l.id === level.id ? { ...l, label: e.target.value } : l,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() =>
                          updateButton(button.id, {
                            levels: button.levels.filter((l) => l.id !== level.id),
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="custom-editor__footer">
        <button type="button" className="btn btn--ghost btn--block" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary btn--block" onClick={submit}>
          Save template
        </button>
      </div>
    </div>
  )
}

function ensureRules(template: CustomTrainingTemplate): CustomTrainingTemplate {
  return {
    ...template,
    timer: template.timer ?? defaultCustomTimer(),
    rules: template.rules ?? defaultCustomRules(),
  }
}

export function normalizeEditorTemplate(template: CustomTrainingTemplate): CustomTrainingTemplate {
  return ensureRules(template)
}
