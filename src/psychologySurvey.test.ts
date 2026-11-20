import { describe, expect, it } from 'vitest'
import {
  averagePsychologyScore,
  createDefaultPsychologySurveyScores,
  isPsychologySurveyScores,
} from './psychologySurvey'

describe('psychologySurvey', () => {
  it('validates complete 0-5 score objects', () => {
    const scores = createDefaultPsychologySurveyScores()
    expect(isPsychologySurveyScores(scores)).toBe(true)
    // All items share polarity: higher = better (incl. mental fatigue)
    expect(averagePsychologyScore({ ...scores, mood: 5, mentalFatigue: 0 })).toBe(2.9)
  })

  it('treats mental fatigue like other items: 5 good, 0 bad', () => {
    const base = createDefaultPsychologySurveyScores()
    const lowFatigueGood = averagePsychologyScore({ ...base, mentalFatigue: 5 })
    const highFatigueBad = averagePsychologyScore({ ...base, mentalFatigue: 0 })
    expect(lowFatigueGood).toBeGreaterThan(highFatigueBad)
    expect(lowFatigueGood).toBe(3.3)
    expect(highFatigueBad).toBe(2.6)
  })
})
