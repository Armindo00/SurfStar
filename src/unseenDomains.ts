/** localStorage seen-state domains (scoped per user via resumeUserKey). */
export const UNSEEN = {
  athleteEquipmentReviews: 'athlete-equipment-reviews',
  athletePairing: 'athlete-pairing',
  athleteCheckins: 'athlete-checkins',
  athleteTrainingHistory: 'athlete-training-history',
  athleteHeats: 'athlete-heats',
  coachPairing: 'coach-pairing',
  coachOrgInvites: 'coach-org-invites',
  adminPlanRequests: 'admin-plan-requests',
} as const

export type UnseenDomain = (typeof UNSEEN)[keyof typeof UNSEEN]
