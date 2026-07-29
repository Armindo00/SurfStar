import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN
const debug = import.meta.env.VITE_SENTRY_DEBUG === 'true'

export function isSentryEnabled(): boolean {
  return typeof dsn === 'string' && dsn.trim().length > 0 && (import.meta.env.PROD || debug)
}

export function initSentry(): void {
  if (!isSentryEnabled()) return

  Sentry.init({
    dsn: dsn.trim(),
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.authorization
      }
      return event
    },
  })
}

export { Sentry }
