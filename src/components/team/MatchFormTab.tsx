import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
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

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Wedstrijdformulieren
        </h2>
      </div>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  {hasElevatedPermissions 
                    ? isAdmin 
                      ? "Wedstrijdformulieren (Admin)"
                      : "Wedstrijdformulieren (Scheidsrechter)"
                    : `Wedstrijdformulieren voor ${teamName}`
                  }
                </CardTitle>
                <CardDescription>
                  {!user?.teamId && !hasElevatedPermissions 
                    ? "Je account is momenteel niet gekoppeld aan een team."
                    : !loadingMatches && matches && matches.length === 0
                    ? "Geen (toekomstige) wedstrijden gevonden."
                    : ""
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!user?.teamId && !hasElevatedPermissions) || (!loadingMatches && matches && matches.length === 0) ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  {!user?.teamId && !hasElevatedPermissions 
                    ? "Je account is momenteel niet gekoppeld aan een team, waardoor je geen wedstrijdformulieren kunt bekijken."
                    : "Geen (toekomstige) wedstrijden gevonden."
                  }
                </p>
              </div>
            ) : (
              <div>
                <div className="p-4 border-b">
                  <MatchFormFilter 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    dateFilter={dateFilter}
                    onDateChange={setDateFilter}
                    matchdayFilter={matchdayFilter}
                    onMatchdayChange={setMatchdayFilter}
                  />
                </div>
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
            )}
          </CardContent>
        </Card>
      </section>
      
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
