import { describe, expect, it } from 'vitest'
import {
  buildComboReading,
  buildHeatReading,
  buildPsychologyReading,
  buildTechnicalReading,
  buildTopicReadings,
  type TopicReadingLabels,
} from './athleteInsights'
import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { SideCompareChart } from './athleteReportPdfEvolution'
import type { AthleteHeatAnalyticsSummary } from './heatAnalyticsStats'
import type { ComboSessionStatsSnapshot, SessionStatsSnapshot } from './sessionStats'

const labels: TopicReadingLabels = {
  readingLabel: 'Reading',
  technicalReadingSideGap:
    'The weak point is not technique overall — it is {{maneuver}} {{weakSide}} ({{weakRate}}% vs {{strongRate}}% {{strongSide}}, gap {{gap}} pts).',
  technicalReadingBalanced:
    'Sides are relatively balanced. Overall technical success {{rate}}% · avg level {{level}}.',
  technicalReadingThin: 'Not enough side-by-side technical data for a clear reading.',
  technicalReadingOverall:
    'Technical success {{rate}}% across {{attempts}} attempts · avg level {{level}}.',
  comboReadingSideGap:
    'Combo focus: {{level}} {{weakSide}} lags ({{weakRate}}% vs {{strongRate}}% {{strongSide}}, gap {{gap}} pts).',
  comboReadingBalanced:
    'Combo sides are relatively balanced. Success {{rate}}% · avg level {{level}}.',
  comboReadingThin: 'Not enough combo side data for a clear reading.',
  comboReadingOverall:
    'Combo success {{rate}}% across {{attempts}} attempts · avg level {{level}}.',
  heatReadingClutchNegative:
    'Opens with enough quality, but does not convert in the close (clutch {{clutch}}: open {{open}} → close {{close}}). Train pressure scenarios in the last third of the heat.',
  heatReadingClutchPositive:
    'Closes heats with intent (clutch {{clutch}}, late best {{close}}). Keep finishing under pressure as a strength.',
  heatReadingEarlyWeak:
    'Early banking is soft ({{rate}}% of timed heats reach 10 pts in the first 10 minutes). Prioritize first-wave urgency.',
  heatReadingEarlyStrong:
    'Opens heats well ({{rate}}% reach 10 pts early). Protect that start and convert into the close.',
  heatReadingThin: 'Heat results are logged, but timer data is too thin for rhythm reading.',
  heatReadingBasic: '{{heats}} heats in the period · avg score {{score}}. Add timer data for deeper rhythm insights.',
  psychologyReadingStandout:
    'Highest: {{highLabel}} {{highAvg}}/5 · needs attention: {{lowLabel}} {{lowAvg}}/5 (overall {{overall}}/5).',
  psychologyReadingThin: 'Psychology check-ins exist, but there is not enough detail for a standout reading.',
  frontside: 'Frontside',
  backside: 'Backside',
}

const emptySide = { attempts: 0, successes: 0, rate: 0 }

function technical(partial: Partial<SessionStatsSnapshot> = {}): SessionStatsSnapshot {
  return {
    waveStats: { totalWaves: 0, withPotential: 0, withoutPotential: 0 },
    totalManeuvers: 40,
    successfulManeuvers: 28,
    overallSuccessRate: 70,
    averageLevel: 2.4,
    bySide: {
      frontside: { ...emptySide },
      backside: { ...emptySide },
    },
    byKind: {} as SessionStatsSnapshot['byKind'],
    ...partial,
  }
}

function combo(partial: Partial<ComboSessionStatsSnapshot> = {}): ComboSessionStatsSnapshot {
  return {
    waveStats: { totalWaves: 0, withPotential: 0, withoutPotential: 0 },
    totalAttempts: 20,
    successfulAttempts: 12,
    overallSuccessRate: 60,
    averageLevel: 2.1,
    bySide: {
      frontside: { ...emptySide },
      backside: { ...emptySide },
    },
    byLevel: {} as ComboSessionStatsSnapshot['byLevel'],
    ...partial,
  }
}

