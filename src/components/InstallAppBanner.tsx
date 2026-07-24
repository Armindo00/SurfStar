import { useCallback, useEffect, useState } from 'react'
import {
  dismissInstallPrompt,
  isIos,
  shouldOfferInstall,
  type BeforeInstallPromptEvent,
} from '../pwaInstall'

export function InstallAppBanner() {
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
    <aside className="install-banner" role="region" aria-label="Install SurfStar">
      <div className="install-banner__inner">
        <div className="install-banner__copy">
          <p className="install-banner__eyebrow">Add to home screen</p>
          <h2 className="install-banner__title">Open SurfStar like an app</h2>
          {ios ? (
            <ol className="install-banner__steps">
              <li>
                Tap <strong>Share</strong> in Safari (□ with arrow)
              </li>
              <li>
                Choose <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong> — the SurfStar icon appears on your phone
              </li>
            </ol>
          ) : deferredPrompt ? (
            <p className="install-banner__text">
              Install SurfStar on your phone for one-tap access at the beach — no App Store needed.
            </p>
          ) : (
            <p className="install-banner__text">
              In Chrome, open the menu (⋮) and tap <strong>Install app</strong> or{' '}
              <strong>Add to Home screen</strong>.
            </p>
          )}
        </div>

        <div className="install-banner__actions">
          {!ios && deferredPrompt ? (
            <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={install}>
              {busy ? 'Please wait…' : 'Install SurfStar'}
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost btn--block" onClick={close}>
            {ios || !deferredPrompt ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </aside>
  )
}
