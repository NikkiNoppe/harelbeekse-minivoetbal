import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

interface InlinePlayerRetryProps {
  onRetry: () => Promise<void>;
  isLoading?: boolean;
  error?: any;
  playersCount?: number;
  className?: string;
}

/**
 * Inline retry button for player dropdowns
 * Shows when players fail to load or list is unexpectedly empty
 */
export const InlinePlayerRetry: React.FC<InlinePlayerRetryProps> = ({
  onRetry,
  isLoading = false,
  error,
  playersCount = 0,
  className = ""
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  // Don't show if loading or has players
  if (isLoading || playersCount > 0) {
    return null;
  }

  // Only show if there's an error or empty result (after loading finished)
  const shouldShow = error || playersCount === 0;
  if (!shouldShow) return null;

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      setRetryCount(prev => prev + 1);
    } catch (err) {
      console.error('Inline retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const isTimeoutError = error?.message?.includes('timeout') || error?.message?.includes('verbinding');
  const isDisabled = isRetrying || retryCount >= MAX_RETRIES;

  return (
    <div className={`flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
      <span className="text-xs text-amber-700 flex-1">
        {isTimeoutError 
          ? "Slechte verbinding" 
          : error 
            ? "Laden mislukt" 
            : "Geen spelers gevonden"
        }
      </span>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={handleRetry}
        disabled={isDisabled}
        className="h-7 px-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
      >
        {isRetrying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Opnieuw</span>
          </>
        )}
      </Button>
      {retryCount > 0 && (
        <span className="text-xs text-amber-500">{retryCount}/{MAX_RETRIES}</span>
      )}
    </div>
  );
};
