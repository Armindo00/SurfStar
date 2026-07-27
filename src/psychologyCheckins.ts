import { normalizeAthleteShareSettings, type CoachAthleteLink } from './types'

export function linkHasPsychologyCheckins(
  link: Pick<CoachAthleteLink, 'status' | 'shareSettings'>,
): boolean {
  if (link.status !== 'active') return false
  return normalizeAthleteShareSettings(link.shareSettings).psychologyCheckins
}

export function coachIdsWithPsychologyCheckins(links: CoachAthleteLink[]): Set<string> {
  return new Set(links.filter(linkHasPsychologyCheckins).map((link) => link.coachId))
}
