import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, AlertCircle, Trash2, Calendar, CheckCircle, Clock, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionService, CompetitionMatch } from "@/services/match/competitionService";
import { playoffService, PlayoffMatch } from "@/services/match/playoffService";
import { teamService } from "@/services/core/teamService";

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
  position: number;
}

type PlayoffStatus = 'none' | 'concept' | 'finalized';

const AdminPlayoffPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [playoffStatus, setPlayoffStatus] = useState<PlayoffStatus>('none');
  
  // Configuration state
  const [topTeamCount, setTopTeamCount] = useState(8);
  const [bottomTeamCount, setBottomTeamCount] = useState(7); // Fixed at 7 as requested
  const [rounds, setRounds] = useState(2);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const { toast } = useToast();

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
      
      // Calculate standings with positions
      const calculatedStandings = calculateStandings(teamsData, regularMatches);
      setStandings(calculatedStandings);
      
      // Load playoff matches
      const playoffData = await playoffService.getPlayoffMatches();
      setPlayoffMatches(playoffData);
      
      // Determine playoff status
      if (playoffData.length === 0) {
        setPlayoffStatus('none');
      } else if (playoffData.some(m => m.is_playoff_finalized)) {
        setPlayoffStatus('finalized');
      } else {
        setPlayoffStatus('concept');
      }
      
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
        goal_difference: 0,
        position: 0
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

    // Calculate goal differences and sort
    const sorted = Object.values(standings)
      .map(team => ({ ...team, goal_difference: team.goals_for - team.goals_against }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

    // Assign positions
    return sorted.map((team, index) => ({ ...team, position: index + 1 }));
  };

  // Generate position-based playoff planning (concept)
  const handleGeneratePositionBasedPlayoffs = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Datums vereist",
        description: "Selecteer een geldige start- en einddatum voor de playoffs.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // Generate positions arrays
      const topPositions = Array.from({ length: topTeamCount }, (_, i) => i + 1);
      const bottomPositions = Array.from({ length: bottomTeamCount }, (_, i) => topTeamCount + i + 1);
      
      const result = await playoffService.generatePositionBasedPlayoffs(
        topPositions,
        bottomPositions,
        rounds,
        startDate,
        endDate
      );

      if (result.success) {
        toast({
          title: "Playoff planning aangemaakt",
          description: result.message,
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout bij genereren",
          description: result.message,
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
      setActionLoading(false);
    }
  };

  // Finalize playoffs with actual teams
  const handleFinalizePlayoffs = async () => {
    if (!confirm("Weet je zeker dat je de playoffs wilt finaliseren met de huidige stand? Dit wijst echte teams toe aan de posities.")) {
      return;
    }

    setActionLoading(true);
    try {
      // Create position -> team_id map based on current standings
      const standingsMap = new Map<number, number>();
      standings.forEach(team => {
        standingsMap.set(team.position, team.team_id);
      });

      const result = await playoffService.finalizePlayoffs(standingsMap);

      if (result.success) {
        toast({
          title: "Playoffs gefinaliseerd",
          description: result.message,
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout bij finaliseren",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error finalizing playoffs:', error);
      toast({
        title: "Fout bij finaliseren",
        description: "Er is een fout opgetreden bij het finaliseren.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Unfinalize playoffs (revert to positions)
  const handleUnfinalizePlayoffs = async () => {
    if (!confirm("Weet je zeker dat je de finalisatie wilt ongedaan maken? Teams worden weer vervangen door posities.")) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await playoffService.unfinalizePlayoffs();

      if (result.success) {
        toast({
          title: "Finalisatie ongedaan gemaakt",
          description: result.message,
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error unfinalizing playoffs:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete all playoffs
  const handleDeletePlayoffs = async () => {
    if (!confirm("Weet je zeker dat je alle playoff wedstrijden wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await playoffService.deletePlayoffMatches();
      
      if (result.success) {
        toast({
          title: "Playoffs verwijderd",
          description: result.message,
        });
        await loadInitialData();
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
        description: "Er is een fout opgetreden bij het verwijderen.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to display team or position
  const getTeamDisplay = (match: PlayoffMatch, isHome: boolean) => {
    if (isHome) {
      if (match.home_team_name) return match.home_team_name;
      if (match.home_position) return `${match.home_position}e plaats`;
      return 'Onbekend';
    } else {
      if (match.away_team_name) return match.away_team_name;
      if (match.away_position) return `${match.away_position}e plaats`;
      return 'Onbekend';
    }
  };

  const getStatusBadge = () => {
    switch (playoffStatus) {
      case 'concept':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"><Clock className="h-3 w-3 mr-1" /> Concept</Badge>;
      case 'finalized':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Definitief</Badge>;
      default:
        return null;
    }
  };

  const hasPlayoffMatches = playoffMatches.length > 0;
  const topPlayoffMatches = playoffMatches.filter(m => m.playoff_type === 'top');
  const bottomPlayoffMatches = playoffMatches.filter(m => m.playoff_type === 'bottom');

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Play-Off Beheer</h2>
          <p className="text-muted-foreground">
            Genereer playoff planning op basis van posities, finaliseer later met echte teams
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <section className="space-y-6">
        {/* Competitie Stand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Huidige Competitie Stand
            </CardTitle>
            <CardDescription>
              Posities worden gebruikt voor playoff planning. Bij finalisatie worden teams toegewezen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Pos</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">GS</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">W</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">G</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">V</TableHead>
                      <TableHead className="text-center hidden md:table-cell">DS</TableHead>
                      <TableHead className="text-center">Ptn</TableHead>
                      <TableHead className="text-center">Playoff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((team) => {
                      const isTopTeam = team.position <= topTeamCount;
                      const isBottomTeam = team.position > topTeamCount && team.position <= topTeamCount + bottomTeamCount;
                      
                      return (
                        <TableRow 
                          key={team.team_id} 
                          className={isTopTeam ? "bg-green-50 dark:bg-green-950/30" : isBottomTeam ? "bg-amber-50 dark:bg-amber-950/30" : ""}
                        >
                          <TableCell className="font-bold">{team.position}</TableCell>
                          <TableCell className="font-medium truncate max-w-[120px] sm:max-w-none">{team.team_name}</TableCell>
                          <TableCell className="text-center hidden sm:table-cell">{team.matches_played}</TableCell>
                          <TableCell className="text-center hidden sm:table-cell">{team.wins}</TableCell>
                          <TableCell className="text-center hidden sm:table-cell">{team.draws}</TableCell>
                          <TableCell className="text-center hidden sm:table-cell">{team.losses}</TableCell>
                          <TableCell className="text-center hidden md:table-cell">{team.goal_difference}</TableCell>
                          <TableCell className="text-center font-semibold">{team.points}</TableCell>
                          <TableCell className="text-center">
                            {isTopTeam && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                Top
                              </Badge>
                            )}
                            {isBottomTeam && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">
                                Bottom
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Playoff Configuration & Generation */}
        {playoffStatus === 'none' && (
          <Card>
            <CardHeader>
              <CardTitle>Playoff Planning Genereren</CardTitle>
              <CardDescription>
                Maak een concept planning aan op basis van posities. Later kun je de echte teams toewijzen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Top Playoff Teams</Label>
                  <Select value={topTeamCount.toString()} onValueChange={(v) => setTopTeamCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} teams (pos 1-{n})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bottom Playoff Teams</Label>
                  <Select value={bottomTeamCount.toString()} onValueChange={(v) => setBottomTeamCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} teams (pos {topTeamCount + 1}-{topTeamCount + n})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aantal Rondes</Label>
                  <Select value={rounds.toString()} onValueChange={(v) => setRounds(parseInt(v))}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Startdatum
                  </Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Einddatum
                  </Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top Playoff Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {Array.from({ length: Math.min(4, topTeamCount) }, (_, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{i + 1}e plaats</span>
                        <span className="text-muted-foreground">vs</span>
                        <span>{topTeamCount - i}e plaats</span>
                      </div>
                    ))}
                    {topTeamCount > 4 && <div className="text-muted-foreground">...</div>}
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bottom Playoff Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {Array.from({ length: Math.min(4, bottomTeamCount) }, (_, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{topTeamCount + i + 1}e plaats</span>
                        <span className="text-muted-foreground">vs</span>
                        <span>{topTeamCount + bottomTeamCount - i}e plaats</span>
                      </div>
                    ))}
                    {bottomTeamCount > 4 && <div className="text-muted-foreground">...</div>}
                  </CardContent>
                </Card>
              </div>

              <Button
                onClick={handleGeneratePositionBasedPlayoffs}
                disabled={actionLoading || !startDate || !endDate}
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4 mr-2" />
                )}
                Genereer Playoff Planning (Concept)
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  De planning wordt aangemaakt met posities (1e, 2e, etc.) in plaats van teamnamen. 
                  Wanneer de eindstand bekend is, kun je de planning finaliseren met echte teams.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Finalization Card (when concept exists) */}
        {playoffStatus === 'concept' && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Playoff Finaliseren
              </CardTitle>
              <CardDescription>
                De planning is aangemaakt met posities. Finaliseer om echte teams toe te wijzen op basis van de huidige stand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <strong>Let op:</strong> Bij finalisatie worden de huidige standingsposities definitief gekoppeld aan teams.
                  Zorg dat de competitie is afgelopen voordat je finaliseert.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleFinalizePlayoffs}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Finaliseer met Huidige Stand
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlayoffs}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijder Planning
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions for finalized playoffs */}
        {playoffStatus === 'finalized' && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Playoffs Gefinaliseerd
              </CardTitle>
              <CardDescription>
                De playoffs zijn gefinaliseerd. Teams zijn toegewezen aan de wedstrijden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleUnfinalizePlayoffs}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4 mr-2" />
                  )}
                  Terug naar Concept
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlayoffs}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijder Alle Playoffs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Playoff Matches Display */}
        {hasPlayoffMatches && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Playoff Matches */}
            {topPlayoffMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Top</Badge>
                    Top Playoff Wedstrijden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPlayoffMatches.map((match) => (
                    <div 
                      key={match.match_id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 text-right pr-2">
                        <span className={match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic"}>
                          {getTeamDisplay(match, true)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        {match.home_score !== null && match.away_score !== null ? (
                          <span className="font-bold">{match.home_score} - {match.away_score}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">vs</span>
                        )}
                      </div>
                      <div className="flex-1 pl-2">
                        <span className={match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic"}>
                          {getTeamDisplay(match, false)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2 hidden sm:block">
                        {new Date(match.match_date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Bottom Playoff Matches */}
            {bottomPlayoffMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Bottom</Badge>
                    Bottom Playoff Wedstrijden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bottomPlayoffMatches.map((match) => (
                    <div 
                      key={match.match_id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 text-right pr-2">
                        <span className={match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic"}>
                          {getTeamDisplay(match, true)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        {match.home_score !== null && match.away_score !== null ? (
                          <span className="font-bold">{match.home_score} - {match.away_score}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">vs</span>
                        )}
                      </div>
                      <div className="flex-1 pl-2">
                        <span className={match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic"}>
                          {getTeamDisplay(match, false)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2 hidden sm:block">
                        {new Date(match.match_date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasPlayoffMatches && playoffStatus === 'none' && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Geen Playoff Planning</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Er is nog geen playoff planning aangemaakt. Configureer de instellingen hierboven 
                en genereer een planning op basis van posities.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
};

export default AdminPlayoffPage;
