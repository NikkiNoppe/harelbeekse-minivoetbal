import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Suspension {
  player: string;
  team: string;
  reason: string;
  start: string;
  end: string;
  matches: number;
  status: 'active' | 'pending' | 'completed';
}

interface YellowCardCount {
  player: string;
  team: string;
  count: number;
}

const SuspensionsTab: React.FC = () => {
  const suspensions: Suspension[] = [
    { 
      player: "Jan Jansen", 
      team: "FC Oranje", 
      reason: "Directe rode kaart", 
      start: "12-05-2024", 
      end: "26-05-2024", 
      matches: 2,
      status: "active" 
    },
    { 
      player: "Tim Visser", 
      team: "SC Blauw", 
      reason: "Onsportief gedrag na afloop wedstrijd", 
      start: "05-05-2024", 
      end: "19-05-2024", 
      matches: 2,
      status: "active" 
    },
    { 
      player: "Peter Bakker", 
      team: "Groene Sterren", 
      reason: "Accumulatie gele kaarten", 
      start: "19-05-2024", 
      end: "26-05-2024", 
      matches: 1,
      status: "pending" 
    },
    { 
      player: "Mark Smits", 
      team: "VSV Rood-Wit", 
      reason: "Directe rode kaart", 
      start: "28-04-2024", 
      end: "19-05-2024", 
      matches: 3,
      status: "completed" 
    },
  ];

  const yellowCardCounts: YellowCardCount[] = [
    { player: "Dirk van Dijk", team: "FC United", count: 3 },
    { player: "Karel Klaassen", team: "De Leeuwen", count: 3 },
    { player: "Marco Mulder", team: "Sporting Lokaal", count: 3 },
    { player: "Lars Pietersen", team: "Real Dorpstraat", count: 2 },
    { player: "Thomas Vos", team: "FC Oranje", count: 2 },
  ];

  const getStatusBadge = (status: Suspension['status']) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500">Actief</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">In afwachting</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Afgerond</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Actieve Schorsingen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Speler</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Eind</TableHead>
                  <TableHead>Wedstrijden</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspensions.map((suspension, index) => (
                  <TableRow key={index}>
                    <TableCell>{suspension.player}</TableCell>
                    <TableCell>{suspension.team}</TableCell>
                    <TableCell>{suspension.reason}</TableCell>
                    <TableCell>{suspension.start}</TableCell>
                    <TableCell>{suspension.end}</TableCell>
                    <TableCell>{suspension.matches}</TableCell>
                    <TableCell>{getStatusBadge(suspension.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gele Kaarten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Speler</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Aantal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yellowCardCounts.map((count, index) => (
                  <TableRow key={index}>
                    <TableCell>{count.player}</TableCell>
                    <TableCell>{count.team}</TableCell>
                    <TableCell>{count.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspensionsTab;
