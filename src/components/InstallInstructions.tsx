import { getInstallHelp } from '../helpContent'
import { useI18n } from '../i18n'
import { isAppInstalled } from '../pwaInstall'

export function InstallInstructions() {
  const { locale, messages } = useI18n()
  const install = getInstallHelp(locale)
  const installed = isAppInstalled()

  return (
    <div className="install-help">
      <p className="muted">{install.lead}</p>
      {installed ? (
        <p className="install-help__installed login-success">
          {messages.components.installInstructions.alreadyInstalled}
        </p>
      ) : null}

      <article className="install-help__platform">
        <h3>{install.iphone.title}</h3>
        <ol className="install-help__steps">
          {install.iphone.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <article className="install-help__platform">
        <h3>{install.android.title}</h3>
        <ol className="install-help__steps">
          {install.android.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <p className="muted install-help__note">{install.note}</p>
    </div>
  )
}
