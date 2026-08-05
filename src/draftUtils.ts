import type { CustomTrainingTemplate, SurfSpot } from './types'

const LAST_SPOT_PREFIX = 'surfstar-last-spot'

export function resolveDraftSpotId(currentSpotId: string, spots: SurfSpot[]): string {
  if (currentSpotId && spots.some((spot) => spot.id === currentSpotId)) {
    return currentSpotId
  }
  return spots[0]?.id ?? ''
}

export function resolveDraftTemplateId(
  currentTemplateId: string,
  templates: CustomTrainingTemplate[],
): string {
  if (currentTemplateId && templates.some((template) => template.id === currentTemplateId)) {
    return currentTemplateId
  }
  return templates[0]?.id ?? ''
}

export function saveLastSpotId(orgId: string, spotId: string) {
  if (!orgId || !spotId) return
  try {
    localStorage.setItem(`${LAST_SPOT_PREFIX}:${orgId}`, spotId)
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function loadLastSpotId(orgId: string, spots: SurfSpot[]): string {
  try {
    const saved = localStorage.getItem(`${LAST_SPOT_PREFIX}:${orgId}`) ?? ''
    return resolveDraftSpotId(saved, spots)
  } catch {
    return resolveDraftSpotId('', spots)
  }
}
