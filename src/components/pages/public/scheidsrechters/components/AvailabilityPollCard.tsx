import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, MapPin, Clock, Users, AlertCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PollMatchDate } from '@/services/scheidsrechter/types';
import type { PollGroupMatch } from '../hooks/useRefereeDashboard';

interface AvailabilityPollCardProps {
  matchDates: PollMatchDate[];
  matchesByGroup?: Map<string, PollGroupMatch[]>;
  myAvailability: Map<string, boolean>;
  onSubmit: (pollGroupId: string, isAvailable: boolean) => Promise<void>;
  isLoading?: boolean;
  isPollOpen?: boolean;
}

export function AvailabilityPollCard({ 
  matchDates, 
  matchesByGroup,
  myAvailability, 
  onSubmit,
  isLoading = false,
  isPollOpen = true
}: AvailabilityPollCardProps) {
  // Local state for optimistic UI
  const [localAvailability, setLocalAvailability] = useState<Map<string, boolean>>(myAvailability);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Sync with prop changes
  useEffect(() => {
    setLocalAvailability(myAvailability);
  }, [myAvailability]);
  
  const handleCheckChange = async (pollGroupId: string, checked: boolean) => {
    if (!isPollOpen) return;
    
    setError(null);
    
    // Optimistic update
    setLocalAvailability(prev => new Map(prev).set(pollGroupId, checked));
    setPendingUpdates(prev => new Set(prev).add(pollGroupId));
    
    try {
      await onSubmit(pollGroupId, checked);
    } catch (err) {
      // Revert on error
      setLocalAvailability(prev => {
        const next = new Map(prev);
        next.delete(pollGroupId);
        return next;
      });
      setError('Kon beschikbaarheid niet opslaan');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(pollGroupId);
        return next;
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-elevation-1)]">
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (matchDates.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-elevation-1)]">
        <CardContent className="p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Geen wedstrijddata beschikbaar</p>
        </CardContent>
      </Card>
    );
  }
  
  const availableCount = Array.from(localAvailability.values()).filter(Boolean).length;
  
  return (
    <Card className="shadow-[var(--shadow-elevation-1)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Beschikbaarheid</CardTitle>
          <Badge variant="outline" className="text-xs">
            {availableCount} / {matchDates.length} beschikbaar
          </Badge>
        </div>
        <CardDescription>
          Geef aan wanneer je beschikbaar bent om te fluiten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isPollOpen && (
          <Alert className="alert-warning-readable mb-4">
            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
            <AlertDescription>
              Deze poll is gesloten. Je kunt je beschikbaarheid niet meer wijzigen.
            </AlertDescription>
          </Alert>
        )}
        
        {matchDates.map(date => {
          const pollGroupId = `${date.poll_id}_${date.id}`;
          const isAvailable = localAvailability.get(pollGroupId) ?? false;
          const isPending = pendingUpdates.has(pollGroupId);
          const matchDate = new Date(date.match_date);
          
          return (
            <div
              key={date.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                isAvailable 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'bg-card border-border hover:border-primary/20',
                isPending && 'opacity-70',
                !isPollOpen && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Checkbox
                id={`avail-${date.id}`}
                checked={isAvailable}
                onCheckedChange={(checked) => handleCheckChange(pollGroupId, checked === true)}
                disabled={!isPollOpen || isPending}
                aria-label={`Beschikbaar op ${format(matchDate, 'd MMMM', { locale: nl })}`}
                className="mt-1"
              />
              
              <label 
                htmlFor={`avail-${date.id}`}
                className={cn(
                  'flex-1 cursor-pointer space-y-2',
                  !isPollOpen && 'cursor-not-allowed'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm capitalize">
                      {format(matchDate, 'EEEE d MMMM', { locale: nl })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {date.time_slot && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {date.time_slot}
                      </span>
                    )}
                    
                    {date.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {date.location}
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {date.match_count} wedstrijden
                    </span>
                  </div>
                </div>

                {/* Match details (teams + exact times) */}
                {(() => {
                  const groupMatches = matchesByGroup
                    ? Array.from(matchesByGroup.values())
                        .flat()
                        .filter((m) => {
                          const md = new Date(m.match_date);
                          const sameDay =
                            md.getUTCFullYear() === matchDate.getUTCFullYear() &&
                            md.getUTCMonth() === matchDate.getUTCMonth() &&
                            md.getUTCDate() === matchDate.getUTCDate();
                          const sameLoc = !date.location || (m.location || '') === date.location;
                          return sameDay && sameLoc;
                        })
                    : [];
                  if (groupMatches.length === 0) return null;
                  return (
                    <div className="mt-1 pl-1 border-l-2 border-primary/20 space-y-1">
                      {groupMatches.map((m) => {
                        const t = new Date(m.match_date);
                        const time = `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
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
                  );
                })()}
              </label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
