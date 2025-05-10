
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PlayOffTab: React.FC = () => {
  const playoffTeams = {
    playoff1: [
      { position: 1, name: "Garage Verbeke", played: 3, won: 3, draw: 0, lost: 0, goalDiff: 6, points: 9 },
      { position: 2, name: "Shakthar Truu", played: 3, won: 2, draw: 0, lost: 1, goalDiff: 3, points: 6 },
      { position: 3, name: "De Dageraad", played: 3, won: 1, draw: 0, lost: 2, goalDiff: -2, points: 3 },
      { position: 4, name: "Cafe De Gilde", played: 3, won: 0, draw: 0, lost: 3, goalDiff: -7, points: 0 }
    ],
    playoff2: [
      { position: 1, name: "De Florre", played: 3, won: 2, draw: 1, lost: 0, goalDiff: 5, points: 7 },
      { position: 2, name: "Bemarmi Boys", played: 3, won: 1, draw: 1, lost: 1, goalDiff: 1, points: 4 }
    ]
  };

  const playoffMatches = [
    { playoff: "Play-Off 1", matchday: "Speeldag 1", date: "10 juni", home: "Garage Verbeke", away: "Cafe De Gilde", result: "4-1", location: "Sportpark Zuid" },
    { playoff: "Play-Off 1", matchday: "Speeldag 1", date: "10 juni", home: "Shakthar Truu", away: "De Dageraad", result: "3-2", location: "Sportpark Oost" },
    { playoff: "Play-Off 2", matchday: "Speeldag 1", date: "11 juni", home: "De Florre", away: "Bemarmi Boys", result: "2-2", location: "Sportpark Noord" },
    { playoff: "Play-Off 1", matchday: "Speeldag 2", date: "17 juni", home: "Garage Verbeke", away: "De Dageraad", result: "2-1", location: "Sportpark Zuid" },
    { playoff: "Play-Off 1", matchday: "Speeldag 2", date: "17 juni", home: "Shakthar Truu", away: "Cafe De Gilde", result: "3-0", location: "Sportpark Oost" },
    { playoff: "Play-Off 2", matchday: "Speeldag 2", date: "18 juni", home: "De Florre", away: "Bemarmi Boys", result: "3-1", location: "Sportpark Noord" },
  ];

  const upcomingMatches = [
    { playoff: "Play-Off 1", matchday: "Speeldag 3", date: "24 juni", time: "19:30", home: "Garage Verbeke", away: "Shakthar Truu", location: "Sportpark Zuid" },
    { playoff: "Play-Off 1", matchday: "Speeldag 3", date: "24 juni", time: "20:30", home: "De Dageraad", away: "Cafe De Gilde", location: "Sportpark Oost" }
  ];

  return (
    <div className="space-y-10 animate-slide-up">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Play-Off 1</h2>
          <Badge variant="outline" className="text-soccer-green">Top 4</Badge>
        </div>
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
                  {playoffTeams.playoff1.map((team, index) => (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Play-Off 2</h2>
          <Badge variant="outline" className="text-soccer-green">Plaats 5-6</Badge>
        </div>
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
                  {playoffTeams.playoff2.map((team, index) => (
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
        <h2 className="text-2xl font-semibold mb-4">Uitslagen Play-Offs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
          {playoffMatches.map((match, index) => (
            <Card key={index} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-1">
                  <Badge variant="outline" className="w-fit bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                    {match.playoff}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{match.matchday}</span>
                </div>
                <CardTitle className="text-lg">{match.date}</CardTitle>
                <p className="text-sm text-muted-foreground">{match.location}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center py-2">
                  <div className="font-medium text-left flex-1">{match.home}</div>
                  <div className="px-4 py-1 bg-muted rounded-lg font-bold">{match.result}</div>
                  <div className="font-medium text-right flex-1">{match.away}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Aankomende Play-Off Wedstrijden</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
          {upcomingMatches.map((match, index) => (
            <Card key={index} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-1">
                  <Badge variant="outline" className="w-fit bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                    {match.playoff}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{match.matchday}</span>
                </div>
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{match.date}</span>
                  <span className="text-soccer-green font-medium">{match.time}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{match.location}</p>
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
    </div>
  );
};

export default PlayOffTab;
