import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, MapPin, Users, Award, CheckCircle } from "lucide-react";
interface Match {
  id: string;
  home: string;
  away: string;
  result: string | null;
  status: 'completed' | 'upcoming' | 'pending';
  date?: string;
  time?: string;
  location?: string;
  nextMatch?: string;
}
const CupTab: React.FC = () => {
  const cupData = {
    title: "Regio Beker 2024",
    description: "De jaarlijkse bekercompetitie waar alle regionale teams strijden om de felbegeerde regiobeker.",
    currentStage: "Kwartfinales",
    finalDate: "15 juli 2024 - 19:30",
    venue: "Gemeentelijk Stadion"
  };
  
  const bracketData = {
    eighthfinals: [
      { id: "1/8-1", home: "Cafe De Gilde", away: "FC Vrienden", result: null, status: "upcoming", date: "15 mei 2024", time: "19:00", location: "Sporthal De Dageraad", nextMatch: "KF-1" },
      { id: "1/8-2", home: "Garage Verbeke", away: "SC Harelbeke", result: null, status: "upcoming", date: "15 mei 2024", time: "19:30", location: "Sporthal Oost", nextMatch: "KF-1" },
      { id: "1/8-3", home: "Bemarmi Boys", away: "De Kampioenen", result: null, status: "upcoming", date: "15 mei 2024", time: "20:00", location: "Sporthal De Dageraad", nextMatch: "KF-2" },
      { id: "1/8-4", home: "De Florre", away: "Real Madrid", result: null, status: "upcoming", date: "15 mei 2024", time: "20:30", location: "Sporthal Oost", nextMatch: "KF-2" },
      { id: "1/8-5", home: "De Dageraad", away: "FC Barcelona", result: null, status: "upcoming", date: "16 mei 2024", time: "19:00", location: "Sporthal De Dageraad", nextMatch: "KF-3" },
      { id: "1/8-6", home: "Shakthar Tru.", away: "AC Milan", result: null, status: "upcoming", date: "16 mei 2024", time: "19:30", location: "Sporthal Oost", nextMatch: "KF-3" },
      { id: "1/8-7", home: "FC Oranje", away: "Liverpool FC", result: null, status: "upcoming", date: "16 mei 2024", time: "20:00", location: "Sporthal De Dageraad", nextMatch: "KF-4" },
      { id: "1/8-8", home: "Groene Sterren", away: "Chelsea FC", result: null, status: "upcoming", date: "16 mei 2024", time: "20:30", location: "Sporthal Oost", nextMatch: "KF-4" }
    ],
    quarterfinals: [
      { id: "KF-1", home: "Winnaar 1/8-1", away: "Winnaar 1/8-2", result: null, status: "pending", date: "22 mei 2024", time: "19:00", location: "Sporthal De Dageraad", nextMatch: "HF-1" },
      { id: "KF-2", home: "Winnaar 1/8-3", away: "Winnaar 1/8-4", result: null, status: "pending", date: "22 mei 2024", time: "19:30", location: "Sporthal Oost", nextMatch: "HF-1" },
      { id: "KF-3", home: "Winnaar 1/8-5", away: "Winnaar 1/8-6", result: null, status: "pending", date: "22 mei 2024", time: "20:00", location: "Sporthal De Dageraad", nextMatch: "HF-2" },
      { id: "KF-4", home: "Winnaar 1/8-7", away: "Winnaar 1/8-8", result: null, status: "pending", date: "22 mei 2024", time: "20:30", location: "Sporthal Oost", nextMatch: "HF-2" }
    ],
    semifinals: [
      { id: "HF-1", home: "Winnaar KF-1", away: "Winnaar KF-2", result: null, status: "pending", date: "29 mei 2024", time: "19:30", location: "Sporthal De Dageraad", nextMatch: "FINALE" },
      { id: "HF-2", home: "Winnaar KF-3", away: "Winnaar KF-4", result: null, status: "pending", date: "29 mei 2024", time: "20:15", location: "Sporthal De Dageraad", nextMatch: "FINALE" }
    ],
    final: {
      id: "FINALE",
      home: "Winnaar HF-1",
      away: "Winnaar HF-2",
      result: null,
      status: "pending",
      date: "15 juli 2024",
      time: "20:00",
      location: "Gemeentelijk Stadion"
    }
  };
  const MatchCard = ({
    match,
    stage
  }: {
    match: any;
    stage: string;
  }) => {
    const getStatusBadge = () => {
      switch (match.status) {
        case "completed":
          return { label: "Afgerond", color: "bg-green-500", icon: CheckCircle };
        case "upcoming":
          return { label: "→ " + match.nextMatch, color: "bg-orange-400", icon: Clock };
        case "pending":
          return { label: "In afwachting", color: "bg-gray-400", icon: Clock };
        default:
          return { label: "Onbekend", color: "bg-gray-400", icon: Clock };
      }
    };

    const status = getStatusBadge();
    const StatusIcon = status.icon;

    return (
      <div className="bg-white border border-purple-dark rounded-lg p-3 hover:shadow-md hover:border-purple-dark hover:bg-purple-dark transition-all duration-200 text-left w-full group">
        <div className="space-y-3">
          {/* Header met badges */}
          <div className="flex items-center justify-between">
            <Badge className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 group-hover:bg-white group-hover:text-purple-600">
              {match.id}
            </Badge>
            <Badge className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm group-hover:bg-white group-hover:!text-purple-600`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          {/* Teams op één lijn */}
          <div className="font-medium text-sm text-purple-dark group-hover:text-white transition-colors">
            <div className="flex items-center justify-center gap-2">
              <span className="truncate flex-1 text-right">{match.home}</span>
              <span className="text-xs text-gray-500 group-hover:text-white/70 px-1">vs</span>
              <span className="truncate flex-1 text-left">{match.away}</span>
            </div>
          </div>
          
          {/* Score centraal */}
          <div className="text-center font-bold text-primary group-hover:text-white text-xl py-1">
            {match.result || "  -  "}
          </div>
          
          {/* Datum links, tijd rechts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{match.date}</span>
            </div>
            <span className="font-medium">{match.time}</span>
          </div>
          
          {/* Locatie centraal */}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-white/80">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-center">{match.location}</span>
          </div>
        </div>
      </div>
    );
  };
  return <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          {cupData.title}
        </h2>
      </div>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Bekercompetitie Overzicht
                </CardTitle>
                <CardDescription>
                  {cupData.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Huidige fase: <strong>{cupData.currentStage}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span><strong>Locatie:</strong> {cupData.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span><strong>Finale:</strong> {cupData.finalDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Achtste Finales</CardTitle>
              <Badge className="bg-orange-400 text-white">Aankomend</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bracketData.eighthfinals.map(match => <MatchCard key={match.id} match={match} stage="1/8 Finale" />)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kwartfinales</CardTitle>
              <Badge className="bg-gray-400 text-white">In afwachting</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bracketData.quarterfinals.map(match => <MatchCard key={match.id} match={match} stage="Kwartfinale" />)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Halve Finales</CardTitle>
              <Badge className="bg-gray-400 text-white">In afwachting</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bracketData.semifinals.map(match => <MatchCard key={match.id} match={match} stage="Halve Finale" />)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Finale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <MatchCard match={bracketData.final} stage="final" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Toernooiinformatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Finaleinfo
                </h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Datum:</strong> {cupData.finalDate}</div>
                  <div><strong>Locatie:</strong> {cupData.venue}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Toernooiformat</h4>
                <div className="space-y-2 text-sm">
                  <div>• Knock-out systeem</div>
                  <div>• Geen verlenging</div>
                  <div>• Direct naar strafschoppen</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Vorig seizoen</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Winnaar 2023:</strong> FC Oranje</div>
                  <div><strong>Finalist:</strong> SC Blauw</div>
                  <div><strong>Eindstand:</strong> 3-1</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>;
};
export default CupTab;