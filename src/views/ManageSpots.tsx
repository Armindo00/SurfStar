import { useState } from 'react'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'

type Tab = 'spots' | 'conditions'

export function ManageSpots() {
  const {
    spots,
    conditions,
    addSpot,
    updateSpotName,
    removeSpot,
    addCondition,
    updateConditionName,
    removeCondition,
    setView,
  } = useApp()

  const [tab, setTab] = useState<Tab>('spots')
  const [spotName, setSpotName] = useState('')
  const [conditionName, setConditionName] = useState('')
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null)
  const [editingSpotName, setEditingSpotName] = useState('')
  const [editingCondition, setEditingCondition] = useState<string | null>(null)
  const [editingConditionName, setEditingConditionName] = useState('')
  const [deleteSpotId, setDeleteSpotId] = useState<string | null>(null)
  const [deleteCondition, setDeleteCondition] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2500)
  }

  const submitSpot = () => {
    const trimmed = spotName.trim()
    if (!trimmed) return
    addSpot(trimmed)
    setSpotName('')
    showFeedback('Spot added.')
  }

  const submitCondition = () => {
    const trimmed = conditionName.trim()
    if (!trimmed) return
    if (conditions.includes(trimmed)) {
      showFeedback('This condition already exists.')
      return
    }
    addCondition(trimmed)
    setConditionName('')
    showFeedback('Condition added.')
  }

  const saveSpotEdit = (spotId: string) => {
    updateSpotName(spotId, editingSpotName)
    setEditingSpotId(null)
    setEditingSpotName('')
    showFeedback('Spot updated.')
  }

  const saveConditionEdit = (current: string) => {
    updateConditionName(current, editingConditionName)
    setEditingCondition(null)
    setEditingConditionName('')
    showFeedback('Condition updated.')
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Spots & conditions" onBack={() => setView('coach-home')} />

      <div className="ss-card spots-intro">
        <h2 className="page-title">Where you train</h2>
        <p className="muted">
          Manage surf spots and sea conditions used when starting a session. These appear as quick
          picks on the start screen.
        </p>
        {feedback ? <p className="login-success">{feedback}</p> : null}
      </div>

      <div className="login-tabs spots-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'spots'}
          className={tab === 'spots' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'}
          onClick={() => setTab('spots')}
        >
          Spots ({spots.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'conditions'}
          className={
            tab === 'conditions' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'
          }
          onClick={() => setTab('conditions')}
        >
          Conditions ({conditions.length})
        </button>
      </div>

      {tab === 'spots' ? (
        <>
          <div className="ss-card spots-add-card">
            <label className="field field--pro">
              <span>New spot</span>
              <input
                type="text"
                placeholder="e.g. Supertubos, Coxos, Home break"
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSpot()
                }}
              />
            </label>
            <button type="button" className="btn btn--primary btn--block" onClick={submitSpot}>
              Add spot
            </button>
          </div>

          <ul className="catalog-list">
            {spots.map((spot) => {
              const editing = editingSpotId === spot.id

              return (
                <li key={spot.id} className="catalog-list__item">
                  {editing ? (
                    <div className="catalog-list__edit">
                      <input
                        type="text"
                        value={editingSpotName}
                        onChange={(e) => setEditingSpotName(e.target.value)}
                        autoFocus
                      />
                      <div className="catalog-list__edit-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          onClick={() => saveSpotEdit(spot.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => setEditingSpotId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="catalog-list__main">
                        <span className="catalog-list__icon" aria-hidden="true">
                          📍
                        </span>
                        <strong>{spot.name}</strong>
                      </div>
                      <div className="catalog-list__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => {
                            setEditingSpotId(spot.id)
                            setEditingSpotName(spot.name)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={spots.length <= 1}
                          onClick={() => setDeleteSpotId(spot.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <>
          <div className="ss-card spots-add-card">
            <label className="field field--pro">
              <span>New condition</span>
              <input
                type="text"
                placeholder="e.g. Clean, Glassy, Windy"
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCondition()
                }}
              />
            </label>
            <button type="button" className="btn btn--primary btn--block" onClick={submitCondition}>
              Add condition
            </button>
          </div>

          <div className="condition-chip-grid">
            {conditions.map((condition) => {
              const editing = editingCondition === condition

              if (editing) {
                return (
                  <div key={condition} className="condition-chip condition-chip--edit">
                    <input
                      type="text"
                      value={editingConditionName}
                      onChange={(e) => setEditingConditionName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn--primary btn--small"
                      onClick={() => saveConditionEdit(condition)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => setEditingCondition(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )
              }

              return (
                <div key={condition} className="condition-chip">
                  <span>{condition}</span>
                  <div className="condition-chip__actions">
                    <button
                      type="button"
                      className="condition-chip__btn"
                      aria-label={`Edit ${condition}`}
                      onClick={() => {
                        setEditingCondition(condition)
                        setEditingConditionName(condition)
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="condition-chip__btn condition-chip__btn--danger"
                      aria-label={`Delete ${condition}`}
                      disabled={conditions.length <= 1}
                      onClick={() => setDeleteCondition(condition)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {deleteSpotId ? (
        <ConfirmDeleteModal
          title="Delete spot?"
          message="Past sessions keep this spot in their history. You need at least one spot."
          onConfirm={() => {
            if (removeSpot(deleteSpotId)) showFeedback('Spot removed.')
            else showFeedback('Keep at least one spot.')
            setDeleteSpotId(null)
          }}
          onCancel={() => setDeleteSpotId(null)}
        />
      ) : null}

      {deleteCondition ? (
        <ConfirmDeleteModal
          title="Delete condition?"
          message="Past sessions keep the old label. You need at least one condition."
          onConfirm={() => {
            if (removeCondition(deleteCondition)) showFeedback('Condition removed.')
            else showFeedback('Keep at least one condition.')
            setDeleteCondition(null)
          }}
          onCancel={() => setDeleteCondition(null)}
        />
      ) : null}
    </div>
  )
}
