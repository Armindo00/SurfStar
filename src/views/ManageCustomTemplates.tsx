import { useState } from 'react'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { CustomTemplateEditor, normalizeEditorTemplate } from '../components/CustomTemplateEditor'
import { ScreenHeader } from '../components/ScreenHeader'
import { cloneCustomTemplate, createEmptyCustomTemplate } from '../customTrainingUtils'
import { useApp } from '../AppContext'
import type { CustomTrainingTemplate } from '../types'

export function ManageCustomTemplates() {
  const {
    customTemplates,
    saveCustomTemplate,
    deleteCustomTemplate,
    duplicateCustomTemplate,
    setView,
  } = useApp()

  const [editing, setEditing] = useState<CustomTrainingTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2500)
  }

  const startNew = () => {
    setEditing(createEmptyCustomTemplate())
  }

  const startEdit = (template: CustomTrainingTemplate) => {
    setEditing(normalizeEditorTemplate(cloneCustomTemplate(template)))
  }

  if (editing) {
    return (
      <div className="ss-flow">
        <ScreenHeader
          title={customTemplates.some((t) => t.id === editing.id) ? 'Edit template' : 'New template'}
          onBack={() => setEditing(null)}
        />
        <CustomTemplateEditor
          template={editing}
          onCancel={() => setEditing(null)}
          onSave={(template) => {
            saveCustomTemplate(template)
            setEditing(null)
            showFeedback('Template saved.')
          }}
        />
      </div>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Custom training" onBack={() => setView('coach-home')} />

      <div className="ss-card spots-intro">
        <h2 className="page-title">Your training formats</h2>
        <p className="muted">
          Build personalized sessions with your own buttons, levels, success tracking, timer, and
          rules. Each template can reflect how you coach — beyond the built-in SurfStar modes.
        </p>
        {feedback ? <p className="login-success">{feedback}</p> : null}
        <button type="button" className="btn btn--primary btn--block" onClick={startNew}>
          + Create template
        </button>
      </div>

      {customTemplates.length === 0 ? (
        <div className="ss-card">
          <p className="muted">
            No templates yet. Create one to unlock the Custom training mode when starting a session.
          </p>
        </div>
      ) : (
        <ul className="catalog-list">
          {customTemplates.map((template) => (
            <li key={template.id} className="catalog-list__item catalog-list__item--stack">
              <div className="catalog-list__main">
                <span className="catalog-list__icon" aria-hidden="true">
                  ⚙
                </span>
                <div>
                  <strong>{template.name}</strong>
                  <p className="muted catalog-list__sub">
                    {template.buttons.length} button{template.buttons.length === 1 ? '' : 's'}
                    {template.timer.enabled ? ` · ${template.timer.durationMinutes} min timer` : ''}
                    {template.useWaves ? ' · waves' : ' · no waves'}
                  </p>
                </div>
              </div>
              <div className="catalog-list__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => startEdit(template)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => {
                    duplicateCustomTemplate(template.id)
                    showFeedback('Template duplicated.')
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => setDeleteId(template.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteId ? (
        <ConfirmDeleteModal
          title="Delete template?"
          message="Past sessions keep their saved snapshot. This removes the template from your library."
          onConfirm={() => {
            deleteCustomTemplate(deleteId)
            setDeleteId(null)
            showFeedback('Template removed.')
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </div>
  )
}
