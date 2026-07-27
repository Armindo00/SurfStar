import type { ReactNode } from 'react'
import type { FeatureShowcaseId } from '../planFeatureShowcases'

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
      {renderPreview(variant)}
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

function renderPreview(variant: FeatureShowcaseId) {
  switch (variant) {
    case 'live-stats':
      return <LiveStatsPreview />
    case 'technical-training':
      return <TechnicalTrainingPreview />
    case 'heats-championship':
      return <HeatsPreview />
    case 'team-analytics':
      return <TeamAnalyticsPreview />
    case 'gear-quiver':
      return <GearQuiverPreview />
    case 'equipment-ratings':
      return <EquipmentRatingsPreview />
    case 'psychology-checkins':
      return <PsychologyPreview />
    case 'custom-training':
      return <CustomTrainingPreview />
    case 'sea-analysis':
      return <SeaAnalysisPreview />
    case 'athlete-sharing':
      return <SharingPreview />
    case 'multi-coach':
      return <MultiCoachPreview />
    case 'organization-roster':
      return <OrganizationPreview />
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

function LiveStatsPreview() {
  return (
    <PreviewShell pill="Live stats" title="Carcavelos · Technical" accent="blue">
      <div className="plan-feature-preview__kpis plan-feature-preview__kpis--accent">
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight">
          <span>87%</span><small>Success</small>
        </div>
        <div className="plan-feature-preview__kpi"><span>24</span><small>Waves</small></div>
        <div className="plan-feature-preview__kpi"><span>3</span><small>Athletes</small></div>
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

function TechnicalTrainingPreview() {
  return (
    <PreviewShell pill="Technical · Wave 12" title="John Silva · Frontside" accent="blue">
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
        <span className="plan-feature-preview__chip plan-feature-preview__chip--ok">With potential</span>
        <span className="plan-feature-preview__chip">Backside</span>
      </div>
    </PreviewShell>
  )
}

function HeatsPreview() {
  return (
    <PreviewShell pill="Championship · Heat 2" title="Supertubos · Final" accent="gold">
      <div className="plan-feature-preview__timer">04:32 remaining</div>
      <div className="plan-feature-preview__podium">
        <div className="plan-feature-preview__podium-row plan-feature-preview__podium-row--first">
          <span>1</span><div><strong>Ana Costa</strong><small>14.50 pts · 8.50 + 6.00</small></div>
        </div>
        <div className="plan-feature-preview__podium-row">
          <span>2</span><div><strong>Miguel R.</strong><small>12.17 pts · 7.17 + 5.00</small></div>
        </div>
      </div>
      <div className="plan-feature-preview__meta-row">
        <span className="plan-feature-preview__chip plan-feature-preview__chip--warn">Interference logged</span>
      </div>
    </PreviewShell>
  )
}

function TeamAnalyticsPreview() {
  return (
    <PreviewShell pill="Team analytics · 6 months" title="Ana Costa profile" accent="purple">
      <div className="plan-feature-preview__kpis">
        <div className="plan-feature-preview__kpi"><span>3.2</span><small>Avg level</small></div>
        <div className="plan-feature-preview__kpi"><span>18</span><small>Sessions</small></div>
        <div className="plan-feature-preview__kpi"><span>74%</span><small>Potential</small></div>
      </div>
      <div className="plan-feature-preview__chart">
        {[40, 55, 48, 62, 58, 74].map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="plan-feature-preview__tabs">
        <span className="plan-feature-preview__tab plan-feature-preview__tab--active">Training</span>
        <span className="plan-feature-preview__tab">Psychology</span>
        <span className="plan-feature-preview__tab">Equipment</span>
      </div>
    </PreviewShell>
  )
}

function GearQuiverPreview() {
  return (
    <PreviewShell pill="Gear quiver" title="My boards & fins" accent="green">
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

function EquipmentRatingsPreview() {
  return (
    <PreviewShell pill="Equipment ratings" title="Hypto Krypto · Session" accent="green">
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
      <p className="plan-feature-preview__foot">Rated after Carcavelos · Technical</p>
    </PreviewShell>
  )
}

function PsychologyPreview() {
  return (
    <PreviewShell pill="Quick check-in" title="Post-session wellbeing" accent="purple">
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

function CustomTrainingPreview() {
  return (
    <PreviewShell pill="Custom training" title="Cutback focus · Carcavelos" accent="gold">
      <div className="plan-feature-preview__skill-grid">
        <span className="plan-feature-preview__skill plan-feature-preview__skill--active">Cutback</span>
        <span className="plan-feature-preview__skill">Re-entry</span>
        <span className="plan-feature-preview__skill">Tube</span>
        <span className="plan-feature-preview__skill">Layback</span>
      </div>
      <div className="plan-feature-preview__kpis">
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight"><span>76%</span><small>Success</small></div>
        <div className="plan-feature-preview__kpi"><span>12:40</span><small>Timer</small></div>
        <div className="plan-feature-preview__kpi"><span>18</span><small>Logs</small></div>
      </div>
    </PreviewShell>
  )
}

function SeaAnalysisPreview() {
  return (
    <PreviewShell pill="Sea analysis · 18:42 left" title="Supertubos · Offshore" accent="blue">
      <div className="plan-feature-preview__recommend">
        <span>Recommended peak</span>
        <strong>Peak 1</strong>
        <p>Stronger sets · faster arrivals · higher wave score</p>
      </div>
      <div className="plan-feature-preview__peak-compare">
        <div className="plan-feature-preview__peak plan-feature-preview__peak--win">
          <span>Peak 1</span><strong>42</strong><small>18 obs</small>
        </div>
        <div className="plan-feature-preview__peak">
          <span>Peak 2</span><strong>31</strong><small>14 obs</small>
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

function SharingPreview() {
  return (
    <PreviewShell pill="Athlete sharing" title="John Silva · Permissions" accent="green">
      <ul className="plan-feature-preview__toggle-list">
        {[
          ['Technical training stats', true],
          ['Combo stats', true],
          ['Session history', true],
          ['Psychology check-ins', false],
        ].map(([label, on]) => (
          <li key={label as string} className={on ? 'is-on' : ''}>
            <span>{label as string}</span>
            <em>{on ? 'ON' : 'OFF'}</em>
          </li>
        ))}
      </ul>
    </PreviewShell>
  )
}

function MultiCoachPreview() {
  return (
    <PreviewShell pill="Organization" title="Team Academy · Coaches" accent="gold">
      <ul className="plan-feature-preview__coach-list">
        <li><strong>Head coach</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">Admin</span></li>
        <li><strong>Assistant coach 1</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">Active</span></li>
        <li><strong>Assistant coach 2</strong><span className="plan-feature-preview__chip plan-feature-preview__chip--ok">Active</span></li>
      </ul>
      <p className="plan-feature-preview__foot">Up to 5 coach accounts included</p>
    </PreviewShell>
  )
}

function OrganizationPreview() {
  return (
    <PreviewShell pill="Team Academy" title="Peniche Surf School" accent="gold">
      <div className="plan-feature-preview__kpis plan-feature-preview__kpis--accent">
        <div className="plan-feature-preview__kpi"><span>48</span><small>Athletes</small></div>
        <div className="plan-feature-preview__kpi"><span>4</span><small>Coaches</small></div>
        <div className="plan-feature-preview__kpi plan-feature-preview__kpi--highlight"><span>126</span><small>Sessions</small></div>
      </div>
      <div className="plan-feature-preview__org-bar">
        <span>Shared roster</span>
        <div><i style={{ width: '78%' }} /></div>
      </div>
    </PreviewShell>
  )
}
