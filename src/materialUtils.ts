import type { AthleteBoard } from './types'
import { formatShortDate } from './dateFormat'

type BoardLengthFields = Pick<AthleteBoard, 'lengthFeet' | 'lengthInches'>

type LegacyBoardLengthFields = BoardLengthFields & {
  lengthCm?: number | null
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round((totalInches - feet * 12) * 100) / 100
  return { feet, inches }
}

function formatInchValue(inches: number): string {
  return Number.isInteger(inches) ? String(inches) : inches.toFixed(2).replace(/\.?0+$/, '')
}

export function formatBoardLength(feet: number | null, inches: number | null): string | null {
  if (feet == null && inches == null) return null
  const wholeFeet = feet ?? 0
  const wholeInches = inches ?? 0
  if (wholeFeet === 0 && wholeInches === 0) return null
  return `${wholeFeet}'${formatInchValue(wholeInches)}"`
}

export function normalizeAthleteBoard(board: LegacyBoardLengthFields & Omit<AthleteBoard, keyof BoardLengthFields>): AthleteBoard {
  if (board.lengthFeet != null || board.lengthInches != null) {
    return {
      ...board,
      lengthFeet: board.lengthFeet ?? null,
      lengthInches: board.lengthInches ?? null,
    }
  }
  if (board.lengthCm != null) {
    const { feet, inches } = cmToFeetInches(board.lengthCm)
    return {
      ...board,
      lengthFeet: feet,
      lengthInches: inches,
    }
  }
  return {
    ...board,
    lengthFeet: null,
    lengthInches: null,
  }
}

export function formatBoardSpecs(board: Pick<
  AthleteBoard,
  'lengthFeet' | 'lengthInches' | 'widthInches' | 'thicknessInches' | 'volumeLiters'
>): string {
  const parts: string[] = []
  const length = formatBoardLength(board.lengthFeet, board.lengthInches)
  if (length) parts.push(length)
  if (board.widthInches != null) parts.push(`${board.widthInches}"`)
  if (board.thicknessInches != null) parts.push(`${board.thicknessInches}"`)
  if (board.volumeLiters != null) parts.push(`${board.volumeLiters} L`)
  return parts.join(' · ')
}

export function formatMaterialDate(iso: string): string {
  return formatShortDate(iso)
}
