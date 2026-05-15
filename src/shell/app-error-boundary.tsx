import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'

type Props = { children: ReactNode }

type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <ServerErrorPage
          error={this.state.error}
          onRetry={() => {
            this.setState({ error: null })
          }}
        />
      )
    }
    return this.props.children
  }
}
