import type { ReactNode } from 'react'
import React, { Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="p-6 rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '2px solid var(--accent-red)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="alert"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className="icon-[mdi--alert-circle-outline] w-12 h-12 mb-3"
              style={{ color: 'var(--accent-red)' }}
            />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-sm font-medium rounded transition-all hover-lift"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--text-inverse)',
              }}
            >
              <span className="flex items-center gap-2">
                <span className="icon-[mdi--refresh] w-4 h-4" />
                <span>Try Again</span>
              </span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
