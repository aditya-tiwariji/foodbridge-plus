import React, { Component } from 'react';
import Container from './Container.jsx';
import PageWrapper from './PageWrapper.jsx';
import Button from '../ui/Button.jsx';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageWrapper className="flex items-center justify-center bg-slate-50 min-h-screen">
          <Container className="text-center flex flex-col items-center max-w-md">
            <div className="p-4 bg-red-50 rounded-full text-red-600 mb-6">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">
              We encountered an unexpected error on this page. Try refreshing or contact support if the issue persists.
            </p>
            <Button
              variant="primary"
              className="mt-8"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Container>
        </PageWrapper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
