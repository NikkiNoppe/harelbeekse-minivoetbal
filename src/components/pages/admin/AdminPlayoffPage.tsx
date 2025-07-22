import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, AlertCircle, CheckCircle, Trash2, Users, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionService, CompetitionMatch } from "@/services/match/competitionService";
import { teamService } from "@/services/core/teamService";
import { seasonService } from "@/services/seasonService";
import { supabase } from "@/integrations/supabase/client";

interface TeamStanding {
  team_id: number;
  team_name: string;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

const AdminPlayoffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("standings");
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<CompetitionMatch[]>([]);
  const [selectedTopTeams, setSelectedTopTeams] = useState<number[]>([]);
  const [selectedBottomTeams, setSelectedBottomTeams] = useState<number[]>([]);
  const [playoffConfig, setPlayoffConfig] = useState({
    topTeams: 8,
    bottomTeams: 8,
    rounds: 2
  });
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load teams
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);

      // Load competition matches and calculate standings
      const matches = await competitionService.getCompetitionMatches();
      const regularMatches = matches.filter(match => !match.is_playoff_match);
      const playoffMatches = matches.filter(match => match.is_playoff_match);
      
      setPlayoffMatches(playoffMatches);
      
      // Calculate standings
      const calculatedStandings = calculateStandings(teamsData, regularMatches);
      setStandings(calculatedStandings);
      
      // Auto-select top and bottom teams
      const topTeams = calculatedStandings.slice(0, playoffConfig.topTeams).map(t => t.team_id);
      const bottomTeams = calculatedStandings.slice(-playoffConfig.bottomTeams).map(t => t.team_id);
      setSelectedTopTeams(topTeams);
      setSelectedBottomTeams(bottomTeams);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStandings = (teams: any[], matches: CompetitionMatch[]): TeamStanding[] => {
    const standings: { [key: number]: TeamStanding } = {};
    
    // Initialize standings for all teams
    teams.forEach(team => {
      standings[team.team_id] = {
        team_id: team.team_id,
        team_name: team.team_name,
        points: 0,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0
      };
    });

    // Calculate standings from matches
    matches.forEach(match => {
      if (match.home_score !== null && match.away_score !== null && match.home_team_id && match.away_team_id) {
        const homeTeam = standings[match.home_team_id];
        const awayTeam = standings[match.away_team_id];
        
        if (homeTeam && awayTeam) {
          homeTeam.matches_played++;
          awayTeam.matches_played++;
          homeTeam.goals_for += match.home_score;
          homeTeam.goals_against += match.away_score;
          awayTeam.goals_for += match.away_score;
          awayTeam.goals_against += match.home_score;
          
          if (match.home_score > match.away_score) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
          } else if (match.home_score < match.away_score) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
          } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
          }
        }
      }
    });

    // Calculate goal differences
    Object.values(standings).forEach(team => {
      team.goal_difference = team.goals_for - team.goals_against;
    });

    // Sort by points, then goal difference, then goals for
    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
  };

  const handleGeneratePlayoffs = async () => {
    if (selectedTopTeams.length === 0 && selectedBottomTeams.length === 0) {
      toast({
        title: "Geen teams geselecteerd",
        description: "Selecteer minimaal één team voor de playoffs.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const allPlayoffTeams = [...selectedTopTeams, ...selectedBottomTeams];
      
      // Get season data for venues and timeslots
      const seasonData = await seasonService.getSeasonData();
      const venues = seasonData.venues || [];
      const timeslots = seasonData.venue_timeslots || [];
      
      if (venues.length === 0 || timeslots.length === 0) {
        toast({
          title: "Onvoldoende data",
          description: "Configureer eerst venues en tijdslots in de seizoensinstellingen.",
          variant: "destructive"
        });
        return;
      }

      // Generate playoff matches
      const playoffMatches = await competitionService.generatePlayoffMatches(
        allPlayoffTeams,
        allPlayoffTeams.length,
        [], // We'll generate weeks dynamically
        0
      );

      if (playoffMatches && playoffMatches.length > 0) {
        toast({
          title: "Playoffs gegenereerd",
          description: "De playoff wedstrijden zijn succesvol aangemaakt.",
          variant: "default"
        });
        
        // Reload playoff matches
        const matches = await competitionService.getCompetitionMatches();
        const newPlayoffMatches = matches.filter(match => match.is_playoff_match);
        setPlayoffMatches(newPlayoffMatches);
      } else {
        toast({
          title: "Fout bij genereren",
          description: "Er zijn geen playoff wedstrijden gegenereerd.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating playoffs:', error);
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de playoffs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayoffs = async () => {
    if (!confirm("Weet je zeker dat je alle playoff wedstrijden wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }

    setLoading(true);
    try {
      const result = await competitionService.deletePlayoffMatches();
      
      if (result.success) {
        toast({
          title: "Playoffs verwijderd",
          description: result.message,
          variant: "default"
        });
        
        setPlayoffMatches([]);
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting playoffs:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de playoffs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: number, isTopTeam: boolean) => {
    if (isTopTeam) {
      setSelectedTopTeams(prev => 
        prev.includes(teamId) 
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    } else {
      setSelectedBottomTeams(prev => 
        prev.includes(teamId) 
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    }
  };

  const hasPlayoffMatches = playoffMatches.length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Play-Off</h2>
          <p className="text-muted-foreground">
            Beheer de playoffs - genereren, verwijderen en overzicht
          </p>
        </div>
      </div>

      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">Competitie Stand</TabsTrigger>
            <TabsTrigger value="playoffs">Playoff Wedstrijden</TabsTrigger>
            <TabsTrigger value="generate">Playoff Genereren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standings" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitie Stand</CardTitle>
                <CardDescription>
                  Bekijk de huidige stand van de competitie om teams voor playoffs te selecteren
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">Gespeeld</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">V</TableHead>
                        <TableHead className="text-center">DV</TableHead>
                        <TableHead className="text-center">DT</TableHead>
                        <TableHead className="text-center">DS</TableHead>
                        <TableHead className="text-center">Punten</TableHead>
                        <TableHead className="text-center">Selectie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((team, index) => {
                        const isTopTeam = selectedTopTeams.includes(team.team_id);
                        const isBottomTeam = selectedBottomTeams.includes(team.team_id);
                        const isSelected = isTopTeam || isBottomTeam;
                        
                        return (
                          <TableRow key={team.team_id} className={isSelected ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium text-responsive-team">{team.team_name}</TableCell>
                            <TableCell className="text-center">{team.matches_played}</TableCell>
                            <TableCell className="text-center">{team.wins}</TableCell>
                            <TableCell className="text-center">{team.draws}</TableCell>
                            <TableCell className="text-center">{team.losses}</TableCell>
                            <TableCell className="text-center">{team.goals_for}</TableCell>
                            <TableCell className="text-center">{team.goals_against}</TableCell>
                            <TableCell className="text-center">{team.goal_difference}</TableCell>
                            <TableCell className="text-center font-semibold">{team.points}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant={isTopTeam ? "default" : "outline"}
                                  onClick={() => handleTeamToggle(team.team_id, true)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Top
                                </Button>
                                <Button
                                  size="sm"
                                  variant={isBottomTeam ? "default" : "outline"}
                                  onClick={() => handleTeamToggle(team.team_id, false)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Bottom
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="playoffs" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Playoff Wedstrijden</CardTitle>
                    <CardDescription>
                      Bekijk en beheer playoff wedstrijden
                    </CardDescription>
                  </div>
                  {hasPlayoffMatches && (
                    <Button
                      variant="destructive"
                      onClick={handleDeletePlayoffs}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijder Playoffs
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : hasPlayoffMatches ? (
                  <div className="space-y-4">
                    {playoffMatches.map((match) => (
                      <Card key={match.match_id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="font-medium">{match.home_team_name}</div>
                              <div className="text-2xl font-bold">{match.home_score || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">VS</div>
                              <div className="text-xs text-muted-foreground">{match.speeldag}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{match.away_team_name}</div>
                              <div className="text-2xl font-bold">{match.away_score || 0}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{match.playoff_round}</Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(match.match_date).toLocaleDateString('nl-NL')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {match.location}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Geen Playoff Wedstrijden</h3>
                    <p className="text-muted-foreground">
                      Er zijn nog geen playoff wedstrijden gegenereerd. Ga naar het "Playoff Genereren" tabblad om playoffs aan te maken.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Playoff Genereren</CardTitle>
                <CardDescription>
                  Genereer playoff wedstrijden op basis van de huidige competitie stand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topTeams">Top Teams</Label>
                    <Select 
                      value={playoffConfig.topTeams.toString()} 
                      onValueChange={(value) => setPlayoffConfig(prev => ({ ...prev, topTeams: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 teams</SelectItem>
                        <SelectItem value="6">6 teams</SelectItem>
                        <SelectItem value="8">8 teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bottomTeams">Bottom Teams</Label>
                    <Select 
                      value={playoffConfig.bottomTeams.toString()} 
                      onValueChange={(value) => setPlayoffConfig(prev => ({ ...prev, bottomTeams: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 teams</SelectItem>
                        <SelectItem value="6">6 teams</SelectItem>
                        <SelectItem value="8">8 teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rounds">Aantal Rondes</Label>
                    <Select 
                      value={playoffConfig.rounds.toString()} 
                      onValueChange={(value) => setPlayoffConfig(prev => ({ ...prev, rounds: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ronde</SelectItem>
                        <SelectItem value="2">2 rondes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selection Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Top Teams ({selectedTopTeams.length}/{playoffConfig.topTeams})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTopTeams.map(teamId => {
                          const team = teams.find(t => t.team_id === teamId);
                          return team ? (
                            <Badge key={teamId} variant="default" className="mr-2 mb-2">
                              {team.team_name}
                            </Badge>
                          ) : null;
                        })}
                        {selectedTopTeams.length === 0 && (
                          <p className="text-sm text-muted-foreground">Geen top teams geselecteerd</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Bottom Teams ({selectedBottomTeams.length}/{playoffConfig.bottomTeams})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedBottomTeams.map(teamId => {
                          const team = teams.find(t => t.team_id === teamId);
                          return team ? (
                            <Badge key={teamId} variant="secondary" className="mr-2 mb-2">
                              {team.team_name}
                            </Badge>
                          ) : null;
                        })}
                        {selectedBottomTeams.length === 0 && (
                          <p className="text-sm text-muted-foreground">Geen bottom teams geselecteerd</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleGeneratePlayoffs}
                    disabled={loading || (selectedTopTeams.length === 0 && selectedBottomTeams.length === 0)}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trophy className="h-4 w-4 mr-2" />
                    )}
                    Playoffs Genereren
                  </Button>
                  
                  {hasPlayoffMatches && (
                    <Button
                      variant="destructive"
                      onClick={handleDeletePlayoffs}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijder Playoffs
                    </Button>
                  )}
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Playoffs worden gegenereerd op basis van de huidige competitie stand. 
                    Selecteer de gewenste teams en configureer het aantal rondes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default AdminPlayoffPage; 