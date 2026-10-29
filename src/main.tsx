import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Collocation Blaster:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', marginBottom: '12px' }}>
            Collocation Blaster Encountered an Issue
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected runtime issue occurred.'}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#06b6d4',
              color: '#090d16',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reset & Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
