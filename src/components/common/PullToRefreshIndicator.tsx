import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  progress,
  threshold = 80
}) => {
  // Don't render if no pull is happening
  if (pullDistance <= 0 && !isRefreshing) return null;

  const opacity = Math.min(1, progress);
  const scale = 0.5 + (progress * 0.5);
  const rotation = progress * 180;
  const readyToRefresh = progress >= 1;

  return (
    <div
      className="fixed left-0 right-0 flex justify-center pointer-events-none z-[60]"
      style={{
        top: 0,
        transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
        transition: isRefreshing ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg",
          "bg-background border border-border",
          readyToRefresh && !isRefreshing && "border-primary bg-primary/10"
        )}
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
        }}
      >
        <RefreshCw
          size={20}
          className={cn(
            "text-muted-foreground transition-colors",
            readyToRefresh && "text-primary",
            isRefreshing && "animate-spin text-primary"
          )}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s linear',
          }}
        />
      </div>
    </div>
  );
};

export default memo(PullToRefreshIndicator);
