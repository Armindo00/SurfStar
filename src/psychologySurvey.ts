export const PSYCHOLOGY_SURVEY_KEYS = [
  'mood',
  'confidenceToContinue',
  'confidenceDuring',
  'focusDuring',
  'errorHandling',
  'feltImprovement',
  'performanceSatisfaction',
  'mentalFatigue',
] as const

export type PsychologySurveyKey = (typeof PSYCHOLOGY_SURVEY_KEYS)[number]

export type PsychologySurveyScores = Record<PsychologySurveyKey, number>

export const PSYCHOLOGY_SURVEY_QUESTIONS: { id: PsychologySurveyKey; label: string }[] = [
  { id: 'mood', label: 'How is your mood?' },
  { id: 'confidenceToContinue', label: 'How confident do you feel about continuing to train?' },
  { id: 'confidenceDuring', label: 'How confident did you feel during the session?' },
  { id: 'focusDuring', label: 'How focused were you during the session?' },
  {
    id: 'errorHandling',
    label: 'How well did you handle the mistakes you made today?',
  },
  { id: 'feltImprovement', label: 'Do you feel you improved in this session?' },
  { id: 'performanceSatisfaction', label: 'How satisfied are you with your performance?' },
  { id: 'mentalFatigue', label: 'How is your mental fatigue?' },
]

export const PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT =
  'Is there anything your coach should know about this session?'

export const DEFAULT_PSYCHOLOGY_SURVEY_SCORES: PsychologySurveyScores = {
  mood: 3,
  confidenceToContinue: 3,
  confidenceDuring: 3,
  focusDuring: 3,
  errorHandling: 3,
  feltImprovement: 3,
  performanceSatisfaction: 3,
  mentalFatigue: 3,
}

export function createDefaultPsychologySurveyScores(): PsychologySurveyScores {
  return { ...DEFAULT_PSYCHOLOGY_SURVEY_SCORES }
}

export function isPsychologySurveyScores(value: unknown): value is PsychologySurveyScores {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return PSYCHOLOGY_SURVEY_KEYS.every((key) => {
    const score = record[key]
    return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 5
  })
}

export function averagePsychologyScore(scores: PsychologySurveyScores): number {
  const total = PSYCHOLOGY_SURVEY_KEYS.reduce((sum, key) => sum + scores[key], 0)
  return Math.round((total / PSYCHOLOGY_SURVEY_KEYS.length) * 10) / 10
}

export function psychologyQuestionLabel(key: PsychologySurveyKey): string {
  return PSYCHOLOGY_SURVEY_QUESTIONS.find((question) => question.id === key)?.label ?? key
}
