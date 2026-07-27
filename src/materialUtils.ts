import type { AthleteBoard } from './types'

export function formatBoardSpecs(board: Pick<
  AthleteBoard,
  'lengthCm' | 'widthInches' | 'thicknessInches' | 'volumeLiters'
>): string {
  const parts: string[] = []
  if (board.lengthCm != null) parts.push(`${board.lengthCm} cm`)
  if (board.widthInches != null) parts.push(`${board.widthInches}"`)
  if (board.thicknessInches != null) parts.push(`${board.thicknessInches}"`)
  if (board.volumeLiters != null) parts.push(`${board.volumeLiters} L`)
  return parts.join(' · ')
}

export function formatMaterialDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
