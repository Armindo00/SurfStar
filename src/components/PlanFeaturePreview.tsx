import type { ReactNode } from 'react'
import type { FeatureShowcaseId } from '../planFeatureShowcases'

type Props = {
  variant: FeatureShowcaseId
  className?: string
}

export function PlanFeaturePreview({ variant, className = '' }: Props) {
  return (
    <div className={`plan-feature-preview ${className}`.trim()} aria-hidden="true">
      {variant === 'live-stats' ? <LiveStatsPreview /> : null}
      {variant === 'technical-training' ? <TechnicalTrainingPreview /> : null}
      {variant === 'heats-championship' ? <HeatsPreview /> : null}
      {variant === 'team-analytics' ? <TeamAnalyticsPreview /> : null}
      {variant === 'gear-quiver' ? <GearQuiverPreview /> : null}
      {variant === 'equipment-ratings' ? <EquipmentRatingsPreview /> : null}
      {variant === 'psychology-checkins' ? <PsychologyPreview /> : null}
      {variant === 'custom-training' ? <CustomTrainingPreview /> : null}
      {variant === 'sea-analysis' ? <SeaAnalysisPreview /> : null}
      {variant === 'athlete-sharing' ? <SharingPreview /> : null}
      {variant === 'multi-coach' ? <MultiCoachPreview /> : null}
      {variant === 'organization-roster' ? <OrganizationPreview /> : null}
    </div>
  )
}

function PreviewShell({
  pill,
  title,
  children,
}: {
  pill: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="plan-feature-preview__card">
      <header className="plan-feature-preview__head">
        <span className="plan-feature-preview__pill">{pill}</span>
        <strong>{title}</strong>
      </header>
      {children}
    </div>
  )
}

function LiveStatsPreview() {
  return (
    <PreviewShell pill="Live stats" title="Carcavelos · Technical training">
      <div className="plan-feature-preview__kpis">
        <div><span>87%</span><small>Success</small></div>
        <div><span>24</span><small>Waves</small></div>
        <div><span>3</span><small>Athletes</small></div>
      </div>
      <div className="plan-feature-preview__bars">
        <div><span>Rail</span><div><i style={{ width: '82%' }} /></div></div>
        <div><span>Top turn</span><div><i style={{ width: '74%' }} /></div></div>
        <div><span>Progressive</span><div><i style={{ width: '91%' }} /></div></div>
      </div>
    </PreviewShell>
  )
}

function TechnicalTrainingPreview() {
  return (
    <PreviewShell pill="Technical training" title="Wave 12 · João Silva">
      <div className="plan-feature-preview__chips">
        <span className="plan-feature-preview__chip plan-feature-preview__chip--ok">Rail · L3 · ✓</span>
        <span className="plan-feature-preview__chip">Top turn · L2</span>
        <span className="plan-feature-preview__chip plan-feature-preview__chip--ok">Progressive · L4 · ✓</span>
      </div>
      <p className="plan-feature-preview__foot">Frontside · With potential</p>
    </PreviewShell>
  )
}

function HeatsPreview() {
  return (
    <PreviewShell pill="Heat 2 · Final" title="Supertubos championship">
      <div className="plan-feature-preview__heat-grid">
        <div><span>1st</span><strong>Ana Costa</strong><small>14.50 pts</small></div>
        <div><span>2nd</span><strong>Miguel R.</strong><small>12.17 pts</small></div>
      </div>
      <div className="plan-feature-preview__chips">
        <span className="plan-feature-preview__chip">8.50</span>
        <span className="plan-feature-preview__chip">6.00</span>
        <span className="plan-feature-preview__chip plan-feature-preview__chip--warn">Interference</span>
      </div>
    </PreviewShell>
  )
}

