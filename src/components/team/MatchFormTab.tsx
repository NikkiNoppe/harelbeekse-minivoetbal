import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import PlayerSelectionForm from "./PlayerSelectionForm";
import MatchFormHeader from "./match-form/MatchFormHeader";
import { fetchUpcomingMatches } from "./match-form/matchFormService";
import { MatchFormData } from "./match-form/types";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";
import ScoreEntryForm from "./match-form/ScoreEntryForm";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  // Check if user has elevated permissions (admin or referee)
  const hasElevatedPermissions = user?.role === "admin" || user?.role === "referee";
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  
  // Fetch matches based on user permissions
  const { data: matches, isLoading: loadingMatches, refetch } = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions],
    queryFn: () => fetchUpcomingMatches(hasElevatedPermissions ? 0 : teamId, hasElevatedPermissions)
  });

  // Handle the selection of a match for the form
  const handleSelectMatch = (match: MatchFormData) => {
    // Check permissions for editing
    const canEdit = canEditMatch(match);
    if (!canEdit) {
      toast({
        title: "Geen toegang",
        description: "Je hebt geen rechten om deze wedstrijd te bewerken.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMatchForm(match);
  };

  // Check if user can edit a specific match
  const canEditMatch = (match: MatchFormData): boolean => {
    // Admin can always edit
    if (isAdmin) return true;
    
    // Locked matches can't be edited by anyone except admin
    if (match.isLocked && !isAdmin) return false;
    
    // Referee can edit scores and notes for completed/ready matches
    if (isReferee) {
      return match.playersSubmitted || match.isCompleted;
    }
    
    // Team manager can only edit future matches for their team and only if not completed
    const isTeamMatch = match.homeTeamId === teamId || match.awayTeamId === teamId;
    const isFutureMatch = new Date(match.date) > new Date();
    
    return isTeamMatch && isFutureMatch && !match.isCompleted;
  };

  // If a match form is selected, render the appropriate form
  if (selectedMatchForm) {
    // If it's a referee/admin editing scores
    if ((isReferee || isAdmin) && (selectedMatchForm.playersSubmitted || selectedMatchForm.isCompleted)) {
      return (
        <div className="space-y-4">
          <MatchFormHeader 
            selectedMatch={selectedMatchForm}
            onBackToOverview={() => setSelectedMatchForm(null)}
            hasElevatedPermissions={hasElevatedPermissions}
          />
          
          <Card>
            <CardContent className="pt-6">
              <ScoreEntryForm
                match={selectedMatchForm}
                onComplete={() => {
                  setSelectedMatchForm(null);
                  refetch();
                }}
                isAdmin={isAdmin}
                isReferee={isReferee}
              />
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Regular player selection form for team managers
    return (
      <div className="space-y-4">
        <MatchFormHeader 
          selectedMatch={selectedMatchForm}
          onBackToOverview={() => setSelectedMatchForm(null)}
          hasElevatedPermissions={hasElevatedPermissions}
        />
        
        <Card>
          <CardContent className="pt-6">
            <PlayerSelectionForm
              matchId={selectedMatchForm.matchId}
              teamId={teamId}
              teamName={teamName}
              isHomeTeam={selectedMatchForm.isHomeTeam}
              onComplete={() => setSelectedMatchForm(null)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-medium mb-4">
          Wedstrijdformulieren
          {hasElevatedPermissions && (
            <span className="text-sm text-muted-foreground ml-2">
              {isAdmin ? "(Admin - Alle wedstrijden)" : "(Scheidsrechter - Alle wedstrijden)"}
            </span>
          )}
        </h2>
        
        <MatchFormFilter 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
        />
        
        <MatchFormList 
          matches={matches || []}
          isLoading={loadingMatches}
          onSelectMatch={handleSelectMatch}
          searchTerm={searchTerm}
          dateFilter={dateFilter}
          locationFilter={locationFilter}
          hasElevatedPermissions={hasElevatedPermissions}
          userRole={user?.role}
          teamId={teamId}
        />
      </div>
    </div>
  );
};

export default MatchFormTab;
