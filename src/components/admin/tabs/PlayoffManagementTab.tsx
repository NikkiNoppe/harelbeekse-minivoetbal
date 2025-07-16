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

const PlayoffManagementTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<CompetitionMatch[]>([]);
  const [playoffConfig, setPlayoffConfig] = useState({
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
      // Load competition matches en bereken eindstand
      const matches = await competitionService.getCompetitionMatches();
      const regularMatches = matches.filter(match => !match.is_playoff_match);
      const playoffMatches = matches.filter(match => match.is_playoff_match);
      setPlayoffMatches(playoffMatches);
      // Bereken eindstand
      const calculatedStandings = calculateStandings(teamsData, regularMatches);
      setStandings(calculatedStandings);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de data.",
        variant: "destructive"
      });
    }
    setLoading(false);
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

  // Splits teams in top/bottom
  const getTopBottomTeams = () => {
    const total = standings.length;
    const topCount = Math.ceil(total / 2);
    const bottomCount = Math.floor(total / 2);
    const topTeams = standings.slice(0, topCount);
    const bottomTeams = standings.slice(topCount);
    return { topTeams, bottomTeams };
  };

  // Playoff genereren: round robin binnen elke groep, behoud punten/scores
  const handleGeneratePlayoffs = async () => {
    setLoading(true);
    try {
      const { topTeams, bottomTeams } = getTopBottomTeams();
      const allPlayoffTeams = [...topTeams, ...bottomTeams];
      // Haal venues/timeslots op
      const seasonData = await seasonService.getSeasonData();
      const venues = seasonData.venues || [];
      const timeslots = seasonData.venue_timeslots || [];
      if (venues.length === 0 || timeslots.length === 0) {
        toast({
          title: "Onvoldoende data",
          description: "Configureer eerst venues en tijdslots in de seizoensinstellingen.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      // Genereer round robin wedstrijden voor top en bottom
      const generateRoundRobin = (teams: TeamStanding[], rounds: number) => {
        const matches = [];
        for (let r = 0; r < rounds; r++) {
          for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
              matches.push({
                home_team_id: teams[i].team_id,
                away_team_id: teams[j].team_id,
                playoff_group: r === 0 ? (topTeams.includes(teams[i]) ? 'top' : 'bottom') : undefined,
                is_playoff_match: true
              });
            }
          }
        }
        return matches;
      };
      const topMatches = generateRoundRobin(topTeams, playoffConfig.rounds);
      const bottomMatches = generateRoundRobin(bottomTeams, playoffConfig.rounds);
      // Sla deze op via competitionService.generatePlayoffMatches (pas evt. aan voor nieuwe structuur)
      const playoffMatches = await competitionService.generatePlayoffMatches(
        [...topMatches, ...bottomMatches],
        topTeams.length + bottomTeams.length,
        [],
        playoffConfig.rounds
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

  const { topTeams, bottomTeams } = getTopBottomTeams();

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Play-Off</h2>
          <p className="text-muted-foreground">
            Beheer de playoffs - genereren en overzicht
          </p>
        </div>
      </div>
      <section>
        <div className="space-y-6">
          {/* Configuratie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Top Teams</h3>
              <ul className="list-disc ml-6">
                {topTeams.map(team => (
                  <li key={team.team_id}>{team.team_name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Bottom Teams</h3>
              <ul className="list-disc ml-6">
                {bottomTeams.map(team => (
                  <li key={team.team_id}>{team.team_name}</li>
                ))}
              </ul>
            </div>
          </div>
          {/* Aantal rondes */}
          <div className="w-64">
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
          {/* Actie */}
          <div className="flex gap-4">
            <Button
              onClick={handleGeneratePlayoffs}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Playoffs Genereren
            </Button>
          </div>
        </div>
        {/* Playoff wedstrijden overzicht */}
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Playoff Wedstrijden</h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : playoffMatches.length > 0 ? (
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
                Er zijn nog geen playoff wedstrijden gegenereerd.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlayoffManagementTab; 