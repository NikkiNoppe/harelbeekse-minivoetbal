import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Trash2, Plus, Users, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { cupService } from "@/services/cupService";
import { teamService, Team } from "@/services/teamService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CupDateSelector from "./CupDateSelector";

const CupTournamentManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTournament, setHasTournament] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTournamentData();
    loadTeams();
  }, []);

  const loadTournamentData = async () => {
    try {
      const data = await cupService.getCupMatches();
      const hasMatches = data.achtste_finales.length > 0 || 
                        data.kwartfinales.length > 0 || 
                        data.halve_finales.length > 0 || 
                        data.finale;
      setHasTournament(hasMatches);
      setTournamentData(data);
    } catch (error) {
      console.error('Error loading tournament data:', error);
      setHasTournament(false);
      setTournamentData(null);
    }
  };

  const loadTeams = async () => {
    try {
      const allTeams = await teamService.getAllTeams();
      setTeams(allTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Fout",
        description: "Kon teams niet laden",
        variant: "destructive"
      });
    }
  };

  const handleTeamSelectionNext = () => {
    if (selectedTeams.length !== 16) {
      toast({
        title: "Ongeldige selectie",
        description: "Selecteer exact 16 teams voor het toernooi",
        variant: "destructive"
      });
      return;
    }
    setShowDateSelector(true);
  };

  const handleDatesSelected = async (dates: string[]) => {
    setSelectedDates(dates);
    setIsLoading(true);
    try {
      const result = await cupService.createCupTournament(selectedTeams, dates);
      
      if (result.success) {
        toast({
          title: "Succes!",
          description: result.message,
        });
        await loadTournamentData();
        setSelectedTeams([]);
        setSelectedDates([]);
        setShowDateSelector(false);
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Onverwachte fout bij aanmaken toernooi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDateSelection = () => {
    setShowDateSelector(false);
  };

  const handleDeleteTournament = async () => {
    setIsLoading(true);
    try {
      const result = await cupService.deleteCupTournament();
      
      if (result.success) {
        toast({
          title: "Succes!",
          description: result.message,
        });
        await loadTournamentData();
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Onverwachte fout bij verwijderen toernooi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else if (prev.length < 16) {
        return [...prev, teamId];
      } else {
        toast({
          title: "Maximum bereikt",
          description: "Je kunt maximaal 16 teams selecteren",
          variant: "destructive"
        });
        return prev;
      }
    });
  };

  const getTournamentStats = () => {
    if (!tournamentData) return null;

    const totalMatches = tournamentData.achtste_finales.length + 
                        tournamentData.kwartfinales.length + 
                        tournamentData.halve_finales.length + 
                        (tournamentData.finale ? 1 : 0);

    const completedMatches = [
      ...tournamentData.achtste_finales,
      ...tournamentData.kwartfinales,
      ...tournamentData.halve_finales,
      ...(tournamentData.finale ? [tournamentData.finale] : [])
    ].filter(match => match.is_submitted).length;

    return { totalMatches, completedMatches };
  };

  const stats = getTournamentStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Bekertoernooi Beheer
          </h2>
          <p className="text-muted-foreground">
            Beheer het bekertoernooi - aanmaken, verwijderen en overzicht
          </p>
        </div>
      </div>

      {hasTournament ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Actief Toernooi</span>
              </CardTitle>
              {stats && (
                <CardDescription>
                  {stats.completedMatches} van {stats.totalMatches} wedstrijden voltooid
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{tournamentData?.achtste_finales?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Achtste Finales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{tournamentData?.kwartfinales?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Kwartfinales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{tournamentData?.halve_finales?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Halve Finales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{tournamentData?.finale ? 1 : 0}</div>
                  <div className="text-sm text-muted-foreground">Finale</div>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Toernooi Verwijderen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-purple-50 text-foreground border-border rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-purple-800">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Toernooi Verwijderen
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-purple-700">
                      Weet je zeker dat je het volledige bekertoernooi wilt verwijderen? 
                      Alle wedstrijden, scores en voortgang zullen permanent verloren gaan.
                      Deze actie kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white text-purple-700 border-purple-200 hover:bg-purple-100">
                      Annuleren
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteTournament}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Definitief Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
          

        </div>
      ) : (
        <div className="space-y-4">
          {!showDateSelector ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Stap 1: Teams Selecteren
                  </CardTitle>
                  <CardDescription>
                    Selecteer 16 teams voor het bekertoernooi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Geselecteerde teams: {selectedTeams.length}/16
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTeams([])}
                        disabled={selectedTeams.length === 0}
                      >
                        Alles wissen
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                      {teams.map((team) => (
                        <div 
                          key={team.team_id} 
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                        >
                          <Checkbox
                            id={`team-${team.team_id}`}
                            checked={selectedTeams.includes(team.team_id)}
                            onCheckedChange={() => handleTeamToggle(team.team_id)}
                            disabled={!selectedTeams.includes(team.team_id) && selectedTeams.length >= 16}
                          />
                          <label 
                            htmlFor={`team-${team.team_id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {team.team_name}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={handleTeamSelectionNext}
                      disabled={selectedTeams.length !== 16}
                      className="w-full"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Volgende: Speeldata Selecteren
                    </Button>

                    {selectedTeams.length !== 16 && (
                      <p className="text-sm text-muted-foreground text-center">
                        {selectedTeams.length < 16 
                          ? `Selecteer nog ${16 - selectedTeams.length} teams`
                          : "Te veel teams geselecteerd"
                        }
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {teams.length < 16 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      Onvoldoende Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Er zijn momenteel {teams.length} teams geregistreerd. 
                      Voor een volledig bekertoernooi zijn 16 teams nodig. 
                      Voeg eerst meer teams toe via het team beheer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Stap 2: Speeldata en Toernooi Aanmaken
                  </CardTitle>
                  <CardDescription>
                    {selectedTeams.length} teams geselecteerd - Nu speeldata kiezen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelDateSelection}
                    className="mb-4"
                    disabled={isLoading}
                  >
                    ← Terug naar team selectie
                  </Button>
                </CardContent>
              </Card>

              <CupDateSelector 
                onDatesSelected={handleDatesSelected}
                onCancel={handleCancelDateSelection}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CupTournamentManager; 