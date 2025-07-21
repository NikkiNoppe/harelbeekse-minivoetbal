import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, Trophy, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { competitionService, CompetitionConfig, CompetitionFormat } from "../../../../MINIVOETBAL.SERVICES/match/competitionService";
import { teamService } from "../../../../MINIVOETBAL.SERVICES/core/teamService";
import { seasonService } from "../../../../MINIVOETBAL.SERVICES/seasonService";

const CompetitionManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [formats, setFormats] = useState<CompetitionFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [existingCompetition, setExistingCompetition] = useState<any[]>([]);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load teams
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);

      // Load formats
      const seasonData = await seasonService.getSeasonData();
      setFormats(seasonData.competition_formats || []);

      // Set default dates from season data
      if (seasonData.season_start_date && seasonData.season_end_date) {
        setStartDate(seasonData.season_start_date);
        setEndDate(seasonData.season_end_date);
      }

      // Check for existing competition
      const existingMatches = await competitionService.getCompetitionMatches();
      setExistingCompetition(existingMatches);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de data.",
        variant: "destructive"
      });
    }
  };

  const handleCreateCompetition = async () => {
    if (!selectedFormat || selectedTeams.length === 0 || !startDate || !endDate) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul alle verplichte velden in.",
        variant: "destructive"
      });
      return;
    }

    const format = formats.find(f => f.id.toString() === selectedFormat);
    if (!format) {
      toast({
        title: "Ongeldig format",
        description: "Selecteer een geldig competitieformat.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const config: CompetitionConfig = {
        format,
        start_date: startDate,
        end_date: endDate,
        teams: selectedTeams
      };

      const result = await competitionService.generateCompetition(config);
      
      if (result.success) {
        toast({
          title: "Competitie aangemaakt",
          description: result.message,
          variant: "default"
        });
        
        // Reload existing competition
        const existingMatches = await competitionService.getCompetitionMatches();
        setExistingCompetition(existingMatches);
      } else {
        toast({
          title: "Fout bij aanmaken",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating competition:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er is een fout opgetreden bij het aanmaken van de competitie.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!confirm("Weet je zeker dat je de competitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }

    setLoading(true);
    try {
      const result = await competitionService.deleteCompetition();
      
      if (result.success) {
        toast({
          title: "Competitie verwijderd",
          description: result.message,
          variant: "default"
        });
        
        setExistingCompetition([]);
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting competition:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de competitie.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const hasExistingCompetition = existingCompetition.length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Competitie</h2>
            <p className="text-muted-foreground">
              Beheer de competitie - aanmaken, verwijderen en overzicht
            </p>
          </div>
        </div>

      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Competitie Aanmaken</TabsTrigger>
            <TabsTrigger value="manage">Competitie Beheren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nieuwe Competitie Aanmaken</CardTitle>
                <CardDescription>
                  Maak een nieuwe competitie aan met automatische wedstrijdgeneratie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label htmlFor="format">Competitie Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.id} value={format.id.toString()}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFormat && (
                    <p className="text-sm text-muted-foreground">
                      {formats.find(f => f.id.toString() === selectedFormat)?.description}
                    </p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Datum</Label>
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Eind Datum</Label>
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Team Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Selecteer Teams ({selectedTeams.length} geselecteerd)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTeams(teams.map(team => team.team_id))}
                        disabled={selectedTeams.length === teams.length}
                      >
                        Selecteer alle teams
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTeams([])}
                        disabled={selectedTeams.length === 0}
                      >
                        Deselecteer alle teams
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                    {teams.map((team) => (
                      <Button
                        key={team.team_id}
                        variant={selectedTeams.includes(team.team_id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTeamToggle(team.team_id)}
                        className="justify-start"
                      >
                        {team.team_name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Planning Information */}
                {selectedFormat && selectedTeams.length > 0 && startDate && endDate && (
                  <div className="space-y-2">
                    <Label>Competitie Planning</Label>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      {(() => {
                        const format = formats.find(f => f.id.toString() === selectedFormat);
                        if (!format) return null;
                        
                        const regularMatches = selectedTeams.length * (selectedTeams.length - 1) / 2; // 1 ronde per team
                        const playoffMatches = 0; // Playoffs worden later apart gegenereerd
                        const totalMatches = regularMatches;
                        const weeksNeeded = Math.ceil(totalMatches / 7);
                        
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        const totalWeeks = Math.ceil(totalDays / 7);
                        
                        const isFeasible = totalWeeks >= weeksNeeded;
                        
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Teams:</span>
                              <span className="font-medium">{selectedTeams.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reguliere competitie:</span>
                              <span className="font-medium">1 ronde (thuis/uit)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reguliere wedstrijden:</span>
                              <span className="font-medium">{regularMatches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Playoff wedstrijden:</span>
                              <span className="font-medium">Later apart gegenereerd</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Totaal wedstrijden:</span>
                              <span className="font-medium">{totalMatches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weken nodig:</span>
                              <span className="font-medium">{weeksNeeded}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Beschikbare weken:</span>
                              <span className="font-medium">{totalWeeks}</span>
                            </div>
                            <div className={`flex justify-between font-medium ${isFeasible ? 'text-green-600' : 'text-red-600'}`}>
                              <span>Status:</span>
                              <span>{isFeasible ? '✅ Haalbaar' : '❌ Niet haalbaar'}</span>
                            </div>
                            {!isFeasible && (
                              <div className="text-xs text-muted-foreground mt-2">
                                <p>Suggesties:</p>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                  <li>Verminder het aantal teams</li>
                                  <li>Breid de einddatum uit</li>
                                  <li>Speel meer wedstrijden per week</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Create Button */}
                {(() => {
                  const format = formats.find(f => f.id.toString() === selectedFormat);
                  const isPlanningValid = selectedFormat && selectedTeams.length > 0 && startDate && endDate;
                  
                  let isFeasible = true;
                  let disabledReason = "";
                  
                                     if (isPlanningValid && format) {
                                          const regularMatches = selectedTeams.length * (selectedTeams.length - 1) / 2; // 1 ronde per team
                     const playoffMatches = 0; // Playoffs worden later apart gegenereerd
                     const totalMatches = regularMatches;
                    const weeksNeeded = Math.ceil(totalMatches / 7);
                    
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const totalWeeks = Math.ceil(totalDays / 7);
                    
                    isFeasible = totalWeeks >= weeksNeeded;
                    if (!isFeasible) {
                      disabledReason = `Niet genoeg tijd: ${weeksNeeded} weken nodig, ${totalWeeks} beschikbaar`;
                    }
                  }
                  
                  return (
                    <Button 
                      onClick={handleCreateCompetition} 
                      disabled={loading || !isPlanningValid || !isFeasible}
                      className="w-full"
                      title={disabledReason}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Competitie aanmaken...
                        </>
                      ) : (
                        <>
                          <Trophy className="mr-2 h-4 w-4" />
                          Competitie Aanmaken
                        </>
                      )}
                    </Button>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitie Beheren</CardTitle>
                <CardDescription>
                  Bekijk en beheer de huidige competitie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasExistingCompetition ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Er is een competitie actief met {existingCompetition.length} wedstrijden.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Competitie Statistieken:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Totaal wedstrijden: {existingCompetition.length}</li>
                        <li>• Reguliere wedstrijden: {existingCompetition.filter(m => !m.is_playoff_match).length}</li>
                        <li>• Playoff wedstrijden: {existingCompetition.filter(m => m.is_playoff_match).length}</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleDeleteCompetition}
                      disabled={loading}
                      variant="destructive"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verwijderen...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Competitie Verwijderen
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Er is momenteel geen competitie actief. Maak een nieuwe competitie aan om te beginnen.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default CompetitionManagementTab;
