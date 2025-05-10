
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
                <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                  {match.matchday}
                </Badge>
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{match.date}</span>
                  <span className="text-soccer-green font-medium">{match.time}</span>
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
        <h2 className="text-2xl font-semibold mb-4">Laatste Uitslagen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                Speeldag 10
              </Badge>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>17 mei</span>
              </CardTitle>
              <CardDescription>Sportpark Zuid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2">
                <div className="font-medium text-left flex-1">De Dageraad</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">2 - 10</div>
                <div className="font-medium text-right flex-1">Cafe De Gilde</div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                Speeldag 10
              </Badge>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>17 mei</span>
              </CardTitle>
              <CardDescription>Sportpark Oost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2">
                <div className="font-medium text-left flex-1">De Florre</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">7 - 5</div>
                <div className="font-medium text-right flex-1">Bemarmi Boys</div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit mb-1 bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                Speeldag 10
              </Badge>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>18 mei</span>
              </CardTitle>
              <CardDescription>Sportpark Noord</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2">
                <div className="font-medium text-left flex-1">Garage Verbeke</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">3 - 1</div>
                <div className="font-medium text-right flex-1">Shakthar Truu</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CompetitionTab;
