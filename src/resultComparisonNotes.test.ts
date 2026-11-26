import { describe, expect, it } from 'vitest'
import { buildResultComparisonNotes, type ComparisonNoteLabels } from './resultComparisonNotes'

const labels: ComparisonNoteLabels = {
  mostFrequentQuadrant: 'Most frequent quadrant: {{quadrant}} ({{pct}}%, {{count}} waves).',
  quadrantShare: 'That quadrant is {{pct}}% of {{total}} waves total.',
  potentialShare:
    'Waves with potential {{withPct}}% ({{withCount}}) · without potential {{withoutPct}}% ({{withoutCount}}).',
  aproveitamentoVsValorizacao:
    'Success {{aproveitamento}}% · valuing wave {{valorizacao}}% (gap {{delta}} pp).',
  aproveitamentoOnly: 'Success rate {{aproveitamento}}% in this period.',
  valorizacaoOnly: 'Valuing wave {{valorizacao}}% in this period.',
  technicalVsCombo:
    'Technical success {{technical}}% · combos {{combo}}% (gap {{delta}} pp).',
  technicalOnly: 'Technical success {{technical}}% in this period.',
  comboOnly: 'Combo success {{combo}}% in this period.',
  heatWinShare: 'Heats: {{wins}}/{{heats}} wins ({{pct}}%).',
  noWaveData: 'No classified waves in this period to compare.',
  matrixHighHigh: 'High potential / high result',
  matrixHighLow: 'High potential / low result',
  matrixLowHigh: 'Low potential / high result',
  matrixLowLow: 'Low potential / low result',
}

describe('buildResultComparisonNotes', () => {
  it('compares wave quadrants and rates without coaching verbs', () => {
    const notes = buildResultComparisonNotes({
      labels,
      waveStats: {
        totalWaves: 10,
        withPotential: 4,
        withoutPotential: 6,
        matrix: {
          potentialSurfed: 2,
          potentialWasted: 2,
          noPotentialSurfed: 1,
          noPotentialWasted: 5,
        },
        aproveitamentoRate: 50,
        valorizacaoRate: 20,
      },
      technicalSuccessRate: 70,
      comboSuccessRate: 60,
    })

    expect(notes.some((n) => n.includes('Low potential / low result'))).toBe(true)
    expect(notes.some((n) => n.includes('Success 50%'))).toBe(true)
    expect(notes.some((n) => n.includes('valuing wave 20%'))).toBe(true)
    expect(notes.some((n) => n.includes('Technical success 70%'))).toBe(true)
    expect(notes.join(' ').toLowerCase()).not.toMatch(/should|must|need|requer|necessita|suger/)
  })
})
