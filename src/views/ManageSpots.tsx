import { useState } from 'react'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ScreenHeader } from '../components/ScreenHeader'
import { useToast } from '../components/ToastProvider'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

type Tab = 'spots' | 'conditions'

export function ManageSpots() {
  const { t } = useI18n()
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
  const { showToast } = useToast()

  const [tab, setTab] = useState<Tab>('spots')
  const [spotName, setSpotName] = useState('')
  const [conditionName, setConditionName] = useState('')
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null)
  const [editingSpotName, setEditingSpotName] = useState('')
  const [editingCondition, setEditingCondition] = useState<string | null>(null)
  const [editingConditionName, setEditingConditionName] = useState('')
  const [deleteSpotId, setDeleteSpotId] = useState<string | null>(null)
  const [deleteCondition, setDeleteCondition] = useState<string | null>(null)

  const submitSpot = () => {
    const trimmed = spotName.trim()
    if (!trimmed) return
    addSpot(trimmed)
    setSpotName('')
    showToast(t('ui.spots.spotAdded'), 'success')
  }

  const submitCondition = () => {
    const trimmed = conditionName.trim()
    if (!trimmed) return
    if (conditions.includes(trimmed)) {
      showToast(t('ui.spots.conditionExists'), 'info')
      return
    }
    addCondition(trimmed)
    setConditionName('')
    showToast(t('ui.spots.conditionAdded'), 'success')
  }

  const saveSpotEdit = (spotId: string) => {
    updateSpotName(spotId, editingSpotName)
    setEditingSpotId(null)
    setEditingSpotName('')
    showToast(t('ui.spots.spotUpdated'), 'success')
  }

  const saveConditionEdit = (current: string) => {
    updateConditionName(current, editingConditionName)
    setEditingCondition(null)
    setEditingConditionName('')
    showToast(t('ui.spots.conditionUpdated'), 'success')
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.spotsAndConditions')} onBack={() => setView('coach-home')} />

      <div className="ss-card spots-intro">
        <h2 className="page-title">{t('ui.spots.whereYouTrain')}</h2>
        <p className="muted">{t('ui.spots.whereYouTrainHint')}</p>
      </div>

      <div className="login-tabs spots-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'spots'}
          className={tab === 'spots' ? 'login-tabs__btn login-tabs__btn--on' : 'login-tabs__btn'}
          onClick={() => setTab('spots')}
        >
          {t('ui.spots.spotsTab', { count: spots.length })}
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
          {t('ui.spots.conditionsTab', { count: conditions.length })}
        </button>
      </div>

      {tab === 'spots' ? (
        <>
          <div className="ss-card spots-add-card">
            <label className="field field--pro">
              <span>{t('ui.spots.newSpot')}</span>
              <input
                type="text"
                placeholder={t('ui.spots.spotPlaceholder')}
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSpot()
                }}
              />
            </label>
            <button type="button" className="btn btn--primary btn--block" onClick={submitSpot}>
              {t('ui.spots.addSpot')}
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
                          {t('common.save')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => setEditingSpotId(null)}
                        >
                          {t('common.cancel')}
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
                          {t('common.delete')}
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
              <span>{t('ui.spots.newCondition')}</span>
              <input
                type="text"
                placeholder={t('ui.spots.conditionPlaceholder')}
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCondition()
                }}
              />
            </label>
            <button type="button" className="btn btn--primary btn--block" onClick={submitCondition}>
              {t('ui.spots.addCondition')}
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
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => setEditingCondition(null)}
                    >
                      {t('common.cancel')}
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
                      aria-label={t('ui.spots.editSpot', { name: condition })}
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
                      aria-label={t('ui.spots.deleteSpotAction', { name: condition })}
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
          title={t('ui.spots.deleteSpot')}
          message={t('ui.spots.deleteSpotMessage')}
          onConfirm={() => {
            if (removeSpot(deleteSpotId)) showToast(t('ui.spots.spotRemoved'), 'success')
            else showToast(t('ui.spots.keepOneSpot'), 'info')
            setDeleteSpotId(null)
          }}
          onCancel={() => setDeleteSpotId(null)}
        />
      ) : null}

      {deleteCondition ? (
        <ConfirmDeleteModal
          title={t('ui.spots.deleteCondition')}
          message={t('ui.spots.deleteConditionMessage')}
          onConfirm={() => {
            if (removeCondition(deleteCondition)) showToast(t('ui.spots.conditionRemoved'), 'success')
            else showToast(t('ui.spots.keepOneCondition'), 'info')
            setDeleteCondition(null)
          }}
          onCancel={() => setDeleteCondition(null)}
        />
      ) : null}
    </div>
  )
}
