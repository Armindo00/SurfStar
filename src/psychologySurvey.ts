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

/** Draft answers before the athlete has tapped every scale. */
export type PsychologySurveyDraftScores = Record<PsychologySurveyKey, number | null>

export type PsychologySurveyQuestion = {
  id: PsychologySurveyKey
  /** @deprecated Prefer i18n via psychologyQuestionLabelKey */
  get label(): string
}

/**
 * All questions share the same polarity: 0 = bad → 5 = good.
 * Mental fatigue is scored the same way (0 = very fatigued, 5 = not fatigued),
 * so a fatigued athlete lowers the wellbeing average instead of raising it.
 *
 * Labels live in i18n: `components.sessionFeedback.questions.<id>`
 */
export const PSYCHOLOGY_SURVEY_QUESTIONS: PsychologySurveyQuestion[] = PSYCHOLOGY_SURVEY_KEYS.map(
  (id) => ({
    id,
    get label() {
      return psychologyQuestionLabel(id)
    },
  }),
)

/** @deprecated Prefer i18n `components.sessionFeedback.coachNotePrompt` */
export const PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT =
  'Is there anything your coach should know about this session?'

/** Mid-scale fixture for analytics/tests — not used as the feedback form default. */
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

export function createEmptyPsychologySurveyScores(): PsychologySurveyDraftScores {
  return {
    mood: null,
    confidenceToContinue: null,
    confidenceDuring: null,
    focusDuring: null,
    errorHandling: null,
    feltImprovement: null,
    performanceSatisfaction: null,
    mentalFatigue: null,
  }
}

export function isPsychologySurveyComplete(
  scores: PsychologySurveyDraftScores,
): scores is PsychologySurveyScores {
  return PSYCHOLOGY_SURVEY_KEYS.every((key) => {
    const score = scores[key]
    return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 5
  })
}

export function isPsychologySurveyScores(value: unknown): value is PsychologySurveyScores {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return PSYCHOLOGY_SURVEY_KEYS.every((key) => {
    const score = record[key]
    return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 5
  })
}

/** All items share the same polarity: higher score = better wellbeing. */
export function averagePsychologyScore(scores: PsychologySurveyScores): number {
  const total = PSYCHOLOGY_SURVEY_KEYS.reduce((sum, key) => sum + scores[key], 0)
  return Math.round((total / PSYCHOLOGY_SURVEY_KEYS.length) * 10) / 10
}

export function psychologyQuestionLabelKey(key: PsychologySurveyKey): string {
  return `components.sessionFeedback.questions.${key}`
}

/** English fallback for stats/PDF helpers that do not have a translator. Prefer `t(psychologyQuestionLabelKey(id))` in UI. */
const FALLBACK_QUESTION_LABELS: Record<PsychologySurveyKey, string> = {
  mood: 'How is your mood?',
  confidenceToContinue: 'How confident do you feel about continuing to train?',
  confidenceDuring: 'How confident did you feel during the session?',
  focusDuring: 'How focused were you during the session?',
  errorHandling: 'How well did you handle the mistakes you made today?',
  feltImprovement: 'Do you feel you improved in this session?',
  performanceSatisfaction: 'How satisfied are you with your performance?',
  mentalFatigue: 'How is your mental fatigue?',
}

export function psychologyQuestionLabel(key: PsychologySurveyKey): string {
  return FALLBACK_QUESTION_LABELS[key] ?? key
}
