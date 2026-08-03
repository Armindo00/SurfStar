import { DeleteAccountPanel } from '../../components/DeleteAccountPanel'
import { LanguagePicker } from '../../components/LanguagePicker'
import { NavBadge } from '../../components/NavBadge'
import { useI18n } from '../../i18n'
import type { AthleteDashboardAction, AthleteDashboardActionId } from './types'

type Props = {
  actions: AthleteDashboardAction[]
  onAction: (id: AthleteDashboardActionId) => void
  onHelp: () => void
  onContact: () => void
  onLogout: () => void
}

export function AthletePortalMenu({ actions, onAction, onHelp, onContact, onLogout }: Props) {
  const { messages } = useI18n()
  const A = messages.athlete

  return (
    <div id="athlete-portal-menu" className="ss-flow athlete-portal-menu">
      <div className="athlete-portal-menu__intro">
        <h1 className="athlete-portal-menu__title">{A.menu.title}</h1>
        <p className="muted athlete-portal-menu__sub">{A.menu.openDescription}</p>
      </div>

      <section className="athlete-portal-menu__section" aria-labelledby="athlete-menu-data">
        <h2 id="athlete-menu-data" className="athlete-portal-menu__section-title">
          {A.menu.dataSection}
        </h2>
        <nav className="action-list athlete-portal__nav" aria-label={A.menu.navLabel}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="action-list__item athlete-portal__nav-item"
              onClick={() => onAction(action.id)}
            >
              <span className="athlete-portal__nav-main">
                <span className="athlete-portal__nav-icon" aria-hidden="true">
                  {action.icon}
                </span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </span>
              </span>
              {action.badge ? (
                <NavBadge count={action.badge} className="athlete-portal__nav-badge" />
              ) : (
                <span className="athlete-portal__nav-chevron" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          ))}
        </nav>
      </section>

      <section className="athlete-portal-menu__section" aria-labelledby="athlete-menu-settings">
        <h2 id="athlete-menu-settings" className="athlete-portal-menu__section-title">
          {A.menu.settingsSection}
        </h2>
        <div className="athlete-portal-menu__settings">
          <button type="button" className="btn btn--outline btn--block" onClick={onHelp}>
            {A.helpAndInstall}
          </button>
          <button type="button" className="btn btn--outline btn--block" onClick={onContact}>
            {A.contactSurfStar}
          </button>
          <div className="ss-card stats-panel">
            <LanguagePicker />
          </div>
          <DeleteAccountPanel roleLabel="athlete" />
          <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={onLogout}>
            {A.signOut}
          </button>
        </div>
      </section>
    </div>
  )
}
