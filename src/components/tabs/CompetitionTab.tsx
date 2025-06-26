
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchCompetitionMatches, MatchData } from "@/services/matchDataService";

interface Team {
  id: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDiff: number;
  points: number;
}

// Function to fetch competition standings from Supabase
const fetchCompetitionStandings = async () => {
  const { data, error } = await supabase.from('competition_standings').select(`
      standing_id,
      team_id,
      matches_played,
      wins,
      draws,
      losses,
      goal_difference,
      goals_scored,
      goals_against,
      points,
      teams(team_name)
    `).order('points', { ascending: false }).order('goal_difference', { ascending: false });
  
  if (error) {
    console.error("Error fetching standings:", error);
    throw new Error(`Error fetching standings: ${error.message}`);
  }

  return data.map(standing => ({
    id: standing.team_id,
    name: standing.teams?.team_name || 'Unknown Team',
    played: standing.matches_played,
    won: standing.wins,
    draw: standing.draws,
    lost: standing.losses,
    goalDiff: standing.goal_difference,
    points: standing.points
  }));
};

interface CompetitionTabProps {
  teams?: Team[];
}

const CompetitionTab: React.FC<CompetitionTabProps> = ({ teams }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Fetch competition standings
  const { data: fetchedTeams, isLoading: loadingStandings, error: standingsError, refetch: refetchStandings } = useQuery({
    queryKey: ['competitionStandings'],
    queryFn: fetchCompetitionStandings,
    refetchOnWindowFocus: true,
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  // Fetch matches data
  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['competitionMatches'],
    queryFn: fetchCompetitionMatches
  });

  const teamsToDisplay = teams || fetchedTeams;
  const upcomingMatches = matchesData?.upcoming || [];
  const pastMatches = matchesData?.past || [];
  const allMatches = [...upcomingMatches, ...pastMatches];

  // Get unique matchdays and team names for filtering
  const matchdays = [...new Set(allMatches.map(match => match.matchday))];
  const teamNames = [...new Set([...allMatches.map(match => match.homeTeamName), ...allMatches.map(match => match.awayTeamName)])];

  const filteredMatches = allMatches.filter(match => {
    if (selectedMatchday && match.matchday !== selectedMatchday) {
      return false;
    }
    if (selectedTeam && match.homeTeamName !== selectedTeam && match.awayTeamName !== selectedTeam) {
      return false;
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return match.homeTeamName.toLowerCase().includes(lowerSearchTerm) || 
             match.awayTeamName.toLowerCase().includes(lowerSearchTerm) || 
             match.matchday.toLowerCase().includes(lowerSearchTerm) ||
             (match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(lowerSearchTerm));
    }
    return true;
  });

  const isLoading = loadingStandings || loadingMatches;

  return (
    <div className="space-y-6">
      {/* Competitie Stand */}
      <section>
        <div className="flex items-center justify-between mt-8">
          <h2 className="text-2xl font-semibold">Competitiestand</h2>
          <div className="flex items-center gap-2">
            <Badge className="badge-purple">Seizoen 2025-2026</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStandings()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Vernieuwen
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <Card>
            <CardContent className="bg-transparent">
              {isLoading && !teams ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Competitiestand laden...</span>
                </div>
              ) : standingsError && !teams ? (
                <div className="text-center p-4">
                  <div className="text-red-500 mb-2">
                    Er is een fout opgetreden bij het laden van de competitiestand.
                  </div>
                  <Button variant="outline" onClick={() => refetchStandings()}>
                    Opnieuw proberen
                  </Button>
                </div>
              ) : !teamsToDisplay || teamsToDisplay.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p className="mb-2">Nog geen competitiestand beschikbaar.</p>
                  <p className="text-sm">Standings worden automatisch bijgewerkt wanneer wedstrijden worden ingediend.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Positie</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">Aant Wed</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">V</TableHead>
                        <TableHead className="text-center">Doelpunten</TableHead>
                        <TableHead className="text-center">Punten</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamsToDisplay.map((team, index) => (
                        <TableRow key={team.id} className={index === 0 ? "bg-green-50" : ""}>
                          <TableCell className="text-center font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell className="text-center">{team.played}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{team.won}</TableCell>
                          <TableCell className="text-center text-yellow-600 font-medium">{team.draw}</TableCell>
                          <TableCell className="text-center text-red-600 font-medium">{team.lost}</TableCell>
                          <TableCell className="text-center">
                            <span className={team.goalDiff > 0 ? "text-green-600 font-medium" : team.goalDiff < 0 ? "text-red-600 font-medium" : ""}>
                              {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-lg">{team.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Aankomende Wedstrijden */}
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Aankomende Wedstrijden</CardTitle>
          <CardDescription>Wedstrijden van de komende speeldag</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {loadingMatches ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Wedstrijden laden...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Thuisteam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uitteam</TableHead>
                    <TableHead>Locatie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingMatches.map((match) => (
                    <TableRow key={match.matchId}>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary text-soccer-black">
                          {match.uniqueNumber || `M${match.matchId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{match.date}</TableCell>
                      <TableCell>{match.time}</TableCell>
                      <TableCell className="font-medium">{match.homeTeamName}</TableCell>
                      <TableCell className="text-center">VS</TableCell>
                      <TableCell className="font-medium">{match.awayTeamName}</TableCell>
                      <TableCell>{match.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Afgelopen Wedstrijden */}
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Afgelopen Wedstrijden</CardTitle>
          <CardDescription>Resultaten van de laatst gespeelde speeldag</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {loadingMatches ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Wedstrijden laden...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Thuisteam</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Uitteam</TableHead>
                    <TableHead>Locatie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastMatches.map((match) => (
                    <TableRow key={match.matchId}>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary text-soccer-black">
                          {match.uniqueNumber || `M${match.matchId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{match.date}</TableCell>
                      <TableCell>{match.time}</TableCell>
                      <TableCell className="font-medium">{match.homeTeamName}</TableCell>
                      <TableCell className="text-center font-bold">
                        {match.homeScore !== undefined && match.awayScore !== undefined 
                          ? `${match.homeScore} - ${match.awayScore}` 
                          : "- - -"
                        }
                      </TableCell>
                      <TableCell className="font-medium">{match.awayTeamName}</TableCell>
                      <TableCell>{match.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Speelschema */}
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Speelschema</CardTitle>
          <CardDescription>Volledig overzicht van alle wedstrijden</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          <div className="mb-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="matchday-filter">Filter op speeldag</Label>
                <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
                  <SelectTrigger id="matchday-filter" className="bg-purple-light text-white hover:bg-purple-dark">
                    <SelectValue placeholder="Alle speeldagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-matchdays" className="bg-purple-light text-white hover:bg-purple-dark">Alle speeldagen</SelectItem>
                    {matchdays.map((day, idx) => (
                      <SelectItem key={idx} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="team-filter">Filter op team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team-filter" className="bg-purple-light text-white hover:bg-purple-dark">
                    <SelectValue placeholder="Alle teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teams" className="bg-purple-light text-white hover:bg-purple-dark">Alle teams</SelectItem>
                    {teamNames.map((team, idx) => (
                      <SelectItem key={idx} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search">Zoeken</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Zoek op team, locatie, etc."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setSearchTerm("");
                setSelectedMatchday("");
                setSelectedTeam("");
              }}
            >
              Filters wissen
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Speeldag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Wedstrijd</TableHead>
                  <TableHead>Locatie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.matchId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {match.matchday}
                      </div>
                    </TableCell>
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{match.time}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                        <span className="font-medium">{match.homeTeamName}</span>
                        {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                          <span className="mx-2 font-bold">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="mx-2">vs</span>
                        )}
                        <span className="font-medium">{match.awayTeamName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
                  </TableRow>
                ))}
                {filteredMatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Geen wedstrijden gevonden met de huidige filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionTab;
