import { DeleteAccountPanel } from '../../components/DeleteAccountPanel'
import { LanguagePicker } from '../../components/LanguagePicker'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useI18n } from '../../i18n'

type Props = {
  onBack: () => void
  onHelp: () => void
  onContact: () => void
}

export function AthletePortalAppSettings({ onBack, onHelp, onContact }: Props) {
  const { messages } = useI18n()
  const A = messages.athlete

  return (
    <div className="ss-flow athlete-portal-app-settings">
      <ScreenHeader title={A.menu.appSettings.title} onBack={onBack} />

      <div className="athlete-portal-app-settings__body">
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
      </div>
    </div>
  )
}
