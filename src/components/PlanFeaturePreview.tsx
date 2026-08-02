import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { PlanFeaturePreviewCopy } from '../i18n/types'
import type { FeatureShowcaseId } from '../planFeatureShowcases'

type FeaturePreviewCopy = PlanFeaturePreviewCopy

type Props = {
  variant: FeatureShowcaseId
  className?: string
  framed?: boolean
  size?: 'default' | 'hero'
}

export function PlanFeaturePreview({
  variant,
  className = '',
  framed = true,
  size = 'default',
}: Props) {
  const { t, messages } = useI18n()
  const fp = messages.plans.featurePreview

  const content = (
    <div
      className={[
        'plan-feature-preview',
        size === 'hero' ? 'plan-feature-preview--hero' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {renderPreview(variant, fp, t)}
    </div>
  )

  if (!framed) return content

  return (
    <div className={`plan-device-frame ${size === 'hero' ? 'plan-device-frame--hero' : ''}`.trim()}>
      <div className="plan-device-frame__bezel">
        <div className="plan-device-frame__status">
          <span>9:41</span>
          <span className="plan-device-frame__signal">●●●</span>
        </div>
        <div className="plan-device-frame__screen">{content}</div>
        <div className="plan-device-frame__home" />
      </div>
    </div>
  )
}

function renderPreview(
  variant: FeatureShowcaseId,
  fp: FeaturePreviewCopy,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  switch (variant) {
    case 'live-stats':
      return <LiveStatsPreview fp={fp} />
    case 'technical-training':
      return <TechnicalTrainingPreview fp={fp} />
    case 'heats-championship':
      return <HeatsPreview fp={fp} t={t} />
    case 'team-analytics':
      return <TeamAnalyticsPreview fp={fp} />
    case 'gear-quiver':
      return <GearQuiverPreview fp={fp} />
    case 'equipment-ratings':
      return <EquipmentRatingsPreview fp={fp} />
    case 'psychology-checkins':
      return <PsychologyPreview fp={fp} />
    case 'custom-training':
      return <CustomTrainingPreview fp={fp} />
    case 'sea-analysis':
      return <SeaAnalysisPreview fp={fp} t={t} />
    case 'athlete-sharing':
      return <SharingPreview fp={fp} />
    case 'multi-coach':
      return <MultiCoachPreview fp={fp} t={t} />
    case 'organization-roster':
      return <OrganizationPreview fp={fp} />
    default:
      return null
  }
}

function PreviewShell({
  pill,
  title,
  accent = 'blue',
  children,
}: {
  pill: string
  title: string
  accent?: 'blue' | 'gold' | 'green' | 'purple'
  children: ReactNode
}) {
  return (
    <div className={`plan-feature-preview__card plan-feature-preview__card--${accent}`}>
      <header className="plan-feature-preview__head">
        <span className="plan-feature-preview__pill">{pill}</span>
        <strong>{title}</strong>
      </header>
      <div className="plan-feature-preview__body">{children}</div>
    </div>
  )
}

function LiveStatsPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.liveStats.pill} title={fp.liveStats.title} accent="blue">
      <div className="plan-feature-preview__kpis plan-feature-preview__kpis--accent">
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight">
          <span>87%</span><small>{fp.liveStats.success}</small>
        </div>
        <div className="plan-feature-preview__kpi"><span>24</span><small>{fp.liveStats.waves}</small></div>
        <div className="plan-feature-preview__kpi"><span>3</span><small>{fp.liveStats.athletes}</small></div>
      </div>
      <div className="plan-feature-preview__bars">
        {[
          { label: 'Rail', width: '82%' },
          { label: 'Top turn', width: '74%' },
          { label: 'Progressive', width: '91%' },
        ].map((bar) => (
          <div key={bar.label} className="plan-feature-preview__bar-row">
            <span>{bar.label}</span>
            <div className="plan-feature-preview__bar-track">
              <i style={{ width: bar.width }} />
            </div>
            <em>{bar.width}</em>
          </div>
        ))}
      </div>
    </PreviewShell>
  )
}

function TechnicalTrainingPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.technicalTraining.pill} title={fp.technicalTraining.title} accent="blue">
      <div className="plan-feature-preview__maneuver-grid">
        <div className="plan-feature-preview__maneuver plan-feature-preview__maneuver--ok">
          <span>Rail</span><strong>L3</strong><em>✓</em>
        </div>
        <div className="plan-feature-preview__maneuver">
          <span>Top turn</span><strong>L2</strong><em>—</em>
        </div>
        <div className="plan-feature-preview__maneuver plan-feature-preview__maneuver--ok">
          <span>Progressive</span><strong>L4</strong><em>✓</em>
        </div>
      </div>
      <div className="plan-feature-preview__meta-row">
        <span className="plan-feature-preview__chip plan-feature-preview__chip--ok">{fp.technicalTraining.withPotential}</span>
        <span className="plan-feature-preview__chip">{fp.technicalTraining.backside}</span>
      </div>
    </PreviewShell>
  )
}

