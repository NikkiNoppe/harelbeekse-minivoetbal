import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUpcomingMatches } from "./match-form/matchFormService";
import { MatchFormData } from "./match-form/types";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";
import MatchFormDialog from "./match-form/MatchFormDialog";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [matchdayFilter, setMatchdayFilter] = useState("");

  const hasElevatedPermissions = user?.role === "admin" || user?.role === "referee";
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";

  const { data: matches, isLoading: loadingMatches, refetch } = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions],
    queryFn: () => fetchUpcomingMatches(hasElevatedPermissions ? 0 : teamId, hasElevatedPermissions),
  });

  useEffect(() => {
    console.debug("[MatchFormTab] Loaded user:", user);
    console.debug("[MatchFormTab] teamId:", teamId, "hasElevatedPermissions:", hasElevatedPermissions);
    if (matches)
      console.debug("[MatchFormTab] Matches received:", matches.length);
  }, [user, teamId, hasElevatedPermissions, matches]);

  const handleSelectMatch = (match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    // Refresh data when dialog closes to show any updates
    refetch();
  };

  const handleFormComplete = () => {
    refetch();
    handleDialogClose();
  };

  if (!user?.teamId && !hasElevatedPermissions) {
    return (
      <div className="bg-white rounded-xl px-6 py-12 shadow text-center">
        <p className="text-muted-foreground">
          Je account is momenteel niet gekoppeld aan een team, waardoor je geen wedstrijdformulieren kunt bekijken.
        </p>
      </div>
    );
  }

  if (!loadingMatches && matches && matches.length === 0) {
    return (
      <div className="bg-white rounded-xl px-6 py-12 shadow text-center">
        <p className="text-muted-foreground">
          Geen (toekomstige) wedstrijden gevonden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-0.5">
          <h2 className="text-xl font-semibold text-purple-dark tracking-tight">
            Wedstrijdformulieren
            {hasElevatedPermissions && (
              <span className="text-xs text-muted-foreground ml-2 font-normal">
                {isAdmin ? "(Admin - Alle wedstrijden)" : "(Scheidsrechter - Alle wedstrijden)"}
              </span>
            )}
          </h2>
        </div>
      </div>
      <div>
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
      
      {selectedMatchForm && (
        <MatchFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              // Refresh data when dialog is closed (by any means)
              refetch();
            }
          }}
          match={selectedMatchForm}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={teamId}
          onComplete={handleFormComplete}
        />
      )}
    </div>
  );
};

export default MatchFormTab;
