
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

const CupTab: React.FC = () => {
  const roundOf8 = [
    { match: 1, home: "FC Oranje", away: "FC United", date: "10 juni", result: "2-1" },
    { match: 2, home: "Groene Sterren", away: "Real Dorpstraat", date: "10 juni", result: "3-0" },
    { match: 3, home: "SC Blauw", away: "Sporting Lokaal", date: "11 juni", result: "1-0" },
    { match: 4, home: "VSV Rood-Wit", away: "De Leeuwen", date: "11 juni", result: "2-2 (4-3 pen.)" },
  ];

  const semifinals = [
    { match: 1, home: "FC Oranje", away: "Groene Sterren", date: "24 juni", result: "Nog niet gespeeld" },
    { match: 2, home: "SC Blauw", away: "VSV Rood-Wit", date: "25 juni", result: "Nog niet gespeeld" },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-soccer-green rounded-full p-4 inline-flex mb-4">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-center">Regio Beker 2024</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-2xl">
          De jaarlijkse bekercompetitie waar alle regionale teams strijden om de felbegeerde regiobeker.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Halve Finales</h3>
          <Badge variant="outline" className="bg-muted/50">Aankomend</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {semifinals.map((match, index) => (
            <Card key={index} className="overflow-hidden card-hover">
              <div className="bg-soccer-green text-white px-4 py-2 font-medium">
                Halve Finale {match.match} | {match.date}
              </div>
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
                    <div className="text-xl font-semibold">{match.home}</div>
                    <div className="text-sm text-muted-foreground">Bekerwinnaar 2022</div>
                  </div>
                  <div className="px-6 py-3 bg-muted/30 rounded-lg font-semibold text-lg mx-4">
                    VS
                  </div>
                  <div className="flex-1 text-center md:text-right mt-4 md:mt-0">
                    <div className="text-xl font-semibold">{match.away}</div>
                    <div className="text-sm text-muted-foreground">Finalist 2023</div>
                  </div>
                </div>
                <div className="mt-6 text-center font-medium text-muted-foreground">{match.result}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Kwartfinales</h3>
          <Badge variant="outline" className="bg-muted/50">Afgerond</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roundOf8.map((match, index) => (
            <Card key={index} className="overflow-hidden card-hover">
              <div className="bg-soccer-green/80 text-white px-4 py-1 font-medium text-sm">
                Kwartfinale {match.match} | {match.date}
              </div>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{match.home}</div>
                  <div className="px-4 py-1 bg-muted/20 rounded font-bold">{match.result}</div>
                  <div className="font-medium">{match.away}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-4">
        <h3 className="text-2xl font-semibold mb-4">Bekerfinale 2024</h3>
        <Card className="border-2 border-soccer-green overflow-hidden card-hover">
          <div className="bg-soccer-green text-white px-4 py-3 flex items-center justify-center gap-3">
            <Trophy className="h-5 w-5" />
            <span className="font-bold">FINALE</span>
            <Trophy className="h-5 w-5" />
          </div>
          <CardContent className="py-8 text-center">
            <p className="text-xl font-medium mb-3">15 juli 2024 - 19:30</p>
            <p className="text-sm text-muted-foreground mb-6">Gemeentelijk Stadion</p>
            <p className="text-base">
              Winnaar van <span className="font-semibold">Halve Finale 1</span>
            </p>
            <p className="my-4 text-lg font-bold">vs</p>
            <p className="text-base">
              Winnaar van <span className="font-semibold">Halve Finale 2</span>
            </p>
            <div className="mt-8 pt-6 border-t border-muted">
              <p className="text-sm text-muted-foreground">
                Tickets verkrijgbaar vanaf 1 juli 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CupTab;
