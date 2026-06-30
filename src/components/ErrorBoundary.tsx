import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, Home, RefreshCw } from "lucide-react";
import { PUBLIC_ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ErrorFallback({
  error,
  componentStack,
  resetErrorBoundary,
}: {
  error: Error;
  componentStack?: string | null;
  resetErrorBoundary: () => void;
}) {
  const navigate = useNavigate();
  const showTechnicalDetails = import.meta.env.DEV && !!error;

  const handleGoHome = () => {
    resetErrorBoundary();
    navigate(PUBLIC_ROUTES.algemeen, { replace: true });
  };

  const actionButtonClass = "h-11 min-h-[44px] w-full";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100 p-4">
      <Card
        className="max-w-md w-full shadow-lg hover:shadow-lg transition-none"
        role="alert"
        aria-live="assertive"
      >
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-brand-200 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-brand-800" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-brand-900">Er is iets misgegaan</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-brand-700 text-center text-sm sm:text-base">
            Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen of ga terug naar de
            homepage.
          </p>

          {showTechnicalDetails && (
            <details className="group w-full overflow-hidden rounded-lg border border-brand-300 bg-brand-50 text-sm open:shadow-sm">
              <summary
                className={cn(
                  "flex h-11 min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4",
                  "text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <span>Technische details (alleen in ontwikkeling)</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="space-y-3 border-t border-brand-200 px-4 py-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700/80">
                    Foutmelding
                  </p>
                  <pre className="max-h-32 overflow-auto rounded-md bg-white/80 p-2 text-xs text-brand-900 whitespace-pre-wrap break-words">
                    {error.message || "Onbekende fout"}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700/80">
                      Stack trace
                    </p>
                    <pre className="max-h-48 overflow-auto rounded-md bg-white/80 p-2 text-xs text-brand-800 whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {componentStack && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700/80">
                      Component stack
                    </p>
                    <pre className="max-h-48 overflow-auto rounded-md bg-white/80 p-2 text-xs text-brand-800 whitespace-pre-wrap break-words">
                      {componentStack.trim()}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              className={cn(
                actionButtonClass,
                "border-brand-300 text-brand-800 hover:bg-brand-50 hover:text-brand-800",
              )}
              onClick={resetErrorBoundary}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Opnieuw proberen
            </Button>
            <Button type="button" className={actionButtonClass} onClick={handleGoHome}>
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
  { hasError: boolean; error?: Error; componentStack?: string | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack ?? null });

    const payload = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    if (import.meta.env.PROD) {
      if (typeof window !== "undefined" && "reportError" in window) {
        window.reportError(error);
      }
    } else {
      console.error("[ErrorBoundary]", payload);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined, componentStack: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          componentStack={this.state.componentStack}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
