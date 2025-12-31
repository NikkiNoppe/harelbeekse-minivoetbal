import React, { memo, ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  disabled = false
}) => {
  const { pullDistance, isRefreshing, progress, isActive } = usePullToRefresh({
    onRefresh,
    disabled,
    threshold: 80,
    maxPullDistance: 120
  });

  return (
    <>
      {isActive && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />
      )}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isRefreshing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default memo(PullToRefreshWrapper);
