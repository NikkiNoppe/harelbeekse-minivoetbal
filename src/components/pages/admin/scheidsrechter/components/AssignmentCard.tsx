import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertTriangle, UserCheck, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { assignmentService } from '@/services/scheidsrechter/assignmentService';
import type { AvailableReferee, RefereeAssignment } from '@/services/scheidsrechter/types';
import { cn } from '@/lib/utils';
import { formatTimeForDisplay } from '@/lib/dateUtils';

interface MatchData {
  match_id: number;
  match_date: string;
  location: string | null;
  home_team_name: string;
  away_team_name: string;
  assigned_referee_id: number | null;
  current_referee_name?: string;
  current_assignment?: RefereeAssignment | null;
}

interface AssignmentCardProps {
  match: MatchData;
  onAssignmentChange: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  match,
  onAssignmentChange
}) => {
  const [availableReferees, setAvailableReferees] = useState<AvailableReferee[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedReferee, setSelectedReferee] = useState<string>('');

  // Fetch available referees when card loads
  useEffect(() => {
    const fetchAvailable = async () => {
      setLoading(true);
      try {
        const referees = await assignmentService.getAvailableRefereesForMatch(match.match_id);
        setAvailableReferees(referees);
      } catch (error) {
        console.error('Error fetching available referees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailable();
  }, [match.match_id]);

  const handleAssign = async () => {
    if (!selectedReferee) return;

    setAssigning(true);
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0');
      const result = await assignmentService.assignReferee(
        { 
          match_id: match.match_id, 
          referee_id: parseInt(selectedReferee) 
        },
        userId
      );

      if (result.success) {
        toast.success('Scheidsrechter toegewezen');
        setSelectedReferee('');
        onAssignmentChange();
      } else {
        toast.error(result.error || 'Fout bij toewijzen');
      }
    } catch (error) {
      console.error('Error assigning referee:', error);
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!match.current_assignment?.id) return;

    setAssigning(true);
    try {
      const success = await assignmentService.removeAssignment(match.current_assignment.id);
      if (success) {
        toast.success('Toewijzing verwijderd');
        onAssignmentChange();
      } else {
        toast.error('Kon toewijzing niet verwijderen');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(false);
    }
  };

  const isAssigned = !!match.assigned_referee_id || !!match.current_referee_name;

  // Filter and sort referees
  const sortedReferees = [...availableReferees].sort((a, b) => {
    // Available first
    if (a.is_available && !b.is_available) return -1;
    if (!a.is_available && b.is_available) return 1;
    // Then by name
    return a.username.localeCompare(b.username);
  });

  return (
    <Card className={cn(
      "transition-all",
      isAssigned && "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-4">
        {/* Match Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTimeForDisplay(match.match_date)}</span>
            </div>
            {isAssigned ? (
              <Badge className="bg-success text-success-foreground">
                <UserCheck className="h-3 w-3 mr-1" />
                Toegewezen
              </Badge>
            ) : (
              <Badge variant="secondary">Open</Badge>
            )}
          </div>

          <h3 className="font-semibold text-base">
            {match.home_team_name} vs {match.away_team_name}
          </h3>

          {match.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {match.location}
            </div>
          )}
        </div>

        {/* Current Assignment */}
        {isAssigned && match.current_referee_name && (
          <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="font-medium">{match.current_referee_name}</span>
              {match.current_assignment?.status && (
                <Badge variant="outline" className="text-xs">
                  {match.current_assignment.status === 'confirmed' && '✅ Bevestigd'}
                  {match.current_assignment.status === 'pending' && '⏳ In afwachting'}
                  {match.current_assignment.status === 'declined' && '❌ Afgewezen'}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveAssignment}
              disabled={assigning}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Assignment Section */}
        {!isAssigned && (
          <div className="space-y-2">
            <Select
              value={selectedReferee}
              onValueChange={setSelectedReferee}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Laden..." : "Selecteer scheidsrechter"} />
              </SelectTrigger>
              <SelectContent>
                {sortedReferees.map(referee => (
                  <SelectItem 
                    key={referee.user_id} 
                    value={referee.user_id.toString()}
                    disabled={referee.has_conflict}
                  >
                    <div className="flex items-center gap-2">
                      <span>{referee.username}</span>
                      {referee.is_available && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                          Beschikbaar
                        </Badge>
                      )}
                      {referee.has_conflict && (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Conflict
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {sortedReferees.length === 0 && !loading && (
                  <SelectItem value="_empty" disabled>
                    Geen scheidsrechters gevonden
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAssign}
              disabled={!selectedReferee || assigning}
              className="w-full"
            >
              {assigning ? 'Toewijzen...' : 'Toewijzen'}
            </Button>
          </div>
        )}

        {/* Available count */}
        {!isAssigned && !loading && availableReferees.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {availableReferees.filter(r => r.is_available).length} van {availableReferees.length} beschikbaar
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
