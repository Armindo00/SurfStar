import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SurfStar crashed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h1>Algo correu mal</h1>
            <p className="muted">Recarrega a página. Se o problema persistir, termina sessão e volta a entrar.</p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
