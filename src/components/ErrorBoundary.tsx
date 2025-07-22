import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Er is iets misgegaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen of ga terug naar de homepage.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-gray-100 p-3 rounded text-sm">
              <summary className="cursor-pointer font-medium mb-2">
                Technische details (alleen in ontwikkeling)
              </summary>
              <pre className="text-xs overflow-auto">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Opnieuw proberen
            </Button>
            <Button onClick={() => (window.location.href = '/')} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; error?: Error }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service like Sentry
      // console.error('Error details:', { error, errorInfo });
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 