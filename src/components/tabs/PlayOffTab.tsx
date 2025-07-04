import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResponsivePlayoffTable from "@/components/tables/ResponsivePlayoffTable";

const PlayOffTab: React.FC = () => {
  const playoffTeams = {
    playoff1: [{
      position: 1,
      name: "CAFE DE GILDE",
      played: 29,
      won: 22,
      draw: 3,
      lost: 4,
      goalsFor: 228,
      goalsAgainst: 102,
      goalDiff: 126,
      points: 70
    }, {
      position: 2,
      name: "GARAGE VERBEKE",
      played: 29,
      won: 23,
      draw: 5,
      lost: 1,
      goalsFor: 229,
      goalsAgainst: 101,
      goalDiff: 128,
      points: 70
    }, {
      position: 3,
      name: "BEMARMI BOYS",
      played: 29,
      won: 21,
      draw: 6,
      lost: 2,
      goalsFor: 184,
      goalsAgainst: 89,
      goalDiff: 95,
      points: 65
    }, {
      position: 4,
      name: "DE FLORRE",
      played: 29,
      won: 16,
      draw: 10,
      lost: 3,
      goalsFor: 218,
      goalsAgainst: 130,
      goalDiff: 88,
      points: 51
    }, {
      position: 5,
      name: "DE DAGERAAD",
      played: 29,
      won: 15,
      draw: 12,
      lost: 2,
      goalsFor: 154,
      goalsAgainst: 95,
      goalDiff: 59,
      points: 47
    }, {
      position: 6,
      name: "SHAKTHAR TRU.",
      played: 29,
      won: 12,
      draw: 13,
      lost: 4,
      goalsFor: 124,
      goalsAgainst: 122,
      goalDiff: 2,
      points: 40
    }]
  };

  const playoffMatches = [{
    playoff: "Play-Off 1",
    matchday: "Speeldag 1",
    date: "10 juni",
    home: "Garage Verbeke",
    away: "Cafe De Gilde",
    result: "4-1",
    location: "Sportpark Zuid"
  }, {
    playoff: "Play-Off 1",
    matchday: "Speeldag 1",
    date: "10 juni",
    home: "Shakthar Truu",
    away: "De Dageraad",
    result: "3-2",
    location: "Sportpark Oost"
  }, {
    playoff: "Play-Off 2",
    matchday: "Speeldag 1",
    date: "11 juni",
    home: "De Florre",
    away: "Bemarmi Boys",
    result: "2-2",
    location: "Sportpark Noord"
  }, {
    playoff: "Play-Off 1",
    matchday: "Speeldag 2",
    date: "17 juni",
    home: "Garage Verbeke",
    away: "De Dageraad",
    result: "2-1",
    location: "Sportpark Zuid"
  }, {
    playoff: "Play-Off 1",
    matchday: "Speeldag 2",
    date: "17 juni",
    home: "Shakthar Truu",
    away: "Cafe De Gilde",
    result: "3-0",
    location: "Sportpark Oost"
  }, {
    playoff: "Play-Off 2",
    matchday: "Speeldag 2",
    date: "18 juni",
    home: "De Florre",
    away: "Bemarmi Boys",
    result: "3-1",
    location: "Sportpark Noord"
  },
  // New results
  {
    playoff: "Play-Off 1",
    matchday: "Speeldag 3",
    date: "12 mei",
    home: "Shakthar Tru.",
    away: "De Florre",
    result: "0-5",
    location: "Sportpark Oost"
  }, {
    playoff: "Play-Off 1",
    matchday: "Speeldag 3",
    date: "12 mei",
    home: "Cafe De Gilde",
    away: "Bemarmi Boys",
    result: "4-4",
    location: "Sportpark Zuid"
  }, {
    playoff: "Play-Off 1",
    matchday: "Speeldag 3",
    date: "13 mei",
    home: "Garage Verbeke",
    away: "De Dageraad",
    result: "5-1",
    location: "Sportpark Noord"
  }];

  const upcomingMatches: any[] = [];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Eindklassement</h2>
        <Badge className="badge-purple">Seizoen 2025-2026</Badge>
      </div>

      <section>
        <Card>
          <CardContent className="p-2 sm:p-6 overflow-x-auto">
            <ResponsivePlayoffTable teams={playoffTeams.playoff1} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Uitslagen Play-Offs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
            {playoffMatches.map((match, index) => <Card key={index} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <Badge className="badge-purple">
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
              </Card>)}
          </div>
      </section>

      {upcomingMatches.length > 0 && <section>
          <h2 className="text-2xl font-semibold mb-4">Aankomende Play-Off Wedstrijden</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
            {upcomingMatches.map((match, index) => <Card key={index} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <Badge className="badge-purple">
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
              </Card>)}
          </div>
        </section>}
    </div>
  );
};

export default PlayOffTab;
