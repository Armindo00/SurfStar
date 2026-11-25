import { describe, expect, it } from 'vitest'
import { buildPdfEvolutionCharts } from './athleteReportPdfEvolution'
import type { AthletePeriodAnalytics } from './teamAnalyticsStats'
import type { TrainingSession } from './types'
import { customAnalyticsRange } from './analyticsRange'

function session(partial: Partial<TrainingSession> & Pick<TrainingSession, 'id' | 'mode'>): TrainingSession {
  return {
    coachId: 'c1',
    organizationId: 'o1',
    athleteIds: ['a1'],
    spotId: 'sp1',
    spotName: 'Guincho',
    condition: 'clean',
    startedAt: '2026-11-01T10:00:00.000Z',
    endedAt: '2026-11-01T11:00:00.000Z',
    waves: [],
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    coachNotes: null,
    ...partial,
  }
}

describe('buildPdfEvolutionCharts', () => {
  it('tracks success avg level vs overall maneuver level', () => {
    const analytics: AthletePeriodAnalytics = {
      range: customAnalyticsRange('2026-11-01', '2026-11-30'),
      sessions: [
        session({
          id: 's1',
          mode: 'tecnico',
          endedAt: '2026-11-05T12:00:00.000Z',
          waves: [
            {
              id: 'w1',
              athleteId: 'a1',
              hasPotential: true,
              outcome: 'surfed',
              classified: true,
              multiManeuver: true,
              startedAt: '2026-11-05T10:10:00.000Z',
              maneuvers: [
                {
                  id: 'm1',
                  kind: 'rail',
                  side: 'frontside',
                  level: 3,
                  success: true,
                  at: '2026-11-05T10:10:00.000Z',
                },
                {
                  id: 'm2',
                  kind: 'rail',
                  side: 'frontside',
                  level: 1,
                  success: false,
                  at: '2026-11-05T10:11:00.000Z',
                },
              ],
              comboAttempts: [],
            },
          ],
        }),
        session({
          id: 's2',
          mode: 'combos',
          endedAt: '2026-11-12T12:00:00.000Z',
          waves: [
            {
              id: 'w2',
              athleteId: 'a1',
              hasPotential: false,
              outcome: 'surfed',
              classified: true,
              multiManeuver: true,
              startedAt: '2026-11-12T10:10:00.000Z',
              maneuvers: [],
              comboAttempts: [
                {
                  id: 'c1',
                  side: 'frontside',
                  level: 2,
                  success: true,
                  at: '2026-11-12T10:10:00.000Z',
                },
              ],
            },
          ],
        }),
      ],
      general: {
        totalTrainings: 2,
        totalWaves: 2,
        withPotential: 1,
        withoutPotential: 1,
        withPotentialRate: 50,
        withoutPotentialRate: 50,
        surfed: 2,
        wasted: 0,
        matrix: {
          potentialSurfed: 1,
          potentialWasted: 0,
          noPotentialSurfed: 1,
          noPotentialWasted: 0,
        },
        wellExecutedPotential: 1,
        valuedNoPotential: 1,
        aproveitamentoRate: 100,
        valorizacaoRate: 100,
        heatWins: 0,
        heatParticipations: 0,
        championshipWins: 0,
        avgHeatScore: null,
        totalStars: 0,
        technicalStars: 0,
        comboStars: 0,
        avgTechnicalManeuverLevel: 2,
        avgComboLevel: 2,
        avgOverallManeuverLevel: 2,
        totalManeuverAttempts: 3,
        technicalAttemptCount: 2,
        comboAttemptCount: 1,
      },
      technical: null,
      combo: null,
      evolution: [],
    }

    const charts = buildPdfEvolutionCharts(analytics, 'a1')
    expect(charts.periodLabels.length).toBeGreaterThan(0)
    expect(charts.successAvgLevels.some((v) => v !== null)).toBe(true)
    expect(charts.overallManeuverAvgLevels.some((v) => v !== null)).toBe(true)
    expect(charts.maneuverSuccessRates.some((v) => v === 50)).toBe(true)
    expect(charts.comboSuccessRates.some((v) => v === 100)).toBe(true)
  })
})
