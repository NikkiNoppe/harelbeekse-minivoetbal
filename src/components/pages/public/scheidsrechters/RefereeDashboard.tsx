import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, User } from 'lucide-react';
import { useRefereeDashboard } from './hooks/useRefereeDashboard';
import { AvailabilityPollSection } from './sections/AvailabilityPollSection';
import { AssignedMatchesSection } from './sections/AssignedMatchesSection';
import { RefereeStatsSection } from './sections/RefereeStatsSection';

export function RefereeDashboard() {
  const {
    clusters,
    myAvailability,
    assignments,
    isLoadingSchedule,
    isLoadingAssignments,
    username,
    submitAvailability,
    refreshData,
  } = useRefereeDashboard();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="scheids-page space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Scheidsrechter Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <User className="h-4 w-4" />
            Welkom, {username}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      {/* Personal stats */}
      <RefereeStatsSection
        assignments={assignments}
        isLoading={isLoadingAssignments}
      />

      {/* Sections */}
      <div className="space-y-8">
        <AvailabilityPollSection
          clusters={clusters}
          myAvailability={myAvailability}
          onSubmitAvailability={submitAvailability}
          onBulkSubmitAvailability={submitBulkAvailability}
          isLoading={isLoadingSchedule}
        />

        <AssignedMatchesSection
          assignments={assignments}
          isLoading={isLoadingAssignments}
        />
      </div>
    </div>
  );
}
