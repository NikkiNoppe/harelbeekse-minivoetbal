import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { DeadlineCountdown } from '../components/DeadlineCountdown';
import { AvailabilityPollCard } from '../components/AvailabilityPollCard';
import type { MonthlyPoll, PollMatchDate, AvailabilityInput } from '@/services/scheidsrechter/types';

interface AvailabilityPollSectionProps {
  activePoll: MonthlyPoll | null;
  pollMatchDates: PollMatchDate[];
  myAvailability: Map<string, boolean>;
  onSubmitAvailability: (pollGroupId: string, isAvailable: boolean) => Promise<void>;
  isLoading: boolean;
}

export function AvailabilityPollSection({
  activePoll,
  pollMatchDates,
  myAvailability,
  onSubmitAvailability,
  isLoading
}: AvailabilityPollSectionProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Card className="shadow-[var(--shadow-elevation-1)]">
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </section>
    );
  }
  
  // No active poll
  if (!activePoll) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Beschikbaarheid Poll
        </h2>
        
        <Card className="shadow-[var(--shadow-elevation-1)] border-dashed">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-base">Geen actieve poll</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Er is momenteel geen poll open om je beschikbaarheid in te vullen.
                  <br />
                  Je ontvangt een bericht wanneer een nieuwe poll wordt geopend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  const isPollOpen = activePoll.status === 'open';
  const pollMonth = activePoll.poll_month;
  const monthLabel = format(new Date(`${pollMonth}-01`), 'MMMM yyyy', { locale: nl });
  
  return (
    <section className="space-y-4">
      {/* Header with deadline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Poll: {monthLabel}
          </h2>
          {!isPollOpen && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              Deze poll is gesloten
            </p>
          )}
        </div>
        
        {activePoll.deadline && (
          <DeadlineCountdown deadline={activePoll.deadline} />
        )}
      </div>
      
      {/* Poll card */}
      <AvailabilityPollCard
        matchDates={pollMatchDates}
        myAvailability={myAvailability}
        onSubmit={onSubmitAvailability}
        isPollOpen={isPollOpen}
      />
    </section>
  );
}
