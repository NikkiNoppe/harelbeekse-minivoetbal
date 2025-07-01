import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Trophy, Clock, MapPin, Users } from "lucide-react";
interface Match {
  id: number;
  home: string;
  away: string;
  result: string | null;
  status: 'completed' | 'upcoming' | 'pending';
  date?: string;
}
const CupTab: React.FC = () => {
  const cupData = {
    title: "Regio Beker 2024",
    description: "De jaarlijkse bekercompetitie waar alle regionale teams strijden om de felbegeerde regiobeker.",
    currentStage: "Halve Finales",
    finalDate: "15 juli 2024 - 19:30",
    venue: "Gemeentelijk Stadion"
  };
  const bracketData = {
    quarterfinals: [{
      id: 1,
      home: "FC Oranje",
      away: "FC United",
      result: "2-1",
      status: "completed"
    }, {
      id: 2,
      home: "Groene Sterren",
      away: "Real Dorpstraat",
      result: "3-0",
      status: "completed"
    }, {
      id: 3,
      home: "SC Blauw",
      away: "Sporting Lokaal",
      result: "1-0",
      status: "completed"
    }, {
      id: 4,
      home: "VSV Rood-Wit",
      away: "De Leeuwen",
      result: "2-2 (4-3 pen.)",
      status: "completed"
    }],
    semifinals: [{
      id: 1,
      home: "FC Oranje",
      away: "Groene Sterren",
      result: null,
      status: "upcoming",
      date: "24 juni"
    }, {
      id: 2,
      home: "SC Blauw",
      away: "VSV Rood-Wit",
      result: null,
      status: "upcoming",
      date: "25 juni"
    }],
    final: {
      id: 1,
      home: "Winnaar HF1",
      away: "Winnaar HF2",
      result: null,
      status: "pending",
      date: "15 juli 2024"
    }
  };
  const getStatusBadge = (status: Match['status']) => {
    if (status === 'completed') {
      return <Badge className="badge-purple">Afgerond</Badge>;
    }
    if (status === 'upcoming') {
      return <Badge className="badge-purple">Aankomend</Badge>;
    }
    return <Badge className="badge-purple">In afwachting</Badge>;
  };
  const MatchCard = ({
    match,
    stage
  }: {
    match: any;
    stage: string;
  }) => <Card className="overflow-hidden card-hover transition-all duration-200">
      <div className={`px-4 py-2 text-white font-medium text-sm ${stage === 'final' ? 'bg-gradient-to-r from-soccer-green to-soccer-dark-green' : 'bg-soccer-green'}`}>
        <div className="flex items-center justify-between">
          <span>{stage === 'final' ? 'FINALE' : `${stage} ${match.id}`}</span>
          {getStatusBadge(match.status)}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{match.home}</div>
            <div className="text-sm text-muted-foreground">vs</div>
            <div className="text-base font-semibold text-right">{match.away}</div>
          </div>
          
          {match.date && <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{match.date}</span>
            </div>}
          
          {match.result ? <div className="text-center font-medium bg-muted/30 py-2 px-3 rounded">
              {match.result}
            </div> : <div className="text-center text-muted-foreground py-2 px-3 bg-muted/20 rounded">
              Nog niet gespeeld
            </div>}
        </div>
      </CardContent>
    </Card>;
  return <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-soccer-green rounded-full p-4 inline-flex mb-4">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold">{cupData.title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {cupData.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-soccer-green" />
            <span>Huidige fase: <strong>{cupData.currentStage}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-soccer-green" />
            <span>{cupData.venue}</span>
          </div>
        </div>
      </div>

      {/* Tournament Bracket */}
      <div className="space-y-8">
        {/* Final */}
        <section>
          <div className="flex items-center justify-center mb-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-soccer-green" />
              Finale
            </h3>
          </div>
          <div className="max-w-md mx-auto">
            <MatchCard match={bracketData.final} stage="final" />
          </div>
        </section>

        {/* Semifinals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Halve Finales</h3>
            <Badge className="badge-purple">Aankomend</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bracketData.semifinals.map(match => <MatchCard key={match.id} match={match} stage="Halve Finale" />)}
          </div>
        </section>

        {/* Quarterfinals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Kwartfinales</h3>
            <Badge className="badge-purple">Afgerond</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bracketData.quarterfinals.map(match => <MatchCard key={match.id} match={match} stage="Kwartfinale" />)}
          </div>
        </section>
      </div>

      {/* Tournament Info */}
      <section className="mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-soccer-green" />
                Finaleinfo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Datum:</strong> {cupData.finalDate}</div>
              <div><strong>Locatie:</strong> {cupData.venue}</div>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Toernooiformat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Knock-out systeem</div>
              <div>• Geen verlenging</div>
              <div>• Direct naar strafschoppen</div>
              <div>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vorig seizoen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Winnaar 2023:</strong> FC Oranje</div>
              <div><strong>Finalist:</strong> SC Blauw</div>
              <div><strong>Eindstand:</strong> 3-1</div>
              
            </CardContent>
          </Card>
        </div>
      </section>
    </div>;
};
export default CupTab;