
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, FormMenuItem, EditMatchForm, PastMatchesList } from "@/components/match/MatchComponents";
import { ClipboardEdit, Clock, Search, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Example match types for the different components
export interface MatchFormData {
  id?: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  homeScore?: number | null;
  awayScore?: number | null;
  referee?: string;
  notes?: string;
  uniqueNumber?: string; // Added unique number field
}

export interface PastMatch {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  location: string;
  referee: string;
  uniqueNumber?: string; // Added unique number field
}

const MatchTab: React.FC = () => {
  const [pastMatches, setPastMatches] = useState<PastMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchFormData[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all matches from Supabase
  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['allMatches'],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('matches')
          .select(`
            match_id,
            unique_number,
            match_date,
            result,
            referee_cost,
            field_cost,
            home_team:home_team_id(team_id, team_name),
            away_team:away_team_id(team_id, team_name)
          `)
          .order('match_date', { ascending: false });
        
        if (error) throw error;
        
        // Process the data into past and upcoming matches
        const past: PastMatch[] = [];
        const upcoming: MatchFormData[] = [];
        
        data.forEach(match => {
          const matchDate = new Date(match.match_date);
          const dateStr = matchDate.toLocaleDateString('nl-NL');
          const timeStr = matchDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          
          if (match.result) {
            // This is a past match with a result
            const [homeScore, awayScore] = match.result.split('-').map(score => parseInt(score.trim()));
            past.push({
              id: match.match_id,
              date: dateStr,
              homeTeam: match.home_team?.team_name || 'Onbekend',
              awayTeam: match.away_team?.team_name || 'Onbekend',
              homeScore,
              awayScore,
              location: 'Sporthal', // This would ideally come from the database
              referee: 'Admin', // This would ideally come from the database
              uniqueNumber: match.unique_number
            });
          } else {
            // This is an upcoming match
            upcoming.push({
              id: match.match_id,
              date: dateStr,
              time: timeStr,
              homeTeam: match.home_team?.team_name || 'Onbekend',
              awayTeam: match.away_team?.team_name || 'Onbekend',
              location: 'Sporthal', // This would ideally come from the database
              uniqueNumber: match.unique_number
            });
          }
        });
        
        setPastMatches(past);
        setUpcomingMatches(upcoming);
        return { past, upcoming };
      } catch (error) {
        console.error("Error fetching matches:", error);
        return { past: [], upcoming: [] };
      }
    }
  });

  const handleSaveMatch = (matchData: MatchFormData) => {
    console.log("Match saved:", matchData);
    
    // In a real app, we would update our backend
    // For now, we'll just update our local state
    
    if (matchData.homeScore !== undefined && matchData.awayScore !== undefined) {
      // This is a completed match, add to past matches
      if (matchData.id) {
        // Update existing past match
        setPastMatches(prev => prev.map(match => 
          match.id === matchData.id 
            ? { 
                ...match, 
                homeScore: matchData.homeScore || 0,
                awayScore: matchData.awayScore || 0,
                referee: matchData.referee || match.referee,
                uniqueNumber: matchData.uniqueNumber
              } 
            : match
        ));
        
        // Remove from upcoming matches if it was there
        setUpcomingMatches(prev => prev.filter(match => match.id !== matchData.id));
      } else {
        // Add new past match
        const newId = Math.max(0, ...pastMatches.map(m => m.id)) + 1;
        setPastMatches(prev => [...prev, {
          id: newId,
          date: matchData.date,
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          homeScore: matchData.homeScore || 0,
          awayScore: matchData.awayScore || 0,
          location: matchData.location,
          referee: matchData.referee || "Onbekend",
          uniqueNumber: matchData.uniqueNumber
        }]);
      }
    } else {
      // This is an upcoming match
      if (matchData.id) {
        // Update existing upcoming match
        setUpcomingMatches(prev => prev.map(match => 
          match.id === matchData.id ? matchData : match
        ));
      } else {
        // Add new upcoming match
        const newId = Math.max(
          0, 
          ...pastMatches.map(m => m.id),
          ...upcomingMatches.map(m => m.id || 0)
        ) + 1;
        setUpcomingMatches(prev => [...prev, {
          ...matchData,
          id: newId
        }]);
      }
    }
    
    setSelectedMatch(null);
  };

  const handleEditMatch = (match: MatchFormData) => {
    setSelectedMatch(match);
  };
  
  // Filter matches based on search term
  const filteredUpcomingMatches = upcomingMatches.filter(match => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      match.homeTeam.toLowerCase().includes(term) ||
      match.awayTeam.toLowerCase().includes(term) ||
      match.date.toLowerCase().includes(term) ||
      (match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new-match">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-match" className="flex items-center gap-2">
            <ClipboardEdit className="h-4 w-4" />
            Nieuw wedstrijdformulier
          </TabsTrigger>
          <TabsTrigger value="past-matches" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Afgelopen wedstrijden
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-match" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijdformulier</CardTitle>
              <CardDescription>
                Vul het wedstrijdformulier in voor een nieuwe of komende wedstrijd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditMatchForm 
                initialData={selectedMatch || {
                  date: "",
                  time: "",
                  homeTeam: "",
                  awayTeam: "",
                  location: "",
                }}
                onSave={handleSaveMatch}
                onCancel={() => setSelectedMatch(null)}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Aankomende wedstrijden</CardTitle>
              <CardDescription>
                Selecteer een wedstrijd om te bewerken of een score in te voeren
              </CardDescription>
              
              <div className="mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Zoek op team, datum of wedstrijdcode..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <FormMessage>Wedstrijden laden...</FormMessage>
                ) : filteredUpcomingMatches.length === 0 ? (
                  <FormMessage>Er zijn geen aankomende wedstrijden.</FormMessage>
                ) : (
                  <div className="grid gap-2">
                    {filteredUpcomingMatches.map((match) => (
                      <FormMenuItem
                        key={match.id}
                        title={
                          <div className="flex items-center gap-2">
                            {match.uniqueNumber && (
                              <Badge variant="outline" className="bg-primary text-white">
                                {match.uniqueNumber}
                              </Badge>
                            )}
                            <span>{match.homeTeam} vs {match.awayTeam}</span>
                          </div>
                        }
                        subtitle={`${match.date} ${match.time} - ${match.location}`}
                        onClick={() => handleEditMatch(match)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past-matches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Afgelopen wedstrijden</CardTitle>
              <CardDescription>
                Overzicht van alle gespeelde wedstrijden en resultaten
              </CardDescription>
              
              <div className="flex flex-col md:flex-row gap-2 mt-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Zoek op team of wedstrijdcode..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-1">
                  <ListFilter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <FormMessage>Wedstrijden laden...</FormMessage>
              ) : pastMatches.length === 0 ? (
                <FormMessage>Er zijn nog geen afgelopen wedstrijden.</FormMessage>
              ) : (
                <PastMatchesList matches={pastMatches} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchTab;
