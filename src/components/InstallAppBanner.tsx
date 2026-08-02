import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import {
  dismissInstallPrompt,
  isIos,
  shouldOfferInstall,
  type BeforeInstallPromptEvent,
} from '../pwaInstall'

export function InstallAppBanner() {
  const { messages, t } = useI18n()
  const b = messages.components.installAppBanner
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!shouldOfferInstall()) return

    setVisible(true)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const close = useCallback(() => {
    dismissInstallPrompt()
    setVisible(false)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    setBusy(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        dismissInstallPrompt()
        setVisible(false)
      }
    } finally {
      setDeferredPrompt(null)
      setBusy(false)
    }
  }, [deferredPrompt])

  if (!visible) return null

  const ios = isIos()

  return (
    <aside className="install-banner" role="region" aria-label={b.ariaLabel}>
      <div className="install-banner__inner">
        <div className="install-banner__copy">
          <p className="install-banner__eyebrow">{b.eyebrow}</p>
          <h2 className="install-banner__title">{b.title}</h2>
          {ios ? (
            <ol className="install-banner__steps">
              {b.iosSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : deferredPrompt ? (
            <p className="install-banner__text">{b.androidPrompt}</p>
          ) : (
            <p className="install-banner__text">{b.androidManual}</p>
          )}
        </div>

        <div className="install-banner__actions">
          {!ios && deferredPrompt ? (
            <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={install}>
              {busy ? t('common.pleaseWait') : b.install}
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost btn--block" onClick={close}>
            {ios || !deferredPrompt ? b.gotIt : b.notNow}
          </button>
        </div>
      </div>
    </aside>
  )
}
