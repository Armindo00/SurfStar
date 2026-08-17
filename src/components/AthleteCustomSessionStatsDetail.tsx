import { computeCustomSessionStats } from '../customTrainingStats'
import { useI18n } from '../i18n'
import type { TrainingSession } from '../types'
import { CustomButtonStatsList } from './CustomButtonStatsList'

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

type Props = {
  session: TrainingSession
  athleteId: string
}

export function AthleteCustomSessionStatsDetail({ session, athleteId }: Props) {
  const { t } = useI18n()
  const stats = computeCustomSessionStats(session, athleteId)
  const templateName = session.customTemplateName ?? t('ui.session.customTrainingFallback')

  return (
    <div className="athlete-custom-session-stats">
      <p className="muted stats-panel__sub">{templateName}</p>
      <div className="kpi-grid athlete-portal__kpi athlete-portal__kpi--compact">
        <article className="kpi-card">
          <span className="kpi-card__label">{t('ui.stats.attempts')}</span>
          <strong className="kpi-card__value">{stats.totalAttempts}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">{t('ui.stats.overallSuccess')}</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>
      <CustomButtonStatsList buttons={stats.byButton} />
    </div>
  )
}
