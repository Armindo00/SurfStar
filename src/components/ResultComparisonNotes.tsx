import { useI18n } from '../i18n'
import {
  buildResultComparisonNotes,
  type ComparisonNoteLabels,
} from '../resultComparisonNotes'
import type { AthleteGeneralStats } from '../athleteStats'
import type { WaveStats } from '../sessionStats'

type Props = {
  waveStats?: WaveStats | null
  general?: AthleteGeneralStats | null
  technicalSuccessRate?: number | null
  comboSuccessRate?: number | null
  title?: string
}

function useComparisonLabels(): ComparisonNoteLabels {
  const { t } = useI18n()
  return {
    mostFrequentQuadrant: t('analytics.comparison.mostFrequentQuadrant'),
    quadrantShare: t('analytics.comparison.quadrantShare'),
    potentialShare: t('analytics.comparison.potentialShare'),
    aproveitamentoVsValorizacao: t('analytics.comparison.aproveitamentoVsValorizacao'),
    aproveitamentoOnly: t('analytics.comparison.aproveitamentoOnly'),
    valorizacaoOnly: t('analytics.comparison.valorizacaoOnly'),
    technicalVsCombo: t('analytics.comparison.technicalVsCombo'),
    technicalOnly: t('analytics.comparison.technicalOnly'),
    comboOnly: t('analytics.comparison.comboOnly'),
    heatWinShare: t('analytics.comparison.heatWinShare'),
    noWaveData: t('analytics.comparison.noWaveData'),
    matrixHighHigh: t('analytics.topicSheet.matrixCellHighHighTitle'),
    matrixHighLow: t('analytics.topicSheet.matrixCellHighLowTitle'),
    matrixLowHigh: t('analytics.topicSheet.matrixCellLowHighTitle'),
    matrixLowLow: t('analytics.topicSheet.matrixCellLowLowTitle'),
  }
}

export function ResultComparisonNotes({
  waveStats,
  general,
  technicalSuccessRate,
  comboSuccessRate,
  title,
}: Props) {
  const { t } = useI18n()
  const labels = useComparisonLabels()
  const notes = buildResultComparisonNotes({
    labels,
    waveStats,
    general,
    technicalSuccessRate,
    comboSuccessRate,
  })

  if (notes.length === 0) return null

  return (
    <section className="result-comparison-notes ss-card stats-panel">
      <h2 className="stats-panel__title">
        {title ?? t('analytics.comparison.title')}
      </h2>
      <ul className="result-comparison-notes__list">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  )
}
