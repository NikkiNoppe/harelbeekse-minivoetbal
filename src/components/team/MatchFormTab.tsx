import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Trophy, Calendar } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("league");

  const hasElevatedPermissions = user?.role === "admin" || user?.role === "referee";
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";

  const { data: leagueMatches, isLoading: loadingLeagueMatches, refetch: refetchLeague } = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'league'],
    queryFn: () => fetchUpcomingMatches(hasElevatedPermissions ? 0 : teamId, hasElevatedPermissions, 'league'),
  });

  const { data: cupMatches, isLoading: loadingCupMatches, refetch: refetchCup } = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'cup'],
    queryFn: () => fetchUpcomingMatches(hasElevatedPermissions ? 0 : teamId, hasElevatedPermissions, 'cup'),
  });

  useEffect(() => {

  }, [user, teamId, hasElevatedPermissions, leagueMatches, cupMatches]);

  const handleSelectMatch = (match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    // Refresh data when dialog closes to show any updates
    refetchLeague();
    refetchCup();
  };

  const handleFormComplete = () => {
    refetchLeague();
    refetchCup();
    handleDialogClose();
  };

  // Helper function to get current tab data
  const getCurrentTabData = () => {
    if (activeTab === 'cup') {
      return {
        matches: cupMatches || [],
        isLoading: loadingCupMatches
      };
    }
    return {
      matches: leagueMatches || [],
      isLoading: loadingLeagueMatches
    };
  };

  const renderTabContent = (tabType: 'league' | 'cup') => {
    const currentData = tabType === 'cup' 
      ? { matches: cupMatches || [], isLoading: loadingCupMatches }
      : { matches: leagueMatches || [], isLoading: loadingLeagueMatches };

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {tabType === 'cup' ? <Trophy className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                {hasElevatedPermissions 
                  ? isAdmin 
                    ? `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden`
                    : `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden (Scheidsrechter)`
                  : `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden voor ${teamName}`
                }
              </CardTitle>
              <CardDescription>
                {!user?.teamId && !hasElevatedPermissions 
                  ? "Je account is momenteel niet gekoppeld aan een team."
                  : !currentData.isLoading && currentData.matches.length === 0
                  ? `Geen ${tabType === 'cup' ? 'beker' : 'competitie'}wedstrijden gevonden.`
                  : ""
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(!user?.teamId && !hasElevatedPermissions) || (!currentData.isLoading && currentData.matches.length === 0) ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {!user?.teamId && !hasElevatedPermissions 
                  ? "Je account is momenteel niet gekoppeld aan een team, waardoor je geen wedstrijdformulieren kunt bekijken."
                  : `Geen ${tabType === 'cup' ? 'beker' : 'competitie'}wedstrijden gevonden.`
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
                matches={currentData.matches}
                isLoading={currentData.isLoading}
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
    );
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="league" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Competitie
            </TabsTrigger>
            <TabsTrigger value="cup" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Beker
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="league" className="mt-6">
            {renderTabContent('league')}
          </TabsContent>
          
          <TabsContent value="cup" className="mt-6">
            {renderTabContent('cup')}
          </TabsContent>
        </Tabs>
      </section>
      
      {selectedMatchForm && (
        <MatchFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              // Refresh data when dialog is closed (by any means)
              refetchLeague();
              refetchCup();
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
