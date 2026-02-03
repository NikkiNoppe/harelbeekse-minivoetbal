import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Check, X, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { RefereeAssignment, AssignmentStatus } from '@/services/scheidsrechter/types';

interface AssignedMatchCardProps {
  assignment: RefereeAssignment;
  onConfirm?: (assignmentId: number) => Promise<void>;
  onDecline?: (assignmentId: number) => Promise<void>;
  isLoading?: boolean;
}

function getStatusConfig(status: AssignmentStatus): { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} {
  switch (status) {
    case 'confirmed':
      return { 
        label: 'Bevestigd', 
        variant: 'default',
        className: 'bg-success text-success-foreground'
      };
    case 'pending':
      return { 
        label: 'Wachtend', 
        variant: 'outline',
        className: 'border-warning text-warning'
      };
    case 'declined':
      return { 
        label: 'Geweigerd', 
        variant: 'destructive',
        className: ''
      };
    case 'cancelled':
      return { 
        label: 'Geannuleerd', 
        variant: 'secondary',
        className: ''
      };
    default:
      return { 
        label: status, 
        variant: 'outline',
        className: ''
      };
  }
}

export function AssignedMatchCard({ 
  assignment, 
  onConfirm, 
  onDecline,
  isLoading = false 
}: AssignedMatchCardProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  
  const matchDate = assignment.match_date ? new Date(assignment.match_date) : null;
  const statusConfig = getStatusConfig(assignment.status);
  const isPending = assignment.status === 'pending';
  const isUpcoming = matchDate && matchDate.getTime() > Date.now();
  
  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm(assignment.id);
    } finally {
      setIsConfirming(false);
    }
  };
  
  const handleDecline = async () => {
    if (!onDecline) return;
    setIsDeclining(true);
    try {
      await onDecline(assignment.id);
    } finally {
      setIsDeclining(false);
    }
  };
  
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
        isPending && 'border-primary bg-primary/5',
        assignment.status === 'confirmed' && 'border-success/30',
      )}
    >
      {/* Status bar */}
      {isPending && (
        <div className="bg-primary px-4 py-1.5 text-primary-foreground text-xs font-medium">
          Actie vereist - bevestig je toewijzing
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Date & Time - prominent */}
          <div className="flex items-center justify-between">
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
            
            <Badge 
              variant={statusConfig.variant}
              className={statusConfig.className}
            >
              {statusConfig.label}
            </Badge>
          </div>
          
          {/* Match details */}
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {assignment.home_team_name} vs {assignment.away_team_name}
            </span>
          </div>
          
          {/* Location */}
          {assignment.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{assignment.location}</span>
            </div>
          )}
          
          {/* Action buttons for pending assignments */}
          {isPending && isUpcoming && onConfirm && onDecline && (
            <div className="flex gap-2 pt-2 border-t mt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleConfirm}
                disabled={isConfirming || isDeclining}
              >
                <Check className="h-4 w-4 mr-1" />
                {isConfirming ? 'Bevestigen...' : 'Bevestigen'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDecline}
                disabled={isConfirming || isDeclining}
              >
                <X className="h-4 w-4 mr-1" />
                {isDeclining ? 'Weigeren...' : 'Weigeren'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton variant
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
