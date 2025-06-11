import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

interface Match {
  matchday: string;
  date: string;
  time: string;
  home: string;
  away: string;
  location: string;
  isCompleted?: boolean;
  homeScore?: number;
  awayScore?: number;
  unique_number?: string;
}

// Mock data for matches
const upcomingMatches: Match[] = [{
  matchday: "Speeldag 11",
  date: "2025-05-15",
  time: "20:00",
  home: "Garage Verbeke",
  away: "Shakthar Truu",
  location: "Sporthal 1"
}, {
  matchday: "Speeldag 11",
  date: "2025-05-15",
  time: "21:00",
  home: "De Dageraad",
  away: "Cafe De Gilde",
  location: "Sporthal 2"
}, {
  matchday: "Speeldag 11",
  date: "2025-05-16",
  time: "20:00",
  home: "De Florre",
  away: "Bemarmi Boys",
  location: "Sporthal 1"
}];

const pastMatches: Match[] = [{
  matchday: "Speeldag 10",
  date: "2025-05-08",
  time: "20:00",
  home: "Shakthar Truu",
  away: "De Florre",
  location: "Sporthal 1",
  isCompleted: true,
  homeScore: 3,
  awayScore: 1
}, {
  matchday: "Speeldag 10",
  date: "2025-05-08",
  time: "21:00",
  home: "Cafe De Gilde",
  away: "Garage Verbeke",
  location: "Sporthal 2",
  isCompleted: true,
  homeScore: 2,
  awayScore: 2
}, {
  matchday: "Speeldag 10",
  date: "2025-05-09",
  time: "20:00",
  home: "Bemarmi Boys",
  away: "De Dageraad",
  location: "Sporthal 1",
  isCompleted: true,
  homeScore: 1,
  awayScore: 4
}];

// All matches - includes both past and upcoming
const allMatches: Match[] = [...pastMatches, ...upcomingMatches, {
  matchday: "Speeldag 9",
  date: "2025-05-01",
  time: "20:00",
  home: "De Dageraad",
  away: "Shakthar Truu",
  location: "Sporthal 1",
  isCompleted: true,
  homeScore: 2,
  awayScore: 3
}, {
  matchday: "Speeldag 9",
  date: "2025-05-01",
  time: "21:00",
  home: "Garage Verbeke",
  away: "Bemarmi Boys",
  location: "Sporthal 2",
  isCompleted: true,
  homeScore: 5,
  awayScore: 0
}, {
  matchday: "Speeldag 9",
  date: "2025-05-02",
  time: "20:00",
  home: "De Florre",
  away: "Cafe De Gilde",
  location: "Sporthal 1",
  isCompleted: true,
  homeScore: 3,
  awayScore: 3
}, {
  matchday: "Speeldag 12",
  date: "2025-05-22",
  time: "20:00",
  home: "Cafe De Gilde",
  away: "Shakthar Truu",
  location: "Sporthal 1"
}, {
  matchday: "Speeldag 12",
  date: "2025-05-22",
  time: "21:00",
  home: "De Dageraad",
  away: "Garage Verbeke",
  location: "Sporthal 2"
}];

const matchdays = [...new Set(allMatches.map(match => match.matchday))];
const teamNames = [...new Set([...allMatches.map(match => match.home), ...allMatches.map(match => match.away)])];

const fetchCompetitionStandings = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('competition_standings')
    .select('*')
    .order('points', { ascending: false });

  if (error) throw error;
  return data;
};

interface CompetitionTabProps {
  teams?: Team[];
}

const CompetitionTab: React.FC<CompetitionTabProps> = ({ teams }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const { data: fetchedTeams, isLoading, error } = useQuery({
    queryKey: ['competitionStandings'],
    queryFn: fetchCompetitionStandings
  });

  const teamsToDisplay = teams || fetchedTeams;

  const filteredMatches = allMatches.filter(match => {
    if (selectedMatchday && match.matchday !== selectedMatchday) return false;
    if (selectedTeam && match.home !== selectedTeam && match.away !== selectedTeam) return false;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return match.home.toLowerCase().includes(lowerSearchTerm) || 
             match.away.toLowerCase().includes(lowerSearchTerm) || 
             match.location.toLowerCase().includes(lowerSearchTerm) || 
             match.matchday.toLowerCase().includes(lowerSearchTerm);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiestand</CardTitle>
          <CardDescription>Stand van de huidige competitie</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !teams ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Competitiestand laden...</span>
            </div>
          ) : error && !teams ? (
            <div className="text-center p-4 text-red-500">
              Er is een fout opgetreden bij het laden van de competitiestand.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Positie</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>GW</TableHead>
                    <TableHead>W</TableHead>
                    <TableHead>G</TableHead>
                    <TableHead>V</TableHead>
                    <TableHead>DV</TableHead>
                    <TableHead>Punten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsToDisplay?.map((team, index) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.played}</TableCell>
                      <TableCell>{team.won}</TableCell>
                      <TableCell>{team.draw}</TableCell>
                      <TableCell>{team.lost}</TableCell>
                      <TableCell>{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</TableCell>
                      <TableCell className="font-bold">{team.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aankomende Wedstrijden</CardTitle>
          <CardDescription>Wedstrijden van de komende speeldag</CardDescription>
        </CardHeader>
        <CardContent>
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
                {upcomingMatches.map((match, index) => <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-200">
                        {match.unique_number || `${match.matchday.slice(-2)}0${index + 1}`}
                      </Badge>
                    </TableCell>
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{match.time}</TableCell>
                    <TableCell className="font-medium">
                      {match.home}
                      
                    </TableCell>
                    <TableCell className="text-center">VS</TableCell>
                    <TableCell className="font-medium">
                      {match.away}
                      
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Afgelopen Wedstrijden</CardTitle>
          <CardDescription>Resultaten van de laatst gespeelde speeldag</CardDescription>
        </CardHeader>
        <CardContent>
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
                {pastMatches.map((match, index) => <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-200">
                        {match.unique_number || `${match.matchday.slice(-2)}0${index + 1}`}
                      </Badge>
                    </TableCell>
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{match.time}</TableCell>
                    <TableCell className="font-medium">
                      {match.home}
                      
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {match.homeScore} - {match.awayScore}
                    </TableCell>
                    <TableCell className="font-medium">
                      {match.away}
                      
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Speelschema</CardTitle>
          <CardDescription>Volledig overzicht van alle wedstrijden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="matchday-filter">Filter op speeldag</Label>
                <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
                  <SelectTrigger id="matchday-filter">
                    <SelectValue placeholder="Alle speeldagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-matchdays">Alle speeldagen</SelectItem>
                    {matchdays.map((day, idx) => (
                      <SelectItem key={idx} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="team-filter">Filter op team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team-filter">
                    <SelectValue placeholder="Alle teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teams">Alle teams</SelectItem>
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
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full md:w-auto" onClick={() => {
            setSearchTerm("");
            setSelectedMatchday("");
            setSelectedTeam("");
          }}>
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
                {filteredMatches.map((match, index) => <TableRow key={index}>
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
                        <span className="font-medium">{match.home}</span>
                        {match.isCompleted ? <span className="mx-2 font-bold">
                            {match.homeScore} - {match.awayScore}
                          </span> : <span className="mx-2">vs</span>}
                        <span className="font-medium">{match.away}</span>
                      </div>
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
                  </TableRow>)}
                {filteredMatches.length === 0 && <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Geen wedstrijden gevonden met de huidige filters.
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionTab;