
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { MatchFormData } from "@features/matches/match/types";
import { EditMatchTabContent } from "@features/matches/match/EditMatchTabContent";
import { PastMatchesTabContent } from "@features/matches/match/PastMatchesTabContent";
import { supabase } from "@shared/integrations/supabase/client";

const MatchTab: React.FC = () => {
  const [matches, setMatches] = useState<MatchFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const { data: matchesData, error } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });
        
        if (error) throw error;
        
        const transformedMatches: MatchFormData[] = (matchesData || []).map(match => ({
          id: match.match_id,
          date: new Date(match.match_date).toISOString().split('T')[0],
          time: new Date(match.match_date).toTimeString().split(' ')[0],
          homeTeam: match.home_team_id?.toString() || '',
          awayTeam: match.away_team_id?.toString() || '',
          location: match.location || '',
          homeScore: match.home_score,
          awayScore: match.away_score,
          referee: match.referee,
          uniqueNumber: match.unique_number
        }));
        
        setMatches(transformedMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleSaveMatch = (matchData: MatchFormData) => {
    console.log('Saving match:', matchData);
    // Add save logic here
  };

  const handleEditMatch = (match: MatchFormData) => {
    setSelectedMatch(match);
  };

  const handleCancelEdit = () => {
    setSelectedMatch(null);
  };

  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>Wedstrijden</CardTitle>
        </CardHeader>
        <CardContent>Loading matches...</CardContent>
      </Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList>
            <TabsTrigger value="edit" className="focus:shadow-none">
              <Calendar className="mr-2 h-4 w-4" />
              Aanpassen
            </TabsTrigger>
            <TabsTrigger value="past" className="focus:shadow-none">
              <Clock className="mr-2 h-4 w-4" />
              Afgelopen wedstrijden
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-6">
            <EditMatchTabContent 
              isLoading={loading}
              upcomingMatches={matches}
              selectedMatch={selectedMatch}
              onSaveMatch={handleSaveMatch}
              onEditMatch={handleEditMatch}
              onCancelEdit={handleCancelEdit}
            />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <PastMatchesTabContent 
              isLoading={loading}
              pastMatches={matches.filter(m => m.homeScore !== null && m.id !== undefined).map(m => ({
                id: m.id!,
                date: m.date,
                time: m.time,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                location: m.location,
                homeScore: m.homeScore!,
                awayScore: m.awayScore!,
                referee: m.referee,
                uniqueNumber: m.uniqueNumber
              }))} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchTab;
