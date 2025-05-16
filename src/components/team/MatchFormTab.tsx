
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { CalendarIcon, ListFilter, Search, ClipboardList, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import PlayerSelectionForm from "./PlayerSelectionForm";

interface MatchFormData {
  matchId: number;
  uniqueNumber: string;
  date: string;
  time: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  location: string;
  isHomeTeam: boolean;
}

interface PlayerData {
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
  isCaptain: boolean;
}

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  
  // Fetch upcoming matches for the team
  const { data: upcomingMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['upcomingTeamMatches', teamId],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get matches where this team is either home or away team and the match date is in the future
        const { data, error } = await supabase
          .from('matches')
          .select(`
            match_id,
            unique_number,
            match_date,
            home_team_id,
            away_team_id,
            matchday_id,
            home_team:teams!home_team_id(team_id, team_name),
            away_team:teams!away_team_id(team_id, team_name)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gte('match_date', today)
          .order('match_date', { ascending: true })
          .limit(10);
        
        if (error) throw error;
        
        // Type casting to ensure we correctly access the nested properties
        return data.map(match => {
          // Safely extract team information from the nested properties
          const homeTeam = match.home_team as { team_id: number, team_name: string } | null;
          const awayTeam = match.away_team as { team_id: number, team_name: string } | null;
          
          return {
            matchId: match.match_id,
            uniqueNumber: match.unique_number || 'N/A',
            date: new Date(match.match_date).toLocaleDateString('nl-NL'),
            time: new Date(match.match_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            homeTeamId: homeTeam?.team_id || 0,
            homeTeamName: homeTeam?.team_name || 'Onbekend',
            awayTeamId: awayTeam?.team_id || 0,
            awayTeamName: awayTeam?.team_name || 'Onbekend',
            location: 'Sporthal',  // This would ideally come from the database
            isHomeTeam: match.home_team_id === teamId
          };
        });
      } catch (error) {
        console.error("Error fetching upcoming matches:", error);
        toast({
          title: "Fout bij ophalen wedstrijden",
          description: "Er is een probleem opgetreden bij het ophalen van de aankomende wedstrijden.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Function to get the next match for the team
  const getNextMatch = () => {
    if (!upcomingMatches || upcomingMatches.length === 0) return null;
    return upcomingMatches[0]; // The first match is the next one since they're ordered by date
  };

  // Handle the selection of a match for the form
  const handleSelectMatch = (match: MatchFormData) => {
    setSelectedMatchForm(match);
  };

  // Render the next match suggestion
  const renderNextMatchSuggestion = () => {
    const nextMatch = getNextMatch();
    if (!nextMatch) return null;
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Eerstvolgende Wedstrijd
          </CardTitle>
          <CardDescription>
            Selecteer deze wedstrijd om direct naar het formulier te gaan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
               onClick={() => handleSelectMatch(nextMatch)}>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <p className="font-medium text-lg">{nextMatch.homeTeamName} vs {nextMatch.awayTeamName}</p>
                <p className="text-sm text-muted-foreground">
                  {nextMatch.date} om {nextMatch.time} - {nextMatch.location}
                </p>
              </div>
              <div>
                <Badge variant="outline" className="bg-primary text-white">
                  {nextMatch.uniqueNumber}
                </Badge>
                <p className="text-xs mt-1 text-muted-foreground">
                  {nextMatch.isHomeTeam ? "Thuiswedstrijd" : "Uitwedstrijd"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // If a match form is selected, render the player selection form
  if (selectedMatchForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Wedstrijdformulier</h2>
          <Button variant="ghost" onClick={() => setSelectedMatchForm(null)}>
            Terug naar overzicht
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit bg-primary text-white">
              {selectedMatchForm.uniqueNumber}
            </Badge>
            <CardTitle className="mt-2">
              {selectedMatchForm.homeTeamName} vs {selectedMatchForm.awayTeamName}
            </CardTitle>
            <CardDescription>
              {selectedMatchForm.date} om {selectedMatchForm.time} - {selectedMatchForm.location}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerSelectionForm
              matchId={selectedMatchForm.matchId}
              teamId={teamId}
              teamName={teamName}
              isHomeTeam={selectedMatchForm.isHomeTeam}
              onComplete={() => setSelectedMatchForm(null)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Aankomende wedstrijden
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Ingevulde formulieren
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {renderNextMatchSuggestion()}
          
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijden</CardTitle>
              <CardDescription>
                Selecteer een wedstrijd om het formulier in te vullen
              </CardDescription>
              
              <div className="mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Zoek op team of datum..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="text-center py-4">Laden...</div>
              ) : upcomingMatches && upcomingMatches.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Wedstrijd</TableHead>
                        <TableHead className="text-right">Actie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingMatches
                        .filter(match => 
                          match.homeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.uniqueNumber.includes(searchTerm)
                        )
                        .map((match) => (
                          <TableRow key={match.matchId} className="cursor-pointer" onClick={() => handleSelectMatch(match)}>
                            <TableCell>
                              <Badge variant="outline">{match.uniqueNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              {match.date} <span className="text-xs text-muted-foreground">{match.time}</span>
                            </TableCell>
                            <TableCell>
                              <span className={match.isHomeTeam ? "font-medium" : ""}>
                                {match.homeTeamName}
                              </span>
                              {" vs "}
                              <span className={!match.isHomeTeam ? "font-medium" : ""}>
                                {match.awayTeamName}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMatch(match);
                              }}>
                                Formulier
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  Geen aankomende wedstrijden gevonden.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingevulde Formulieren</CardTitle>
              <CardDescription>
                Overzicht van alle ingevulde wedstrijdformulieren
              </CardDescription>
              
              <div className="flex flex-col md:flex-row gap-2 mt-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Zoek op team of wedstrijdcode..."
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-1">
                  <ListFilter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Geen ingevulde formulieren gevonden.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchFormTab;
