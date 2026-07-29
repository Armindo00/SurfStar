import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isSentryEnabled, Sentry } from '../sentry'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SurfStar crashed', error, info)
    if (isSentryEnabled()) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: info.componentStack } },
      })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h1>Something went wrong</h1>
            <p className="muted">Reload the page. If the problem persists, sign out and sign in again.</p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
