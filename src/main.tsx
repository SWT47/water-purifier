import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('App Error:', error, info)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 max-w-md w-full text-center border border-[#E5E7EB]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={32}
                height={32}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              页面出现异常
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              很抱歉，页面在运行时遇到了问题。您可以尝试刷新页面，如果问题持续出现，请联系技术支持。
            </p>
            {this.state.error && (
              <div className="bg-gray-50 rounded-[6px] p-3 mb-6 text-left">
                <p className="text-xs text-gray-400 mb-1">错误信息</p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full h-10 bg-black text-white rounded-[6px] font-medium hover:bg-gray-800 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
