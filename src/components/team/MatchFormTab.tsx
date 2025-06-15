import React, { useState, useEffect } from "react";
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
  };

  if (selectedMatchForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-purple-dark tracking-tight">
            Wedstrijdformulier
          </h2>
          <button 
            onClick={() => setSelectedMatchForm(null)}
            className="text-primary underline underline-offset-4 hover:text-primary-dark text-sm transition"
          >
            ← Terug naar overzicht
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow mb-4">
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
        </div>
      </div>
    );
  }

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
    </div>
  );
};

export default MatchFormTab;
