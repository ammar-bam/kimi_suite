"use client";

import React from "react";

type FallbackProps = { error: Error; resetError: () => void };

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
};

type ErrorBoundaryState = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error && this.props.fallback) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export function ErrorFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-xl w-full border border-black/10 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center bg-red-50 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-red-500">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 19.5c-4.256 0-7.715-3.444-8.016-7.5h16.032c-.301 4.056-3.76 7.5-8.016 7.5z" clipRule="evenodd"/>
              <path fillRule="evenodd" d="M12.75 6.75h.007v.008h-.007V6.75zm0 2.25h.007v.008h-.007v-.008zm0 5.25H11.25a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-slate-600">{error.message}</p>
          <button
            onClick={resetError}
            className="mt-4 px-6 py-2 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}