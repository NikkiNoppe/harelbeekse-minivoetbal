import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AvailabilityPollCard } from '../components/AvailabilityPollCard';
import type { ScheduleCluster } from '@/services/scheidsrechter/monthScheduleService';
import type { AvailabilityInput } from '@/services/scheidsrechter/types';

interface AvailabilityPollSectionProps {
  clusters: ScheduleCluster[];
  myAvailability: Map<string, boolean>;
  onSubmitAvailability: (clusterKey: string, pollMonth: string, isAvailable: boolean) => Promise<void>;
  onBulkSubmitAvailability?: (pollMonth: string, availabilities: AvailabilityInput[]) => Promise<boolean>;
  isLoading: boolean;
  /** Verberg sectiekop — bv. in profiel-accordion */
  embedded?: boolean;
  layout?: 'checkbox' | 'quick';
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
  onBulkSubmitAvailability,
  isLoading,
  embedded = false,
  layout = 'quick',
}: AvailabilityPollSectionProps) {
  if (isLoading) {
    return (
      <section className="space-y-4" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <span className="sr-only">Beschikbaarheid laden…</span>
      </section>
    );
  }

  if (clusters.length === 0) {
    return (
      <section className="space-y-3">
        {!embedded && (
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-700)]">
            <CalendarDays className="h-5 w-5 text-primary" />
            Beschikbaarheid doorgeven
          </h2>
        )}
        <Card className="border-dashed border-border/80 shadow-sm">
          <CardContent className="p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Clock className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <h3 className="mt-3 text-base font-medium text-foreground">
              Geen open speeldagen
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Er staan momenteel geen toekomstige wedstrijden in het schema. Zodra de
              competitieleiding speeldagen publiceert, kun je hier je beschikbaarheid aangeven.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const byMonth = new Map<string, ScheduleCluster[]>();
  clusters.forEach((c) => {
    const arr = byMonth.get(c.poll_month) || [];
    arr.push(c);
    byMonth.set(c.poll_month, arr);
  });

  const totalClusters = clusters.length;
  const respondedCount = clusters.filter((c) => myAvailability.has(c.cluster_key)).length;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        {!embedded ? (
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-700)]">
            <CalendarDays className="h-5 w-5 text-primary" />
            Beschikbaarheid doorgeven
          </h2>
        ) : (
          <h3 className="text-sm font-semibold text-foreground">Beschikbaarheid doorgeven</h3>
        )}
        <p className="text-sm text-muted-foreground">
          Tik per speeldag <strong className="font-medium text-foreground">Beschikbaar</strong> of{' '}
          <strong className="font-medium text-foreground">Niet</strong> — je keuze wordt meteen
          opgeslagen.
          {respondedCount < totalClusters && (
            <span className="mt-1 block text-xs">
              Nog {totalClusters - respondedCount} speeldag
              {totalClusters - respondedCount === 1 ? '' : 'en'} zonder antwoord.
            </span>
          )}
        </p>
      </div>

      {Array.from(byMonth.entries()).map(([month, monthClusters]) => {
        const monthLabel = format(new Date(`${month}-01T00:00:00Z`), 'MMMM yyyy', { locale: nl });
        return (
          <div key={month} className="space-y-3">
            <h4 className="text-sm font-semibold capitalize text-foreground">{monthLabel}</h4>
            <AvailabilityPollCard
              layout={layout}
              clusters={monthClusters}
              myAvailability={myAvailability}
              onSubmit={(clusterKey, isAvailable) =>
                onSubmitAvailability(clusterKey, month, isAvailable)
              }
              onBulkSubmit={
                onBulkSubmitAvailability
                  ? (availabilities) => onBulkSubmitAvailability(month, availabilities)
                  : undefined
              }
            />
          </div>
        );
      })}
    </section>
  );
}
