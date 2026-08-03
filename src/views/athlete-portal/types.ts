export type AthletePortalSheet =
  | 'coaches'
  | 'shared-stats'
  | 'checkins'
  | 'heats'
  | 'training-history'
  | 'evolution'

export type AthleteDashboardActionId = AthletePortalSheet | 'material' | 'equipment-reviews'

export type AthleteDashboardAction = {
  id: AthleteDashboardActionId
  label: string
  description: string
  icon: string
  badge?: number
}

export type AthleteDashboardNav = AthletePortalSheet | 'material'
