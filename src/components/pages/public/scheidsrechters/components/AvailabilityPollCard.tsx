import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, MapPin, Clock, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ScheduleCluster } from '@/services/scheidsrechter/monthScheduleService';

interface AvailabilityPollCardProps {
  clusters: ScheduleCluster[];
  myAvailability: Map<string, boolean>;
  onSubmit: (clusterKey: string, isAvailable: boolean) => Promise<void>;
}

export function AvailabilityPollCard({
  clusters,
  myAvailability,
  onSubmit,
}: AvailabilityPollCardProps) {
  const [localAvailability, setLocalAvailability] = useState<Map<string, boolean>>(myAvailability);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalAvailability(myAvailability);
  }, [myAvailability]);

  const handleCheckChange = async (clusterKey: string, checked: boolean) => {
    setError(null);

    setLocalAvailability((prev) => new Map(prev).set(clusterKey, checked));
    setPendingUpdates((prev) => new Set(prev).add(clusterKey));

    try {
      await onSubmit(clusterKey, checked);
    } catch (err) {
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
  };

  if (clusters.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-elevation-1)]">
        <CardContent className="p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Geen wedstrijden voor deze maand</p>
        </CardContent>
      </Card>
    );
  }

  const availableCount = clusters.filter((c) => localAvailability.get(c.cluster_key)).length;

  return (
    <Card className="shadow-[var(--shadow-elevation-1)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">Speeldagen</CardTitle>
          <Badge variant="outline" className="text-xs">
            {availableCount} / {clusters.length} beschikbaar
          </Badge>
        </div>
        <CardDescription>
          Selecteer per speeldag of je kan fluiten — je keuze wordt automatisch opgeslagen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {clusters.map((cluster) => {
          const isAvailable = localAvailability.get(cluster.cluster_key) ?? false;
          const isPending = pendingUpdates.has(cluster.cluster_key);
          const dayDate = new Date(`${cluster.match_date}T00:00:00Z`);

          return (
            <div
              key={cluster.cluster_key}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                isAvailable
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card border-border hover:border-primary/20',
                isPending && 'opacity-70',
              )}
            >
              <Checkbox
                id={`avail-${cluster.cluster_key}`}
                checked={isAvailable}
                onCheckedChange={(checked) =>
                  handleCheckChange(cluster.cluster_key, checked === true)
                }
                disabled={isPending}
                aria-label={`Beschikbaar op ${format(dayDate, 'd MMMM', { locale: nl })}`}
                className="mt-1"
              />

              <label
                htmlFor={`avail-${cluster.cluster_key}`}
                className="flex-1 cursor-pointer space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm capitalize text-foreground">
                      {format(dayDate, 'EEEE d MMMM', { locale: nl })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cluster.time_slot}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {cluster.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {cluster.matches.length} wedstrijden
                    </span>
                  </div>
                </div>

                {/* Wedstrijden binnen het cluster */}
                <div className="mt-1 pl-1 border-l-2 border-primary/20 space-y-1">
                  {cluster.matches.map((m) => {
                    const t = new Date(m.match_date);
                    const time = `${String(t.getUTCHours()).padStart(2, '0')}:${String(
                      t.getUTCMinutes(),
                    ).padStart(2, '0')}`;
                    return (
                      <div
                        key={m.match_id}
                        className="flex items-center gap-2 text-xs text-muted-foreground pl-2"
                      >
                        <span className="font-mono text-foreground/70">{time}</span>
                        <span className="truncate">
                          {m.home_team_name} <span className="opacity-60">vs</span>{' '}
                          {m.away_team_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
