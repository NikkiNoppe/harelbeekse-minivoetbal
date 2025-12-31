import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

export function usePullToRefresh(options: UsePullToRefreshOptions = {}) {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    disabled = false
  } = options;

  const isMobile = useIsMobile();
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const canPull = useCallback(() => {
    // Only allow pull when at the top of the page
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !isMobile || state.isRefreshing) return;
    
    if (canPull()) {
      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [disabled, isMobile, state.isRefreshing, canPull]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || disabled || state.isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    // Only pull down, not up
    if (distance > 0 && canPull()) {
      // Apply resistance - the further you pull, the harder it gets
      const resistedDistance = Math.min(
        maxPullDistance,
        distance * 0.5
      );

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: resistedDistance
      }));

      // Prevent default scroll behavior when pulling
      if (resistedDistance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, state.isRefreshing, canPull, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || state.isRefreshing) return;

    isPullingRef.current = false;

    if (state.pullDistance >= threshold) {
      // Trigger refresh
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        pullDistance: threshold * 0.6 // Keep indicator visible during refresh
      }));

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default: reload the page
          window.location.reload();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0
        });
      }
    } else {
      // Reset without refresh
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0
      });
    }
  }, [state.pullDistance, state.isRefreshing, threshold, onRefresh]);

  useEffect(() => {
    if (!isMobile || disabled) return;

    const touchMoveHandler = (e: TouchEvent) => {
      handleTouchMove(e);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...state,
    progress: Math.min(1, state.pullDistance / threshold),
    isActive: isMobile && !disabled
  };
}
