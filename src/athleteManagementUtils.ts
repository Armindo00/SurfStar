import type { TrainingSession } from './types'

export function athleteSessionCount(athleteId: string, sessions: TrainingSession[]): number {
  return sessions.filter((s) => s.athleteIds.includes(athleteId)).length
}

export function canDeleteAthlete(athleteId: string, sessions: TrainingSession[]): boolean {
  return athleteSessionCount(athleteId, sessions) === 0
}