function HeatsPreview({
  fp,
  t,
}: {
  fp: FeaturePreviewCopy
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <PreviewShell pill={fp.heatsChampionship.pill} title={fp.heatsChampionship.title} accent="gold">
      <div className="plan-feature-preview__timer">{t('plans.featurePreview.heatsChampionship.timer', { time: '04:32' })}</div>
      <div className="plan-feature-preview__podium">
        <div className="plan-feature-preview__podium-row plan-feature-preview__podium-row--first">
          <span>1</span><div><strong>Ana Costa</strong><small>14.50 pts · 8.50 + 6.00</small></div>
        </div>
        <div className="plan-feature-preview__podium-row">
          <span>2</span><div><strong>Miguel R.</strong><small>12.17 pts · 7.17 + 5.00</small></div>
        </div>
      </div>
      <div className="plan-feature-preview__meta-row">
        <span className="plan-feature-preview__chip plan-feature-preview__chip--warn">{fp.heatsChampionship.interference}</span>
      </div>
    </PreviewShell>
  )
}

function TeamAnalyticsPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.teamAnalytics.pill} title={fp.teamAnalytics.title} accent="purple">
      <div className="plan-feature-preview__kpis">
        <div className="plan-feature-preview__kpi"><span>3.2</span><small>{fp.teamAnalytics.avgLevel}</small></div>
        <div className="plan-feature-preview__kpi"><span>18</span><small>{fp.teamAnalytics.sessions}</small></div>
        <div className="plan-feature-preview__kpi"><span>74%</span><small>{fp.teamAnalytics.potential}</small></div>
      </div>
      <div className="plan-feature-preview__chart">
        {[40, 55, 48, 62, 58, 74].map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="plan-feature-preview__tabs">
        <span className="plan-feature-preview__tab plan-feature-preview__tab--active">{fp.teamAnalytics.training}</span>
        <span className="plan-feature-preview__tab">{fp.teamAnalytics.psychology}</span>
        <span className="plan-feature-preview__tab">{fp.teamAnalytics.equipment}</span>
      </div>
    </PreviewShell>
  )
}

function GearQuiverPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.gearQuiver.pill} title={fp.gearQuiver.title} accent="green">
      <ul className="plan-feature-preview__gear-list">
        <li>
          <span className="plan-feature-preview__gear-icon">🏄</span>
          <div><strong>Hypto Krypto</strong><small>6'0 · 19.5" · 36.5 L</small></div>
        </li>
        <li>
          <span className="plan-feature-preview__gear-icon">🏄</span>
          <div><strong>Black Baron</strong><small>5'10 · 19.0" · 32.0 L</small></div>
        </li>
        <li>
          <span className="plan-feature-preview__gear-icon">⚙</span>
          <div><strong>PCC Quad set</strong><small>Medium · FCS II</small></div>
        </li>
      </ul>
    </PreviewShell>
  )
}

function EquipmentRatingsPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.equipmentRatings.pill} title={fp.equipmentRatings.title} accent="green">
      <div className="plan-feature-preview__ratings">
        {[
          { label: 'Speed', stars: 4 },
          { label: 'Control', stars: 5 },
          { label: 'Release', stars: 3 },
        ].map((row) => (
          <div key={row.label} className="plan-feature-preview__rating-row">
            <span>{row.label}</span>
            <strong>{'★'.repeat(row.stars)}{'☆'.repeat(5 - row.stars)}</strong>
          </div>
        ))}
      </div>
      <p className="plan-feature-preview__foot">{fp.equipmentRatings.foot}</p>
    </PreviewShell>
  )
}

function PsychologyPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.psychologyCheckins.pill} title={fp.psychologyCheckins.title} accent="purple">
      <ul className="plan-feature-preview__survey">
        {[
          ['Heat confidence', '4'],
          ['Session focus', '5'],
          ['Overall emotional state', '4'],
        ].map(([label, score]) => (
          <li key={label}>
            <span>{label}</span>
            <div className="plan-feature-preview__score-dots">
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={n <= Number(score) ? 'is-on' : ''} />
              ))}
              <strong>{score}/5</strong>
            </div>
          </li>
        ))}
      </ul>
    </PreviewShell>
  )
}

function CustomTrainingPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.customTraining.pill} title={fp.customTraining.title} accent="gold">
      <div className="plan-feature-preview__skill-grid">
        <span className="plan-feature-preview__skill plan-feature-preview__skill--active">Cutback</span>
        <span className="plan-feature-preview__skill">Re-entry</span>
        <span className="plan-feature-preview__skill">Tube</span>
        <span className="plan-feature-preview__skill">Layback</span>
      </div>
      <div className="plan-feature-preview__kpis">
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight"><span>76%</span><small>{fp.customTraining.success}</small></div>
        <div className="plan-feature-preview__kpi"><span>12:40</span><small>{fp.customTraining.timer}</small></div>
        <div className="plan-feature-preview__kpi"><span>18</span><small>{fp.customTraining.logs}</small></div>
      </div>
    </PreviewShell>
  )
}

function SeaAnalysisPreview({
  fp,
  t,
}: {
  fp: FeaturePreviewCopy
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <PreviewShell
      pill={t('plans.featurePreview.seaAnalysis.pill', { time: '18:42' })}
      title={fp.seaAnalysis.title}
      accent="blue"
    >
      <div className="plan-feature-preview__recommend">
        <span>{fp.seaAnalysis.recommendedPeak}</span>
        <strong>{fp.seaAnalysis.peak1}</strong>
        <p>{fp.seaAnalysis.peakDesc}</p>
      </div>
      <div className="plan-feature-preview__peak-compare">
        <div className="plan-feature-preview__peak plan-feature-preview__peak--win">
          <span>Peak 1</span><strong>42</strong><small>{t('plans.featurePreview.seaAnalysis.obs', { count: 18 })}</small>
        </div>
        <div className="plan-feature-preview__peak">
          <span>Peak 2</span><strong>31</strong><small>{t('plans.featurePreview.seaAnalysis.obs', { count: 14 })}</small>
        </div>
      </div>
      <div className="plan-feature-preview__meta-row">
        {['Set', 'Large int.', 'Small'].map((chip) => (
          <span key={chip} className="plan-feature-preview__chip">{chip}</span>
        ))}
      </div>
    </PreviewShell>
  )
}

function SharingPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.athleteSharing.pill} title={fp.athleteSharing.title} accent="green">
      <ul className="plan-feature-preview__toggle-list">
        {[
          ['Technical training stats', true],
          ['Combo stats', true],
          ['Session history', true],
          ['Psychology check-ins', false],
        ].map(([label, on]) => (
          <li key={label as string} className={on ? 'is-on' : ''}>
            <span>{label as string}</span>
            <em>{on ? fp.athleteSharing.on : fp.athleteSharing.off}</em>
          </li>
        ))}
      </ul>
    </PreviewShell>
  )
}

function MultiCoachPreview({
  fp,
  t,
}: {
  fp: FeaturePreviewCopy
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <PreviewShell pill={fp.multiCoach.pill} title={fp.multiCoach.title} accent="gold">
      <ul className="plan-feature-preview__coach-list">
        <li><strong>{fp.multiCoach.headCoach}</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">{fp.multiCoach.admin}</span></li>
        <li><strong>{t('plans.featurePreview.multiCoach.assistantCoach', { n: 1 })}</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">{fp.multiCoach.active}</span></li>
        <li><strong>{t('plans.featurePreview.multiCoach.assistantCoach', { n: 2 })}</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">{fp.multiCoach.active}</span></li>
      </ul>
      <p className="plan-feature-preview__foot">{fp.multiCoach.foot}</p>
    </PreviewShell>
  )
}

function OrganizationPreview({ fp }: { fp: FeaturePreviewCopy }) {
  return (
    <PreviewShell pill={fp.organizationRoster.pill} title={fp.organizationRoster.title} accent="gold">
      <div className="plan-feature-preview__kpis plan-feature-preview__kpis--accent">
        <div className="plan-feature-preview__kpi"><span>48</span><small>{fp.organizationRoster.athletes}</small></div>
        <div className="plan-feature-preview__kpi"><span>4</span><small>{fp.organizationRoster.coaches}</small></div>
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight"><span>126</span><small>{fp.organizationRoster.sessions}</small></div>
      </div>
      <div className="plan-feature-preview__org-bar">
        <span>{fp.organizationRoster.sharedRoster}</span>
        <div><i style={{ width: '78%' }} /></div>
      </div>
    </PreviewShell>
  )
}
