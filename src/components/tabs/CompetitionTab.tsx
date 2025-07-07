
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchCompetitionMatches } from "@/services/matchDataService";
import MatchCard from "../match/components/MatchCard";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "../tables/ResponsiveScheduleTable";

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
  const {
    data,
    error
  } = await supabase.from('competition_standings').select(`
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
    `).order('points', {
    ascending: false
  }).order('goal_difference', {
    ascending: false
  });
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

const CompetitionTab: React.FC<CompetitionTabProps> = ({
  teams
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Fetch competition standings
  const {
    data: fetchedTeams,
    isLoading: loadingStandings,
    error: standingsError,
    refetch: refetchStandings
  } = useQuery({
    queryKey: ['competitionStandings'],
    queryFn: fetchCompetitionStandings,
    refetchOnWindowFocus: true,
    staleTime: 30000
  });

  // Fetch matches data
  const {
    data: matchesData,
    isLoading: loadingMatches
  } = useQuery({
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
      return match.homeTeamName.toLowerCase().includes(lowerSearchTerm) || match.awayTeamName.toLowerCase().includes(lowerSearchTerm) || match.matchday.toLowerCase().includes(lowerSearchTerm) || match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(lowerSearchTerm);
    }
    return true;
  });
  
  const isLoading = loadingStandings || loadingMatches;
  
  return <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Competitiestand</h2>
        <Badge className="badge-purple">Seizoen 2025-2026</Badge>
      </div>

      <section>
          <Card>
            <CardContent className="bg-transparent">
              {isLoading && !teams ? <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Competitiestand laden...</span>
                </div> : standingsError && !teams ? <div className="text-center p-4">
                  <div className="text-red-500 mb-2">
                    Er is een fout opgetreden bij het laden van de competitiestand.
                  </div>
                  <Button variant="outline" onClick={() => refetchStandings()}>
                    Opnieuw proberen
                  </Button>
                </div> : !teamsToDisplay || teamsToDisplay.length === 0 ? <div className="text-center p-8 text-muted-foreground">
                  <p className="mb-2">Nog geen competitiestand beschikbaar.</p>
                  <p className="text-sm">Standings worden automatisch bijgewerkt wanneer wedstrijden worden ingediend.</p>
                </div> : <ResponsiveStandingsTable teams={teamsToDisplay} />}
            </CardContent>
          </Card>
      </section>
      
      {/* Aankomende Wedstrijden */}
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Aankomende Wedstrijden</CardTitle>
          <CardDescription>Wedstrijden van de komende speeldag</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {loadingMatches ? <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Wedstrijden laden...</span>
            </div> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcomingMatches.map(match => (
                <MatchCard
                  key={match.matchId}
                  id={match.uniqueNumber || `M${match.matchId}`}
                  home={match.homeTeamName}
                  away={match.awayTeamName}
                  date={match.date}
                  time={match.time}
                  location={match.location}
                />
              ))}
            </div>}
        </CardContent>
      </Card>
      
      {/* Afgelopen Wedstrijden */}
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Afgelopen Wedstrijden</CardTitle>
          <CardDescription>Resultaten van de laatst gespeelde speeldag</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {loadingMatches ? <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Wedstrijden laden...</span>
            </div> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pastMatches.map(match => (
                <MatchCard
                  key={match.matchId}
                  id={match.uniqueNumber || `M${match.matchId}`}
                  home={match.homeTeamName}
                  away={match.awayTeamName}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  date={match.date}
                  time={match.time}
                  location={match.location}
                />
              ))}
            </div>}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="matchday-filter" className="text-sm font-medium mb-2 block">Filter op speeldag</Label>
                <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
                  <SelectTrigger id="matchday-filter" className="btn-white h-10">
                    <SelectValue placeholder="Alle speeldagen" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content-login-style">
                    <SelectItem value="all-matchdays" className="dropdown-item-login-style">Alle speeldagen</SelectItem>
                    {matchdays.map((day, idx) => <SelectItem key={idx} value={day} className="dropdown-item-login-style">{day}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="team-filter" className="text-sm font-medium mb-2 block">Filter op team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team-filter" className="btn-white h-10">
                    <SelectValue placeholder="Alle teams" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content-login-style">
                    <SelectItem value="all-teams" className="dropdown-item-login-style">Alle teams</SelectItem>
                    {teamNames.map((team, idx) => <SelectItem key={idx} value={team} className="dropdown-item-login-style">{team}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">Zoeken</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-purple-400 transform -translate-y-1/2 z-10" />
                  <Input 
                    id="search" 
                    placeholder="Zoek op team, locatie, etc." 
                    className="pl-10 h-10 bg-white text-purple-600 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 placeholder:text-purple-400" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            <Button className="btn-white w-full md:w-auto" onClick={() => {
            setSearchTerm("");
            setSelectedMatchday("");
            setSelectedTeam("");
          }}>
              Filters wissen
            </Button>
          </div>
          
          <ResponsiveScheduleTable matches={filteredMatches} />
        </CardContent>
      </Card>
    </div>;
};

export default CompetitionTab;
