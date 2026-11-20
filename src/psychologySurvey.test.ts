import { describe, expect, it } from 'vitest'
import {
  averagePsychologyScore,
  createDefaultPsychologySurveyScores,
  isPsychologyReverseKey,
  isPsychologySurveyScores,
  psychologyScoreForWellbeing,
} from './psychologySurvey'

describe('psychologySurvey', () => {
  it('validates complete 0-5 score objects', () => {
    const scores = createDefaultPsychologySurveyScores()
    expect(isPsychologySurveyScores(scores)).toBe(true)
    // mentalFatigue is reverse-scored for wellbeing averages (0 fatigue → +5)
    expect(averagePsychologyScore({ ...scores, mood: 5, mentalFatigue: 0 })).toBe(3.5)
  })

  it('reverses mental fatigue for wellbeing scoring', () => {
    expect(isPsychologyReverseKey('mentalFatigue')).toBe(true)
    expect(isPsychologyReverseKey('mood')).toBe(false)
    expect(psychologyScoreForWellbeing('mentalFatigue', 5)).toBe(0)
    expect(psychologyScoreForWellbeing('mentalFatigue', 0)).toBe(5)
    expect(psychologyScoreForWellbeing('mood', 4)).toBe(4)
  })
})