function heat(partial: Partial<AthleteHeatAnalyticsSummary>): AthleteHeatAnalyticsSummary {
  return {
    heatsWithTiming: 0,
    heatsTotal: 0,
    avgHeatScore: null,
    avgBestWaveOpening: null,
    earlyTenPointsRate: null,
    avgEarlyTotalFirst10Min: null,
    avgTimeToFirstWaveMin: null,
    heatsWithFirstWave: 0,
    avgTimeToTwoMajorMin: null,
    heatsWithTwoMajor: 0,
    avgBestWaveClosing: null,
    closingMajorRate: null,
    openingMajorRate: null,
    clutchDelta: null,
    rows: [],
    ...partial,
  }
}

describe('athleteInsights topic readings', () => {
  it('flags the largest technical side gap', () => {
    const charts: SideCompareChart[] = [
      {
        title: 'Rail',
        frontsideSuccess: 80,
        backsideSuccess: 55,
        frontsideLevel: 2.5,
        backsideLevel: 2.0,
      },
      {
        title: 'Top turn',
        frontsideSuccess: 70,
        backsideSuccess: 68,
        frontsideLevel: 2.2,
        backsideLevel: 2.1,
      },
    ]
    const reading = buildTechnicalReading(technical(), charts, labels)
    expect(reading).toContain('Rail Backside')
    expect(reading).toContain('55%')
    expect(reading).toContain('80%')
    expect(reading).toContain('gap 25 pts')
  })

  it('reports balanced combo sides when gaps are small', () => {
    const charts: SideCompareChart[] = [
      {
        title: 'Level 2',
        frontsideSuccess: 62,
        backsideSuccess: 58,
        frontsideLevel: 2,
        backsideLevel: 2,
      },
    ]
    const reading = buildComboReading(combo(), charts, labels)
    expect(reading).toContain('relatively balanced')
    expect(reading).toContain('60%')
  })

  it('prioritizes negative clutch over early-bank metrics', () => {
    const reading = buildHeatReading(
      heat({
        heatsTotal: 8,
        heatsWithTiming: 6,
        avgHeatScore: 11.2,
        clutchDelta: -1.4,
        avgBestWaveOpening: 6.5,
        avgBestWaveClosing: 5.1,
        earlyTenPointsRate: 40,
      }),
      labels,
    )
    expect(reading).toContain('does not convert in the close')
    expect(reading).toContain('clutch -1.4')
  })

  it('reads psychology standouts from high/low questions', () => {
    const psychology = {
      checkIns: 4,
      feedbackRate: 50,
      averageOverall: 3.9,
      byQuestion: [
        { key: 'mood', label: 'Mood', average: 4.6 },
        { key: 'focusDuring', label: 'Focus during', average: 2.8 },
        { key: 'satisfaction', label: 'Satisfaction', average: 4.1 },
      ],
      timeline: [],
    } as unknown as AthletePsychologyAnalytics
    const reading = buildPsychologyReading(psychology, labels)
    expect(reading).toContain('Highest: Mood 4.6/5')
    expect(reading).toContain('needs attention: Focus during 2.8/5')
    expect(reading).toContain('overall 3.9/5')
  })

  it('builds all four topic readings together', () => {
    const readings = buildTopicReadings({
      technical: technical(),
      combo: combo(),
      technicalSideCharts: [
        {
          title: 'Rail',
          frontsideSuccess: 40,
          backsideSuccess: 70,
          frontsideLevel: 2,
          backsideLevel: 2.5,
        },
      ],
      comboSideCharts: [],
      heatAnalytics: heat({
        heatsTotal: 5,
        heatsWithTiming: 5,
        avgHeatScore: 12,
        clutchDelta: 0.8,
        avgBestWaveClosing: 7.2,
        earlyTenPointsRate: 80,
      }),
      psychology: {
        checkIns: 2,
        feedbackRate: 100,
        averageOverall: 4.0,
        byQuestion: [
          { key: 'mood', label: 'Mood', average: 4.5 },
          { key: 'mentalFatigue', label: 'Mental fatigue', average: 3.0 },
        ],
        timeline: [],
      } as unknown as AthletePsychologyAnalytics,
      labels,
    })
    expect(readings.technical).toContain('Rail Frontside')
    expect(readings.combo).toContain('60%')
    expect(readings.heat).toContain('Closes heats with intent')
    expect(readings.psychology).toContain('Mental fatigue')
  })
})