function TeamAnalyticsPreview() {
  return (
    <PreviewShell pill="Team analytics · 6m" title="Ana Costa">
      <div className="plan-feature-preview__kpis">
        <div><span>3.2</span><small>Avg level</small></div>
        <div><span>18</span><small>Sessions</small></div>
        <div><span>74%</span><small>Potential</small></div>
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
    <PreviewShell pill="Gear quiver" title="My boards">
      <ul className="plan-feature-preview__list">
        <li><strong>Hypto Krypto</strong><span>6'0 · 36.5 L</span></li>
        <li><strong>Black Baron</strong><span>5'10 · 32.0 L</span></li>
        <li><strong>PCC Quad set</strong><span>Medium · FCS II</span></li>
      </ul>
    </PreviewShell>
  )
}

function EquipmentRatingsPreview() {
  return (
    <PreviewShell pill="Equipment ratings" title="Hypto Krypto · Last session">
      <div className="plan-feature-preview__ratings">
        <div><span>Speed</span><strong>★★★★☆</strong></div>
        <div><span>Control</span><strong>★★★★★</strong></div>
        <div><span>Release</span><strong>★★★☆☆</strong></div>
      </div>
    </PreviewShell>
  )
}

function PsychologyPreview() {
  return (
    <PreviewShell pill="Check-in rápido" title="Post-session wellbeing">
      <ul className="plan-feature-preview__survey">
        <li><span>Confiança na bateria</span><strong>4/5</strong></li>
        <li><span>Concentração durante a sessão</span><strong>5/5</strong></li>
        <li><span>Estado emocional geral</span><strong>4/5</strong></li>
      </ul>
      <p className="plan-feature-preview__foot">Opt-in per athlete</p>
    </PreviewShell>
  )
}

function CustomTrainingPreview() {
  return (
    <PreviewShell pill="Custom training" title="Cutback focus · Carcavelos">
      <div className="plan-feature-preview__chips">
        <span className="plan-feature-preview__chip plan-feature-preview__chip--active">Cutback</span>
        <span className="plan-feature-preview__chip">Re-entry</span>
        <span className="plan-feature-preview__chip">Tube</span>
      </div>
      <div className="plan-feature-preview__kpis">
        <div><span>76%</span><small>Success</small></div>
        <div><span>12:40</span><small>Timer</small></div>
        <div><span>18</span><small>Logs</small></div>
      </div>
    </PreviewShell>
  )
}

function SeaAnalysisPreview() {
  return (
    <PreviewShell pill="Sea analysis" title="Supertubos · Offshore">
      <div className="plan-feature-preview__recommend">
        <span>Recommended peak</span>
        <strong>Peak 1</strong>
        <p>Stronger sets and faster arrivals</p>
      </div>
      <div className="plan-feature-preview__heat-grid">
        <div><span>Peak 1</span><strong>42 pts</strong></div>
        <div><span>Peak 2</span><strong>31 pts</strong></div>
      </div>
    </PreviewShell>
  )
}

function SharingPreview() {
  return (
    <PreviewShell pill="Athlete sharing" title="João Silva · Settings">
      <ul className="plan-feature-preview__checks">
        <li>✓ Technical training stats</li>
        <li>✓ Combo stats</li>
        <li>✓ Session history</li>
        <li>☐ Psychology check-ins</li>
      </ul>
    </PreviewShell>
  )
}

function MultiCoachPreview() {
  return (
    <PreviewShell pill="Organization" title="Team Academy coaches">
      <ul className="plan-feature-preview__list">
        <li><strong>Head coach</strong><span>Admin</span></li>
        <li><strong>Assistant 1</strong><span>Active</span></li>
        <li><strong>Assistant 2</strong><span>Active</span></li>
      </ul>
      <p className="plan-feature-preview__foot">Up to 5 coach accounts</p>
    </PreviewShell>
  )
}

function OrganizationPreview() {
  return (
    <PreviewShell pill="Team Academy" title="Peniche Surf School">
      <div className="plan-feature-preview__kpis">
        <div><span>48</span><small>Athletes</small></div>
        <div><span>4</span><small>Coaches</small></div>
        <div><span>126</span><small>Sessions</small></div>
      </div>
      <p className="plan-feature-preview__foot">Shared roster & database</p>
    </PreviewShell>
  )
}
