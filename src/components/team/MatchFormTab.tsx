
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUpcomingMatches } from "./match-form/matchFormService";
import { MatchFormData } from "./match-form/types";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";
import CompactMatchForm from "./match-form/CompactMatchForm";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [matchdayFilter, setMatchdayFilter] = useState("");
  
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
    setSelectedMatchForm(match);
  };

  // If a match form is selected, render the form
  if (selectedMatchForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Wedstrijdformulier</h2>
          <button 
            onClick={() => setSelectedMatchForm(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Terug naar overzicht
          </button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <CompactMatchForm
              match={selectedMatchForm}
              onComplete={() => {
                setSelectedMatchForm(null);
                refetch();
              }}
              isAdmin={isAdmin}
              isReferee={isReferee}
              teamId={teamId}
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
          matchdayFilter={matchdayFilter}
          onMatchdayChange={setMatchdayFilter}
        />
        
        <MatchFormList 
          matches={matches || []}
          isLoading={loadingMatches}
          onSelectMatch={handleSelectMatch}
          searchTerm={searchTerm}
          dateFilter={dateFilter}
          matchdayFilter={matchdayFilter}
          hasElevatedPermissions={hasElevatedPermissions}
          userRole={user?.role}
          teamId={teamId}
        />
      </div>
    </div>
  );
};

export default MatchFormTab;
