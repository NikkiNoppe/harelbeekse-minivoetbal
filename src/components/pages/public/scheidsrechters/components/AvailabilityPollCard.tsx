import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  Check,
  X,
  Minus,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ScheduleCluster } from '@/services/scheidsrechter/monthScheduleService';
import type { AvailabilityInput } from '@/services/scheidsrechter/types';

type AvailChoice = 'unset' | 'yes' | 'no';

interface AvailabilityPollCardProps {
  clusters: ScheduleCluster[];
  myAvailability: Map<string, boolean>;
  onSubmit: (clusterKey: string, isAvailable: boolean) => Promise<void>;
  onBulkSubmit?: (availabilities: AvailabilityInput[]) => Promise<boolean>;
  /** compact = profiel / mobiel met grote tikknoppen */
  layout?: 'checkbox' | 'quick';
}

function getChoice(key: string, availability: Map<string, boolean>): AvailChoice {
  if (!availability.has(key)) return 'unset';
  return availability.get(key) ? 'yes' : 'no';
}

export function AvailabilityPollCard({
  clusters,
  myAvailability,
  onSubmit,
  onBulkSubmit,
  layout = 'quick',
}: AvailabilityPollCardProps) {
  const [localAvailability, setLocalAvailability] = useState<Map<string, boolean>>(myAvailability);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalAvailability(myAvailability);
  }, [myAvailability]);

  const stats = useMemo(() => {
    const responded = clusters.filter((c) => localAvailability.has(c.cluster_key)).length;
    const available = clusters.filter((c) => localAvailability.get(c.cluster_key) === true).length;
    return { responded, available, total: clusters.length };
  }, [clusters, localAvailability]);

  const handleChoice = useCallback(
    async (clusterKey: string, choice: 'yes' | 'no') => {
      setError(null);
      const isAvailable = choice === 'yes';

      setLocalAvailability((prev) => new Map(prev).set(clusterKey, isAvailable));
      setPendingUpdates((prev) => new Set(prev).add(clusterKey));

      try {
        await onSubmit(clusterKey, isAvailable);
      } catch {
        setLocalAvailability((prev) => {
          const next = new Map(prev);
          next.delete(clusterKey);
          return next;
        });
        setError('Kon beschikbaarheid niet opslaan');
      } finally {
        setPendingUpdates((prev) => {
          const next = new Set(prev);
          next.delete(clusterKey);
          return next;
        });
      }
    },
    [onSubmit],
  );

  const handleMarkAllAvailable = async () => {
    if (!onBulkSubmit || clusters.length === 0) return;
    setError(null);
    setBulkPending(true);

    const optimistic = new Map(localAvailability);
    clusters.forEach((c) => optimistic.set(c.cluster_key, true));
    setLocalAvailability(optimistic);

    try {
      const ok = await onBulkSubmit(
        clusters.map((c) => ({
          poll_group_id: c.cluster_key,
          is_available: true,
        })),
      );
      if (!ok) {
        setLocalAvailability(myAvailability);
        setError('Kon bulk-update niet opslaan');
      }
    } catch {
      setLocalAvailability(myAvailability);
      setError('Kon bulk-update niet opslaan');
    } finally {
      setBulkPending(false);
    }
  };

  if (clusters.length === 0) {
    return (
      <Card className="border-dashed border-border/80 shadow-sm">
        <CardContent className="p-6 text-center sm:p-8">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
          <p className="text-sm text-muted-foreground">Geen speeldagen in deze maand</p>
        </CardContent>
      </Card>
    );
  }

  const progressPct = stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0;

  return (
    <div className="space-y-3">
      {layout === 'quick' && (
        <>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">
                {stats.responded}/{stats.total} speeldagen ingevuld
              </span>
              <span className="text-muted-foreground">
                {stats.available} beschikbaar
              </span>
            </div>
            <Progress value={progressPct} className="h-2" aria-label={`Voortgang ${progressPct}%`} />
            {onBulkSubmit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] w-full sm:w-auto"
                disabled={bulkPending || stats.available === stats.total}
                onClick={() => void handleMarkAllAvailable()}
              >
                {bulkPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="mr-2 h-4 w-4 text-success" aria-hidden />
                )}
                Alles beschikbaar
              </Button>
            )}
          </div>

          <div
            className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px]"
            role="note"
            aria-label="Legenda beschikbaarheid"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-dashed border-border bg-card">
                <Minus className="h-2.5 w-2.5 text-muted-foreground/60" aria-hidden />
              </span>
              <span>Nog niet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-success/40 bg-success/15">
                <Check className="h-2.5 w-2.5 text-success" aria-hidden />
              </span>
              <span>Beschikbaar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-destructive/30 bg-destructive/5">
                <X className="h-2.5 w-2.5 text-destructive/80" aria-hidden />
              </span>
              <span>Niet</span>
            </div>
          </div>
        </>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {clusters.map((cluster) => {
          const choice = getChoice(cluster.cluster_key, localAvailability);
          const isPending = pendingUpdates.has(cluster.cluster_key);
          const dayDate = new Date(`${cluster.match_date}T00:00:00Z`);

          if (layout === 'checkbox') {
            return (
              <CheckboxClusterRow
                key={cluster.cluster_key}
                cluster={cluster}
                dayDate={dayDate}
                isAvailable={choice === 'yes'}
                isPending={isPending}
                onToggle={(checked) => void handleChoice(cluster.cluster_key, checked ? 'yes' : 'no')}
              />
            );
          }

          return (
            <article
              key={cluster.cluster_key}
              className={cn(
                'rounded-xl border p-3 sm:p-4 transition-colors',
                choice === 'yes' && 'border-success/40 bg-success/5',
                choice === 'no' && 'border-destructive/30 bg-destructive/5',
                choice === 'unset' && 'border-border/80 bg-card',
                isPending && 'opacity-70',
              )}
            >
              <div className="space-y-2">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {format(dayDate, 'EEEE d MMMM', { locale: nl })}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {cluster.time_slot}
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{cluster.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {cluster.matches.length} wedstrijd{cluster.matches.length === 1 ? '' : 'en'}
                      </span>
                    </div>
                  </div>
                  {choice === 'unset' && (
                    <span className="shrink-0 rounded-full border border-dashed border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Kies
                    </span>
                  )}
                </div>

                <ul className="space-y-0.5 border-l-2 border-primary/15 pl-2">
                  {cluster.matches.map((m) => {
                    const t = new Date(m.match_date);
                    const time = `${String(t.getUTCHours()).padStart(2, '0')}:${String(
                      t.getUTCMinutes(),
                    ).padStart(2, '0')}`;
                    return (
                      <li
                        key={m.match_id}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className="font-mono text-foreground/80">{time}</span>
                        <span className="min-w-0 truncate">
                          {m.home_team_name} – {m.away_team_name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  aria-pressed={choice === 'yes'}
                  aria-label={`Beschikbaar op ${format(dayDate, 'd MMMM', { locale: nl })}`}
                  onClick={() => void handleChoice(cluster.cluster_key, 'yes')}
                  className={cn(
                    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    choice === 'yes'
                      ? 'border-success bg-success text-white shadow-sm'
                      : 'border-success/40 bg-success/10 text-foreground hover:bg-success/20',
                    isPending && 'cursor-wait',
                  )}
                >
                  {isPending && choice === 'yes' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  Beschikbaar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  aria-pressed={choice === 'no'}
                  aria-label={`Niet beschikbaar op ${format(dayDate, 'd MMMM', { locale: nl })}`}
                  onClick={() => void handleChoice(cluster.cluster_key, 'no')}
                  className={cn(
                    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    choice === 'no'
                      ? 'border-destructive/80 bg-destructive text-white shadow-sm'
                      : 'border-destructive/30 bg-destructive/5 text-foreground hover:bg-destructive/10',
                    isPending && 'cursor-wait',
                  )}
                >
                  {isPending && choice === 'no' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <X className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  Niet
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxClusterRow({
  cluster,
  dayDate,
  isAvailable,
  isPending,
  onToggle,
}: {
  cluster: ScheduleCluster;
  dayDate: Date;
  isAvailable: boolean;
  isPending: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        isAvailable ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
        isPending && 'opacity-70',
      )}
    >
      <input
        type="checkbox"
        id={`avail-${cluster.cluster_key}`}
        checked={isAvailable}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={isPending}
        className="mt-1 h-4 w-4"
        aria-label={`Beschikbaar op ${format(dayDate, 'd MMMM', { locale: nl })}`}
      />
      <label htmlFor={`avail-${cluster.cluster_key}`} className="min-w-0 flex-1 cursor-pointer">
        <span className="text-sm font-medium capitalize">
          {format(dayDate, 'EEEE d MMMM', { locale: nl })}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {cluster.location} · {cluster.time_slot}
        </span>
      </label>
    </div>
  );
}
