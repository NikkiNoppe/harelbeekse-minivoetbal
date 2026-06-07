import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { PUBLIC_ROUTES } from "@/config/routes";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetErrorBoundary();
    navigate(PUBLIC_ROUTES.algemeen, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <Card
        className="max-w-md w-full shadow-lg hover:shadow-lg transition-none"
        role="alert"
        aria-live="assertive"
      >
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-purple-800" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-purple-900">Er is iets misgegaan</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-purple-700 text-center text-sm sm:text-base">
            Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen of ga terug naar de
            homepage.
          </p>
          {process.env.NODE_ENV === "development" && error && (
            <details className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium mb-2 min-h-[44px] flex items-center py-2 text-purple-900">
                Technische details (alleen in ontwikkeling)
              </summary>
              <pre className="text-xs overflow-auto text-purple-800 whitespace-pre-wrap break-words">
                {error.message}
                {"\n"}
                {error.stack}
              </pre>
            </details>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 border-purple-300 text-purple-800 hover:bg-purple-50"
              onClick={resetErrorBoundary}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Opnieuw proberen
            </Button>
            <Button type="button" className="w-full sm:flex-1" onClick={handleGoHome}>
              <Home className="h-4 w-4" aria-hidden />
              Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const payload = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    if (process.env.NODE_ENV === "production") {
      if (typeof window !== "undefined" && "reportError" in window) {
        window.reportError(error);
      }
    } else {
      console.error("[ErrorBoundary]", payload);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
