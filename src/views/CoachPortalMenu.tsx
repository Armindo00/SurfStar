import { LanguagePicker } from '../components/LanguagePicker'
import { useI18n } from '../i18n'

type Props = {
  coachName: string
  isPlatformAdmin: boolean
  onAdmin: () => void
  onSubscription: () => void
  onHelp: () => void
  onContact: () => void
  onLogout: () => void
}

export function CoachPortalMenu({
  coachName,
  isPlatformAdmin,
  onAdmin,
  onSubscription,
  onHelp,
  onContact,
  onLogout,
}: Props) {
  const { t } = useI18n()

  return (
    <div id="coach-portal-menu" className="ss-flow coach-portal-menu">
      <div className="coach-portal-menu__intro">
        <h1 className="coach-portal-menu__title">{coachName}</h1>
        <p className="muted coach-portal-menu__sub">{t('coach.dashboard.navLabel')}</p>
      </div>

      <nav className="action-list coach-portal-menu__nav" aria-label={t('coach.dashboard.navLabel')}>
        {isPlatformAdmin ? (
          <button type="button" className="action-list__item" onClick={onAdmin}>
            <span className="action-list__label">
              <span className="action-list__icon" aria-hidden="true">
                ★
              </span>
              <span>{t('common.admin')}</span>
            </span>
            <span className="action-list__trail" aria-hidden="true">
              ›
            </span>
          </button>
        ) : null}
        <button type="button" className="action-list__item" onClick={onSubscription}>
          <span className="action-list__label">
            <span className="action-list__icon" aria-hidden="true">
              ⚙
            </span>
            <span>{t('nav.accountAndSubscription')}</span>
          </span>
          <span className="action-list__trail" aria-hidden="true">
            ›
          </span>
        </button>
        <button type="button" className="action-list__item" onClick={onHelp}>
          <span className="action-list__label">
            <span className="action-list__icon" aria-hidden="true">
              ?
            </span>
            <span>{t('common.help')}</span>
          </span>
          <span className="action-list__trail" aria-hidden="true">
            ›
          </span>
        </button>
        <button type="button" className="action-list__item" onClick={onContact}>
          <span className="action-list__label">
            <span className="action-list__icon" aria-hidden="true">
              ✉
            </span>
            <span>{t('nav.contactSurfStar')}</span>
          </span>
          <span className="action-list__trail" aria-hidden="true">
            ›
          </span>
        </button>
      </nav>

      <div className="ss-card coach-portal-menu__language">
        <LanguagePicker stackedMenu />
      </div>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={onLogout}>
        {t('common.signOut')}
      </button>
    </div>
  )
}
