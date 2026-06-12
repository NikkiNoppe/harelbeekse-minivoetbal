import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AvailabilityPollCard } from '../components/AvailabilityPollCard';
import type { ScheduleCluster } from '@/services/scheidsrechter/monthScheduleService';

interface AvailabilityPollSectionProps {
  clusters: ScheduleCluster[];
  myAvailability: Map<string, boolean>;
  onSubmitAvailability: (clusterKey: string, pollMonth: string, isAvailable: boolean) => Promise<void>;
  isLoading: boolean;
}

/**
 * Toont alle aankomende wedstrijd-clusters waarop de scheidsrechter
 * beschikbaarheid kan aangeven. Geclusterd per (datum + locatie) en
 * gegroepeerd per maand.
 */
export function AvailabilityPollSection({
  clusters,
  myAvailability,
  onSubmitAvailability,
  isLoading,
}: AvailabilityPollSectionProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
        </div>
        <Card className="shadow-[var(--shadow-elevation-1)]">
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </section>
    );
  }

  if (clusters.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-700)]">
          <CalendarDays className="h-5 w-5 text-primary" />
          Mijn beschikbaarheid
        </h2>
        <Card className="shadow-[var(--shadow-elevation-1)] border-dashed">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-base text-foreground">Geen aankomende wedstrijden</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Er staan momenteel geen wedstrijden in het schema voor de komende weken.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Groepeer per maand
  const byMonth = new Map<string, ScheduleCluster[]>();
  clusters.forEach((c) => {
    const arr = byMonth.get(c.poll_month) || [];
    arr.push(c);
    byMonth.set(c.poll_month, arr);
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-700)]">
          <CalendarDays className="h-5 w-5 text-primary" />
          Mijn beschikbaarheid
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vink aan op welke speeldagen je beschikbaar bent om te fluiten.
        </p>
      </div>

      {Array.from(byMonth.entries()).map(([month, monthClusters]) => {
        const monthLabel = format(new Date(`${month}-01T00:00:00Z`), 'MMMM yyyy', { locale: nl });
        return (
          <div key={month} className="space-y-3">
            <h3 className="text-base font-semibold capitalize text-foreground">{monthLabel}</h3>
            <AvailabilityPollCard
              clusters={monthClusters}
              myAvailability={myAvailability}
              onSubmit={(clusterKey, isAvailable) => onSubmitAvailability(clusterKey, month, isAvailable)}
            />
          </div>
        );
      })}
    </section>
  );
}
