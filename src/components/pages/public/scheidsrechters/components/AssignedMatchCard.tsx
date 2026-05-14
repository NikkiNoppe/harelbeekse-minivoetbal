import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { RefereeAssignment } from '@/services/scheidsrechter/types';

interface AssignedMatchCardProps {
  assignment: RefereeAssignment;
  isLoading?: boolean;
}

export function AssignedMatchCard({ assignment, isLoading = false }: AssignedMatchCardProps) {
  const matchDate = assignment.match_date ? new Date(assignment.match_date) : null;
  const isUpcoming = matchDate && matchDate.getTime() > Date.now();

  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-elevation-1)]">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'shadow-[var(--shadow-elevation-1)] overflow-hidden',
        isUpcoming && 'border-primary/30',
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {matchDate ? (
              <div>
                <span className="font-semibold text-base">
                  {format(matchDate, 'EEEE d MMMM', { locale: nl })}
                </span>
                <span className="text-muted-foreground ml-2">
                  {format(matchDate, 'HH:mm')}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Datum onbekend</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {assignment.home_team_name} vs {assignment.away_team_name}
            </span>
          </div>

          {assignment.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{assignment.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignedMatchCardSkeleton() {
  return (
    <Card className="shadow-[var(--shadow-elevation-1)]">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
