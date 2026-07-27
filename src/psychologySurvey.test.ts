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
    expect(averagePsychologyScore({ ...scores, mood: 5, mentalFatigue: 0 })).toBe(2.9)
  })
})
