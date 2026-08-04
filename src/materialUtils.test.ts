import { describe, expect, it } from 'vitest'
import { cmToFeetInches, formatBoardLength, formatBoardSpecs, normalizeAthleteBoard } from './materialUtils'
import type { AthleteBoard } from './types'

const baseBoard = (): AthleteBoard => ({
  id: 'b1',
  athleteId: 'a1',
  name: 'Test',
  lengthFeet: null,
  lengthInches: null,
  widthInches: null,
  thicknessInches: null,
  volumeLiters: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('formatBoardLength', () => {
  it('formats feet and inches like 5\'8"', () => {
    expect(formatBoardLength(5, 8)).toBe('5\'8"')
  })

  it('supports decimal inches', () => {
    expect(formatBoardLength(6, 2.5)).toBe('6\'2.5"')
  })
})

describe('cmToFeetInches', () => {
  it('converts 173 cm to about 5\'8"', () => {
    const { feet, inches } = cmToFeetInches(173)
    expect(feet).toBe(5)
    expect(inches).toBe(8.11)
  })
})

describe('normalizeAthleteBoard', () => {
  it('migrates legacy cm values', () => {
    const board = normalizeAthleteBoard({
      ...baseBoard(),
      lengthCm: 173,
    })
    expect(board.lengthFeet).toBe(5)
    expect(board.lengthInches).toBe(8.11)
  })
})

describe('formatBoardSpecs', () => {
  it('shows length in feet and inches', () => {
    expect(
      formatBoardSpecs({
        lengthFeet: 5,
        lengthInches: 8,
        widthInches: 19.25,
        thicknessInches: 2.56,
        volumeLiters: 28.5,
      }),
    ).toBe('5\'8" · 19.25" · 2.56" · 28.5 L')
  })
})
