import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import BekerDateSelector from "./BekerDateSelector";
import { teamService, Team } from "@/services/core";

const BekerPage: React.FC = () => {
  const { toast } = useToast();
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [tournamentDates, setTournamentDates] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize teams data to prevent unnecessary re-renders
  const memoizedTeams = useMemo(() => teams, [teams]);

  // Load teams from database on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const teamsData = await teamService.getAllTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading teams:', error);
        toast({
          title: "Fout",
          description: "Kan teams niet laden uit de database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [toast]);

  // Memoize team selection handler
  const handleTeamSelection = useCallback((teamId: number) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  }, []);

  // Memoize date selection handler
  const handleDatesSelected = useCallback((dates: string[]) => {
    setTournamentDates(dates);
    setShowDateSelector(false);
    toast({
      title: "Data geselecteerd",
      description: `${dates.length} speeldata zijn geselecteerd voor de beker`,
    });
  }, [toast]);

  // Memoize cancel handler
  const handleCancelDateSelection = useCallback(() => {
    setShowDateSelector(false);
  }, []);

  // Memoize tournament creation handler
  const handleCreateTournament = useCallback(async () => {
    if (selectedTeams.length < 8) {
      toast({
        title: "Onvoldoende teams",
        description: "Selecteer minimaal 8 teams voor de beker",
        variant: "destructive",
      });
      return;
    }

    if (tournamentDates.length < 5) {
      toast({
        title: "Onvoldoende data",
        description: "Selecteer minimaal 5 speeldata voor de beker",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Simulate API call to create tournament
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Beker aangemaakt",
        description: `Beker met ${selectedTeams.length} teams en ${tournamentDates.length} speeldata is succesvol aangemaakt`,
      });

      // Reset form
      setSelectedTeams([]);
      setTournamentDates([]);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Fout",
        description: "Kan beker niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [selectedTeams.length, tournamentDates.length, toast]);

  // Memoize validation states
  const canCreateTournament = useMemo(() => 
    selectedTeams.length >= 8 && tournamentDates.length >= 5,
    [selectedTeams.length, tournamentDates.length]
  );

  const canSelectDates = useMemo(() => 
    selectedTeams.length >= 8,
    [selectedTeams.length]
  );

  // Memoize teams by division (using team_name for now since division might not be available)
  const teamsByDivision = useMemo(() => {
    // Group teams by first letter of team name as a simple division
    const grouped = memoizedTeams.reduce((acc, team) => {
      const division = `Divisie ${team.team_name.charAt(0).toUpperCase()}`;
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(team);
      return acc;
    }, {} as Record<string, Team[]>);
    
    return Object.entries(grouped);
  }, [memoizedTeams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">Teams laden uit database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-purple-light">
          🏆 Beker Tournament Manager
        </h1>
        <Button
          onClick={() => setShowDateSelector(true)}
          disabled={!canSelectDates}
          className="btn btn--primary"
        >
          Speeldata Selecteren
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Teams Selecteren</span>
              <Badge variant="secondary">
                {selectedTeams.length} / {teams.length} geselecteerd
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamsByDivision.map(([division, divisionTeams]) => (
                <div key={division} className="space-y-2">
                  <h3 className="font-semibold text-purple-light">{division}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {divisionTeams.map((team) => (
                      <div key={team.team_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`team-${team.team_id}`}
                          checked={selectedTeams.includes(team.team_id)}
                          onCheckedChange={() => handleTeamSelection(team.team_id)}
                        />
                        <label
                          htmlFor={`team-${team.team_id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {team.team_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle>Beker Informatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Geselecteerde Teams</h3>
                {selectedTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen teams geselecteerd</p>
                ) : (
                  <div className="space-y-1">
                    {selectedTeams.map(teamId => {
                      const team = teams.find(t => t.team_id === teamId);
                      return (
                        <div key={teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{team?.team_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {team?.team_name.charAt(0).toUpperCase()}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Speeldata</h3>
                {tournamentDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen speeldata geselecteerd</p>
                ) : (
                  <div className="space-y-1">
                    {tournamentDates.map((date, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Speelweek {index + 1}</span>
                        <span className="text-sm font-medium">
                          {new Date(date).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full btn btn--primary"
                    disabled={!canCreateTournament || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Beker aanmaken...
                      </>
                    ) : (
                      "Beker Tournament Aanmaken"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Beker Tournament Aanmaken</AlertDialogTitle>
                    <AlertDialogDescription>
                      Weet je zeker dat je de beker wilt aanmaken met {selectedTeams.length} teams en {tournamentDates.length} speeldata?
                      Deze actie kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateTournament}>
                      Beker Aanmaken
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Selector Modal */}
      {showDateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <BekerDateSelector 
              onDatesSelected={handleDatesSelected}
              onCancel={handleCancelDateSelection}
              isLoading={isCreating}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BekerPage); 