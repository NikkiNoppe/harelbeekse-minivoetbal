import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

interface InlineRetryProps {
  onRetry: () => Promise<void>;
  isLoading?: boolean;
  error?: any;
  itemCount?: number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic inline retry button for data that failed to load
 * Includes exponential backoff and cooldown to prevent rapid-fire requests
 */
export const InlineRetry: React.FC<InlineRetryProps> = ({
  onRetry,
  isLoading = false,
  error,
  itemCount = 0,
  emptyMessage = "Geen items gevonden",
  className = ""
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const lastRetryTime = useRef(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 5;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
    };
  }, []);

  // Update cooldown countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimer.current = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            if (cooldownTimer.current) clearInterval(cooldownTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      };
    }
  }, [cooldownSeconds]);

  // Don't show if loading or has items
  if (isLoading || itemCount > 0) {
    return null;
  }

  // Only show if there's an error or empty result (after loading finished)
  const shouldShow = error || itemCount === 0;
  if (!shouldShow) return null;

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES || isRetrying) return;
    
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime.current;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const minInterval = 1000 * Math.pow(2, retryCount);
    
    if (timeSinceLastRetry < minInterval && retryCount > 0) {
      // Too soon - show cooldown
      const remainingSeconds = Math.ceil((minInterval - timeSinceLastRetry) / 1000);
      setCooldownSeconds(remainingSeconds);
      return;
    }
    
    setIsRetrying(true);
    lastRetryTime.current = now;
    
    try {
      await onRetry();
      setRetryCount(prev => prev + 1);
    } catch (err) {
      console.error('Inline retry failed:', err);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  const isTimeoutError = error?.message?.includes('timeout') || error?.message?.includes('verbinding');
  const isDisabled = isRetrying || retryCount >= MAX_RETRIES || cooldownSeconds > 0;

  return (
    <div className={`flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
      <span className="text-xs text-amber-700 flex-1">
        {isTimeoutError 
          ? "Slechte verbinding" 
          : error 
            ? "Laden mislukt" 
            : emptyMessage
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
        ) : cooldownSeconds > 0 ? (
          <span className="text-xs">{cooldownSeconds}s</span>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Opnieuw</span>
          </>
        )}
      </Button>
      {retryCount > 0 && retryCount < MAX_RETRIES && (
        <span className="text-xs text-amber-500">{retryCount}/{MAX_RETRIES}</span>
      )}
      {retryCount >= MAX_RETRIES && (
        <span className="text-xs text-red-500">Max bereikt</span>
      )}
    </div>
  );
};

// Backward compatibility alias
export const InlinePlayerRetry = InlineRetry;
