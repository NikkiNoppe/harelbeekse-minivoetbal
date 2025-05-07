
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const CompetitionTab: React.FC = () => {
  const teams = [
    { position: 1, name: "FC Oranje", played: 10, won: 8, draw: 1, lost: 1, goalDiff: 15, points: 25 },
    { position: 2, name: "Groene Sterren", played: 10, won: 7, draw: 2, lost: 1, goalDiff: 12, points: 23 },
    { position: 3, name: "SC Blauw", played: 10, won: 6, draw: 2, lost: 2, goalDiff: 8, points: 20 },
    { position: 4, name: "VSV Rood-Wit", played: 10, won: 5, draw: 3, lost: 2, goalDiff: 6, points: 18 },
    { position: 5, name: "De Leeuwen", played: 10, won: 4, draw: 4, lost: 2, goalDiff: 4, points: 16 },
    { position: 6, name: "Sporting Lokaal", played: 10, won: 4, draw: 2, lost: 4, goalDiff: 0, points: 14 },
    { position: 7, name: "FC United", played: 10, won: 3, draw: 3, lost: 4, goalDiff: -2, points: 12 },
    { position: 8, name: "Real Dorpstraat", played: 10, won: 3, draw: 2, lost: 5, goalDiff: -3, points: 11 },
    { position: 9, name: "SV Victorie", played: 10, won: 3, draw: 1, lost: 6, goalDiff: -5, points: 10 },
    { position: 10, name: "FC Delta", played: 10, won: 2, draw: 3, lost: 5, goalDiff: -4, points: 9 },
    { position: 11, name: "Atletico Dorp", played: 10, won: 2, draw: 3, lost: 5, goalDiff: -6, points: 9 },
    { position: 12, name: "VV Westerwijk", played: 10, won: 2, draw: 2, lost: 6, goalDiff: -7, points: 8 },
    { position: 13, name: "Sparta Oost", played: 10, won: 2, draw: 2, lost: 6, goalDiff: -8, points: 8 },
    { position: 14, name: "Dynamo 86", played: 10, won: 2, draw: 1, lost: 7, goalDiff: -9, points: 7 },
    { position: 15, name: "SC Zuidhoek", played: 10, won: 1, draw: 3, lost: 6, goalDiff: -10, points: 6 },
    { position: 16, name: "Inter Dorpsveld", played: 10, won: 1, draw: 2, lost: 7, goalDiff: -12, points: 5 },
  ];

  const upcomingMatches = [
    { matchday: "Speeldag 11", date: "24 mei", time: "19:30", home: "FC Oranje", away: "De Leeuwen", location: "Sportpark Zuid" },
    { matchday: "Speeldag 11", date: "24 mei", time: "20:00", home: "SC Blauw", away: "Sporting Lokaal", location: "Sportpark Oost" },
    { matchday: "Speeldag 11", date: "25 mei", time: "14:00", home: "Groene Sterren", away: "VSV Rood-Wit", location: "Sportpark Noord" },
    { matchday: "Speeldag 11", date: "25 mei", time: "16:30", home: "Real Dorpstraat", away: "FC United", location: "Sportpark West" },
    { matchday: "Speeldag 12", date: "31 mei", time: "19:30", home: "SV Victorie", away: "FC Delta", location: "Sportpark Zuid" },
    { matchday: "Speeldag 12", date: "31 mei", time: "20:00", home: "Atletico Dorp", away: "VV Westerwijk", location: "Sportpark Oost" },
    { matchday: "Speeldag 12", date: "1 juni", time: "14:00", home: "Sparta Oost", away: "Dynamo 86", location: "Sportpark Noord" },
    { matchday: "Speeldag 12", date: "1 juni", time: "16:30", home: "SC Zuidhoek", away: "Inter Dorpsveld", location: "Sportpark West" },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Competitiestand</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="max-w-4xl mx-auto">
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
                  {teams.map((team) => (
                    <TableRow key={team.name} className="hover:bg-muted/30">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="font-medium text-left flex-1">FC Oranje</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">2 - 0</div>
                <div className="font-medium text-right flex-1">SC Blauw</div>
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
                <div className="font-medium text-left flex-1">VSV Rood-Wit</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">1 - 1</div>
                <div className="font-medium text-right flex-1">Groene Sterren</div>
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
                <div className="font-medium text-left flex-1">De Leeuwen</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">3 - 1</div>
                <div className="font-medium text-right flex-1">FC United</div>
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
              <CardDescription>Sportpark West</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2">
                <div className="font-medium text-left flex-1">Sporting Lokaal</div>
                <div className="px-4 py-1 bg-muted rounded-lg font-bold">2 - 2</div>
                <div className="font-medium text-right flex-1">Real Dorpstraat</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CompetitionTab;
