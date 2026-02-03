import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Calendar, AlertCircle } from 'lucide-react';
import { AssignedMatchCard, AssignedMatchCardSkeleton } from '../components/AssignedMatchCard';
import type { RefereeAssignment } from '@/services/scheidsrechter/types';

interface AssignedMatchesSectionProps {
  assignments: RefereeAssignment[];
  onConfirmAssignment: (assignmentId: number) => Promise<void>;
  onDeclineAssignment: (assignmentId: number, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function AssignedMatchesSection({
  assignments,
  onConfirmAssignment,
  onDeclineAssignment,
  isLoading
}: AssignedMatchesSectionProps) {
  // Separate upcoming and past assignments
  const now = Date.now();
  const upcomingAssignments = assignments.filter(a => {
    const matchDate = a.match_date ? new Date(a.match_date).getTime() : 0;
    return matchDate > now;
  });
  
  const pendingCount = upcomingAssignments.filter(a => a.status === 'pending').length;
  
  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Mijn Wedstrijden
        </h2>
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <AssignedMatchCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }
  
  // No assignments
  if (assignments.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Mijn Wedstrijden
        </h2>
        
        <Card className="shadow-[var(--shadow-elevation-1)] border-dashed">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-base">Nog geen wedstrijden toegewezen</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vul je beschikbaarheid in zodat de coördinator je kan toewijzen
                  <br />
                  aan wedstrijden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="space-y-4">
      {/* Header with pending count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Mijn Wedstrijden
          <span className="text-sm font-normal text-muted-foreground">
            ({upcomingAssignments.length} komend)
          </span>
        </h2>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-warning">
            <AlertCircle className="h-4 w-4" />
            <span>{pendingCount} wachtend</span>
          </div>
        )}
      </div>
      
      {/* Assignment cards */}
      <div className="grid gap-3">
        {upcomingAssignments.map(assignment => (
          <AssignedMatchCard
            key={assignment.id}
            assignment={assignment}
            onConfirm={onConfirmAssignment}
            onDecline={onDeclineAssignment}
          />
        ))}
      </div>
      
      {/* Show note if there are past assignments */}
      {assignments.length > upcomingAssignments.length && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {assignments.length - upcomingAssignments.length} afgelopen wedstrijden niet getoond
        </p>
      )}
    </section>
  );
}
