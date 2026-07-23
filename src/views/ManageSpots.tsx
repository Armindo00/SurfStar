import { useState } from 'react'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'

export function ManageSpots() {
  const { spots, conditions, addSpot, addCondition, setView } = useApp()
  const [spotName, setSpotName] = useState('')
  const [conditionName, setConditionName] = useState('')

  return (
    <div className="ss-flow">
      <ScreenHeader title="Spots / Conditions" onBack={() => setView('coach-home')} />
      <div className="ss-card">
        <h2>Spots</h2>
        <div className="inline-form">
          <input
            type="text"
            placeholder="Spot name"
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              addSpot(spotName)
              setSpotName('')
            }}
          >
            Add
          </button>
        </div>
        <ul className="ss-athlete-list ss-athlete-list--plain">
          {spots.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ss-card">
        <h2>Conditions</h2>
        <div className="inline-form">
          <input
            type="text"
            placeholder="New condition"
            value={conditionName}
            onChange={(e) => setConditionName(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              addCondition(conditionName)
              setConditionName('')
            }}
          >
            Add
          </button>
        </div>
        <ul className="ss-athlete-list ss-athlete-list--plain">
          {conditions.map((c) => (
            <li key={c}>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
