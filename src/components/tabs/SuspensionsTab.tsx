
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const SuspensionsTab: React.FC = () => {
  const suspensions = [
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

  const yellowCardCounts = [
    { player: "Dirk van Dijk", team: "FC United", count: 3 },
    { player: "Karel Klaassen", team: "De Leeuwen", count: 3 },
    { player: "Marco Mulder", team: "Sporting Lokaal", count: 3 },
    { player: "Lars Pietersen", team: "Real Dorpstraat", count: 2 },
    { player: "Thomas Vos", team: "FC Oranje", count: 2 },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Actuele Schorsingen</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Speler</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Aantal Wedstrijden</TableHead>
                  <TableHead>Van</TableHead>
                  <TableHead>Tot</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspensions.map((suspension, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{suspension.player}</TableCell>
                    <TableCell>{suspension.team}</TableCell>
                    <TableCell>{suspension.reason}</TableCell>
                    <TableCell className="text-center">{suspension.matches}</TableCell>
                    <TableCell>{suspension.start}</TableCell>
                    <TableCell>{suspension.end}</TableCell>
                    <TableCell>
                      {suspension.status === "active" && (
                        <Badge className="bg-red-500">Actief</Badge>
                      )}
                      {suspension.status === "pending" && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">Aankomend</Badge>
                      )}
                      {suspension.status === "completed" && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Afgerond</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Gele Kaarten Register</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spelers met Meeste Gele Kaarten</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Speler</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yellowCardCounts.map((record, index) => (
                    <TableRow key={index} className="hover:bg-muted/20">
                      <TableCell>{record.player}</TableCell>
                      <TableCell>{record.team}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {[...Array(record.count)].map((_, i) => (
                            <div key={i} className="h-5 w-3 bg-yellow-400 rounded-sm"></div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schorsingsregels</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="space-y-1">
                <h4 className="font-medium">Gele Kaarten</h4>
                <p className="text-muted-foreground">
                  Een speler wordt voor 1 wedstrijd geschorst na 4 gele kaarten.
                  Na 8 gele kaarten volgt een schorsing van 2 wedstrijden.
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">Rode Kaarten</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Directe rode kaart: minimaal 1 wedstrijd schorsing</li>
                  <li>Tweede gele kaart in één wedstrijd: 1 wedstrijd schorsing</li>
                  <li>Gewelddadig gedrag: minimaal 3 wedstrijden schorsing</li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">Beroepsprocedure</h4>
                <p className="text-muted-foreground">
                  Clubs kunnen binnen 3 werkdagen na de wedstrijd beroep aantekenen tegen een rode kaart.
                  Het tuchtcomité zal binnen 7 dagen uitspraak doen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default SuspensionsTab;
