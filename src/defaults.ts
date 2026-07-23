import type { SurfSpot } from './types'

export function createDefaultSpots(): SurfSpot[] {
  return [{ id: 'spot-default', name: 'Home break' }]
}

export function createDefaultConditions(): string[] {
  return ['Clean', 'Onshore', 'Offshore', 'Choppy', 'Glassy', 'Average']
}
