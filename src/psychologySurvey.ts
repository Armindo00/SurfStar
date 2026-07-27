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
  { id: 'mood', label: 'Como está o teu estado de espírito?' },
  { id: 'confidenceToContinue', label: 'Quão confiante estás para continuar a treinar?' },
  { id: 'confidenceDuring', label: 'Quão confiante te sentiste durante o treino?' },
  { id: 'focusDuring', label: 'Quão focado estiveste durante o treino?' },
  { id: 'errorHandling', label: 'Como avalias a tua capacidade de lidar com os erros que cometeste hoje?' },
  { id: 'feltImprovement', label: 'Sentes que evoluíste neste treino?' },
  { id: 'performanceSatisfaction', label: 'Quão satisfeito estás com o teu desempenho?' },
  { id: 'mentalFatigue', label: 'Como está o teu cansaço mental?' },
]

export const PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT =
  'Há alguma coisa que o treinador deva saber sobre este treino?'

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
