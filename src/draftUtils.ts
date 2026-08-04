import type { CustomTrainingTemplate, SurfSpot } from './types'

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
