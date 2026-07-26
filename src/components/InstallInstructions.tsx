import { INSTALL_HELP } from '../helpContent'
import { isAppInstalled } from '../pwaInstall'

export function InstallInstructions() {
  const installed = isAppInstalled()

  return (
    <div className="install-help">
      <p className="muted">{INSTALL_HELP.lead}</p>
      {installed ? (
        <p className="install-help__installed login-success">SurfStar is already installed on this device.</p>
      ) : null}

      <article className="install-help__platform">
        <h3>{INSTALL_HELP.iphone.title}</h3>
        <ol className="install-help__steps">
          {INSTALL_HELP.iphone.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <article className="install-help__platform">
        <h3>{INSTALL_HELP.android.title}</h3>
        <ol className="install-help__steps">
          {INSTALL_HELP.android.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <p className="muted install-help__note">{INSTALL_HELP.note}</p>
    </div>
  )
}
