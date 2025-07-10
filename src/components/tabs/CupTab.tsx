import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, MapPin, Users, Award, AlertCircle } from "lucide-react";
import MatchCard, { MatchCardStatus } from "../match/components/MatchCard";
import CupMatchCard from "../match/components/CupMatchCard";
import { cupService } from "@/services/cupService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
interface CupMatchDisplay {
  id: string;
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'completed' | 'upcoming' | 'pending';
  date?: string;
  time?: string;
  location?: string;
  nextMatch?: string;
}
const CupTab: React.FC = () => {
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const cupData = {
    title: "Beker 2025/2026", 
    description: "De jaarlijkse bekercompetitie",
  };

  useEffect(() => {
    loadTournamentData();
  }, []);

  const loadTournamentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await cupService.getCupMatches();
      setTournamentData(data);
    } catch (error) {
      console.error('Error loading cup tournament:', error);
      setError('Kon toernooigegevens niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMatchForDisplay = (match: any): CupMatchDisplay => {
    const matchDate = new Date(match.match_date);
    const status: MatchCardStatus = match.is_submitted ? 'completed' : 
                                   match.home_team_id && match.away_team_id ? 'upcoming' : 'pending';
    
    return {
      id: match.match_id.toString(),
      home: match.home_team_name || 'TBD',
      away: match.away_team_name || 'TBD',
      homeScore: match.home_score,
      awayScore: match.away_score,
      status,
      date: matchDate.toLocaleDateString('nl-NL'),
      time: matchDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      location: match.location
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Toernooigegevens laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-slide-up">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadTournamentData}>Opnieuw proberen</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tournamentData || (
    !tournamentData.achtste_finales?.length &&
    !tournamentData.kwartfinales?.length &&
    !tournamentData.halve_finales?.length &&
    !tournamentData.finale
  )) {
    return (
      <div className="space-y-8 animate-slide-up">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Geen Toernooi Actief</h3>
              <p className="text-muted-foreground">
                Er is momenteel geen bekertoernooi actief. Neem contact op met de beheerder om een toernooi aan te maken.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data instead of mock data
  const bracketData = {
    eighthfinals: tournamentData.achtste_finales?.map(formatMatchForDisplay) || [],
    quarterfinals: tournamentData.kwartfinales?.map(formatMatchForDisplay) || [],
    semifinals: tournamentData.halve_finales?.map(formatMatchForDisplay) || [],
    final: tournamentData.finale ? formatMatchForDisplay(tournamentData.finale) : null
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
              </div>
            </div>
          </CardHeader>
    
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Achtste Finales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bracketData.eighthfinals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bracketData.eighthfinals.map(match => 
                  <CupMatchCard 
                    key={match.id} 
                    id={match.id} 
                    home={match.home} 
                    away={match.away} 
                    homeScore={match.homeScore} 
                    awayScore={match.awayScore}
                    date={match.date} 
                    time={match.time} 
                    location={match.location} 
                    status={match.status as MatchCardStatus} 
                    nextMatch={match.nextMatch}
                    tournamentRound="1/8 Finale"
                  />
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Geen achtste finales beschikbaar</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kwartfinales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bracketData.quarterfinals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bracketData.quarterfinals.map(match => 
                  <CupMatchCard 
                    key={match.id} 
                    id={match.id} 
                    home={match.home} 
                    away={match.away} 
                    homeScore={match.homeScore} 
                    awayScore={match.awayScore}
                    date={match.date} 
                    time={match.time} 
                    location={match.location} 
                    status={match.status as MatchCardStatus} 
                    nextMatch={match.nextMatch}
                    tournamentRound="Kwartfinale"
                  />
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Geen kwartfinales beschikbaar</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Halve Finales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bracketData.semifinals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bracketData.semifinals.map(match => 
                  <CupMatchCard 
                    key={match.id} 
                    id={match.id} 
                    home={match.home} 
                    away={match.away} 
                    homeScore={match.homeScore} 
                    awayScore={match.awayScore}
                    date={match.date} 
                    time={match.time} 
                    location={match.location} 
                    status={match.status as MatchCardStatus} 
                    nextMatch={match.nextMatch}
                    tournamentRound="Halve Finale"
                  />
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Geen halve finales beschikbaar</p>
            )}
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
            {bracketData.final ? (
              <div className="max-w-md mx-auto">
                <CupMatchCard 
                  id={bracketData.final.id} 
                  home={bracketData.final.home} 
                  away={bracketData.final.away} 
                  homeScore={bracketData.final.homeScore} 
                  awayScore={bracketData.final.awayScore}
                  date={bracketData.final.date} 
                  time={bracketData.final.time} 
                  location={bracketData.final.location} 
                  status={bracketData.final.status as MatchCardStatus}
                  tournamentRound="Finale"
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Finale nog niet beschikbaar</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Toernooiinformatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Finaleinfo
                </h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Datum:</strong> nog te bepalen</div>
                  <div><strong>Locatie:</strong> Dageraad Harelbeke</div>
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

              
            </div>
          </CardContent>
        </Card>
      </section>
    </div>;
};
export default CupTab;