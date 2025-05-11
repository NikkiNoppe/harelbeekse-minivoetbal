
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add props type to accept teams data
interface CompetitionTabProps {
  teams?: Array<{
    id: number;
    name: string;
    email: string;
    played: number;
    won: number;
    draw: number;
    lost: number;
    goalDiff: number;
    points: number;
  }>;
}

const CompetitionTab: React.FC<CompetitionTabProps> = ({ teams = [] }) => {
  // Use the teams provided through props (from Layout's MOCK_TEAMS)
  const competitionTeams = teams.length > 0 ? teams : [];
  const [selectedMatchday, setSelectedMatchday] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Sort teams by points (highest first)
  const sortedTeams = [...competitionTeams].sort((a, b) => {
    // First by points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // Then by goal difference
    if (b.goalDiff !== a.goalDiff) {
      return b.goalDiff - a.goalDiff;
    }
    // Then by goals scored (won as a proxy for goals scored)
    return b.won - a.won;
  });

  // Add positions based on sorted order
  const teamsWithPositions = sortedTeams.map((team, index) => ({
    ...team,
    position: index + 1
  }));

  const upcomingMatches = [
    { matchday: "Speeldag 11", date: "24 mei", time: "19:30", home: "Garage Verbeke", away: "De Florre", location: "Sportpark Zuid" },
    { matchday: "Speeldag 11", date: "24 mei", time: "20:00", home: "De Dageraad", away: "Bemarmi Boys", location: "Sportpark Oost" },
    { matchday: "Speeldag 11", date: "25 mei", time: "14:00", home: "Shakthar Truu", away: "Cafe De Gilde", location: "Sportpark Noord" },
    { matchday: "Speeldag 12", date: "31 mei", time: "19:30", home: "De Florre", away: "Bemarmi Boys", location: "Sportpark Zuid" },
    { matchday: "Speeldag 12", date: "31 mei", time: "20:00", home: "De Dageraad", away: "Cafe De Gilde", location: "Sportpark Oost" },
    { matchday: "Speeldag 12", date: "1 juni", time: "14:00", home: "Garage Verbeke", away: "Shakthar Truu", location: "Sportpark Noord" },
  ];

  const recentMatches = [
    { matchday: "Speeldag 10", date: "17 mei", time: "19:30", home: "De Dageraad", away: "Cafe De Gilde", homeScore: 2, awayScore: 10, location: "Sportpark Zuid" },
    { matchday: "Speeldag 10", date: "17 mei", time: "20:00", home: "De Florre", away: "Bemarmi Boys", homeScore: 7, awayScore: 5, location: "Sportpark Oost" },
    { matchday: "Speeldag 10", date: "18 mei", time: "14:00", home: "Garage Verbeke", away: "Shakthar Truu", homeScore: 3, awayScore: 1, location: "Sportpark Noord" }
  ];

  // Generate all matchdays for the schedule
  const allMatchdays = Array.from({ length: 22 }, (_, i) => `Speeldag ${i + 1}`);
  
  // Combine all matches for the schedule
  const allMatches = [
    ...upcomingMatches,
    // Add past matches from recentMatches but format them differently
    ...recentMatches.map(match => ({
      matchday: match.matchday,
      date: match.date,
      time: match.time,
      home: match.home,
      away: match.away,
      location: match.location,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isCompleted: true
    })),
    // Add more sample matches for other matchdays
    { matchday: "Speeldag 1", date: "15 sep", time: "19:30", home: "Garage Verbeke", away: "De Dageraad", homeScore: 4, awayScore: 2, location: "Sportpark Zuid", isCompleted: true },
    { matchday: "Speeldag 1", date: "15 sep", time: "20:00", home: "Shakthar Truu", away: "De Florre", homeScore: 3, awayScore: 3, location: "Sportpark Oost", isCompleted: true },
    { matchday: "Speeldag 1", date: "16 sep", time: "14:00", home: "Cafe De Gilde", away: "Bemarmi Boys", homeScore: 7, awayScore: 2, location: "Sportpark Noord", isCompleted: true },
    { matchday: "Speeldag 13", date: "7 juni", time: "19:30", home: "Cafe De Gilde", away: "Garage Verbeke", location: "Sportpark Zuid" },
    { matchday: "Speeldag 13", date: "7 juni", time: "20:00", home: "Bemarmi Boys", away: "Shakthar Truu", location: "Sportpark Oost" },
    { matchday: "Speeldag 13", date: "8 juni", time: "14:00", home: "De Florre", away: "De Dageraad", location: "Sportpark Noord" }
  ];
  
  // Filter matches based on selected filters
  const filteredMatches = allMatches.filter(match => {
    const matchdayFilter = selectedMatchday === "all" || match.matchday === selectedMatchday;
    const teamFilter = selectedTeam === "all" || match.home === selectedTeam || match.away === selectedTeam;
    return matchdayFilter && teamFilter;
  });

  return (
    <div className="space-y-8 animate-slide-up">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Competitiestand</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="max-w-3xl mx-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">Pos</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">GS</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">G</TableHead>
                    <TableHead className="text-center">V</TableHead>
                    <TableHead className="text-center">DV</TableHead>
                    <TableHead className="text-center">Ptn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsWithPositions.map((team) => (
                    <TableRow key={team.id || team.name} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{team.position}</TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell className="text-center">{team.played}</TableCell>
                      <TableCell className="text-center">{team.won}</TableCell>
                      <TableCell className="text-center">{team.draw}</TableCell>
                      <TableCell className="text-center">{team.lost}</TableCell>
                      <TableCell className="text-center">{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</TableCell>
                      <TableCell className="text-center font-medium">{team.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Aankomende Wedstrijden</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
          {upcomingMatches.map((match, index) => (
            <Card key={index} className="card-hover">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-orange-400">
                  {match.matchday}
                </Badge>
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{match.date}</span>
                  <span className="text-orange-400 font-medium">{match.time}</span>
                </CardTitle>
                <CardDescription>{match.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center py-2">
                  <div className="font-medium text-left flex-1">{match.home}</div>
                  <div className="px-4 py-1 bg-muted rounded-lg font-medium">VS</div>
                  <div className="font-medium text-right flex-1">{match.away}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Afgelopen Wedstrijden</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
          {recentMatches.map((match, index) => (
            <Card key={index} className="card-hover">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-orange-400">
                  {match.matchday}
                </Badge>
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{match.date}</span>
                </CardTitle>
                <CardDescription>{match.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center py-2">
                  <div className="font-medium text-left flex-1">{match.home}</div>
                  <div className="px-4 py-1 bg-muted rounded-lg font-bold">{match.homeScore} - {match.awayScore}</div>
                  <div className="font-medium text-right flex-1">{match.away}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Speelschema</h2>
        <Card className="max-w-3xl mx-auto px-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="w-full sm:w-1/2">
                <Label htmlFor="matchday-filter">Filter op speeldag</Label>
                <Select
                  value={selectedMatchday}
                  onValueChange={setSelectedMatchday}
                >
                  <SelectTrigger id="matchday-filter" className="mt-2">
                    <SelectValue placeholder="Alle speeldagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle speeldagen</SelectItem>
                    {allMatchdays.map((matchday) => (
                      <SelectItem key={matchday} value={matchday}>
                        {matchday}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-1/2">
                <Label htmlFor="team-filter">Filter op team</Label>
                <Select
                  value={selectedTeam}
                  onValueChange={setSelectedTeam}
                >
                  <SelectTrigger id="team-filter" className="mt-2">
                    <SelectValue placeholder="Alle teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle teams</SelectItem>
                    {competitionTeams.map((team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-md ${match.isCompleted ? 'bg-muted/10' : 'bg-muted/5'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline" className="bg-transparent text-orange-400 border-orange-400/20">
                        {match.matchday}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {match.date} • {match.time}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex-1">{match.home}</span>
                      {match.isCompleted ? (
                        <span className="px-4 py-1 bg-muted rounded-lg font-bold">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      ) : (
                        <span className="px-4 py-1 bg-muted rounded-lg font-medium">VS</span>
                      )}
                      <span className="font-medium flex-1 text-right">{match.away}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {match.location}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Geen wedstrijden gevonden met de huidige filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CompetitionTab;
