
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertCircle, CheckCircle, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ParsedMatch {
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  [key: string]: string | number;
}

interface ManualSchemaTabProps {
  onSchemaImported: (matches: ParsedMatch[]) => void;
}

const ManualSchemaTab: React.FC<ManualSchemaTabProps> = ({ onSchemaImported }) => {
  const [schemaText, setSchemaText] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const exampleSchema = `Speeldag 1 - 2024-02-10
18:30 Team A vs Team B (Sportpark Noord)
19:30 Team C vs Team D (Sportpark Zuid)
20:30 Team E vs Team F (Sportpark Noord)

Speeldag 2 - 2024-02-17
18:30 Team B vs Team C (Sportpark Zuid)
19:30 Team D vs Team E (Sportpark Noord)
20:30 Team F vs Team A (Sportpark Zuid)`;

  const parseSchema = () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    try {
      const lines = schemaText.split('\n').filter(line => line.trim());
      const matches: ParsedMatch[] = [];
      let currentMatchday = 0;
      let currentDate = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if it's a matchday header
        const matchdayMatch = trimmedLine.match(/Speeldag (\d+) - (\d{4}-\d{2}-\d{2})/);
        if (matchdayMatch) {
          currentMatchday = parseInt(matchdayMatch[1]);
          currentDate = matchdayMatch[2];
          continue;
        }
        
        // Check if it's a match line
        const matchMatch = trimmedLine.match(/(\d{2}:\d{2}) (.+) vs (.+) \((.+)\)/);
        if (matchMatch) {
          const [, time, homeTeam, awayTeam, venue] = matchMatch;
          matches.push({
            matchday: currentMatchday,
            homeTeam: homeTeam.trim(),
            awayTeam: awayTeam.trim(),
            date: currentDate,
            time,
            venue: venue.trim()
          });
        }
      }
      
      if (matches.length === 0) {
        setValidationErrors(['Geen wedstrijden gevonden in het schema. Controleer het formaat.']);
      } else {
        setParsedMatches(matches);
        toast.success(`${matches.length} wedstrijden succesvol geparst!`);
      }
    } catch (error) {
      setValidationErrors(['Fout bij het parsen van het schema. Controleer het formaat.']);
    }
    
    setIsValidating(false);
  };

  const createSchedule = async () => {
    if (!competitionName.trim() || parsedMatches.length === 0) {
      toast.error("Vul een competitienaam in en zorg dat er wedstrijden zijn geparst.");
      return;
    }

    setIsCreating(true);
    
    try {
      // Convert ParsedMatch[] to Json-compatible format
      const jsonCompatibleMatches = parsedMatches.map(match => ({
        matchday: match.matchday,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        date: match.date,
        time: match.time,
        venue: match.venue
      }));

      // First, create a competition
      const { data: competition, error: competitionError } = await supabase
        .from('competitions')
        .insert({
          name: competitionName,
          start_date: parsedMatches[0]?.date,
          end_date: parsedMatches[parsedMatches.length - 1]?.date,
          is_playoff: false
        })
        .select()
        .single();

      if (competitionError) throw competitionError;

      // Get team IDs
      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name');

      const teamMap = new Map(teams?.map(t => [t.team_name, t.team_id]) || []);

      // Create matches directly in the matches table with speeldag
      const matchesToInsert = parsedMatches.map(match => {
        const matchDateTime = new Date(`${match.date}T${match.time}:00`);
        return {
          home_team_id: teamMap.get(match.homeTeam) || null,
          away_team_id: teamMap.get(match.awayTeam) || null,
          match_date: matchDateTime.toISOString(),
          speeldag: `Speeldag ${match.matchday}`, // Use speeldag directly
          location: match.venue,
          is_cup_match: false,
          field_cost: 50.00,
          referee_cost: 25.00,
          result: null
        };
      });

      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (matchesError) throw matchesError;

      // Create manual competition schedule record for tracking
      const { error: scheduleError } = await supabase
        .from('manual_competition_schedules')
        .insert({
          name: competitionName,
          schema_text: schemaText,
          parsed_data: jsonCompatibleMatches,
          status: 'processed',
          competition_id: competition.competition_id
        });

      if (scheduleError) throw scheduleError;

      toast.success("Schema succesvol aangemaakt en wedstrijden zijn beschikbaar in wedstrijdformulieren!");
      onSchemaImported(parsedMatches);
      
      // Reset form
      setSchemaText("");
      setCompetitionName("");
      setParsedMatches([]);
      
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error("Fout bij het aanmaken van het schema.");
    }
    
    setIsCreating(false);
  };

  // Group matches by matchday for preview
  const matchesByMatchday = parsedMatches.reduce((acc, match) => {
    const matchdayKey = `Speeldag ${match.matchday}`;
    if (!acc[matchdayKey]) {
      acc[matchdayKey] = [];
    }
    acc[matchdayKey].push(match);
    return acc;
  }, {} as Record<string, ParsedMatch[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Handmatig Schema Importeren
          </CardTitle>
          <CardDescription>
            Importeer een volledig competitieschema vanuit tekst (bijvoorbeeld van ChatGPT)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="competitionName">Competitienaam</Label>
            <Input
              id="competitionName"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="Bijv. Winter Competitie 2024"
            />
          </div>

          <div>
            <Label htmlFor="schema">Schema Tekst</Label>
            <Textarea
              id="schema"
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              placeholder="Plak hier je schema..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={parseSchema} 
              disabled={!schemaText.trim() || isValidating}
              variant="outline"
            >
              {isValidating ? "Valideren..." : "Valideer Schema"}
            </Button>
            <Button 
              onClick={createSchedule}
              disabled={parsedMatches.length === 0 || !competitionName.trim() || isCreating}
            >
              {isCreating ? "Aanmaken..." : "Schema Aanmaken"}
            </Button>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsedMatches.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Schema gevalideerd! {parsedMatches.length} wedstrijden gevonden over {Math.max(...parsedMatches.map(m => m.matchday))} speeldagen.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Voorbeeld Formaat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
            {exampleSchema}
          </pre>
          <p className="text-sm text-muted-foreground mt-2">
            Gebruik dit formaat voor je schema. Elke speeldag begint met "Speeldag X - YYYY-MM-DD" 
            gevolgd door wedstrijden in het formaat "HH:MM Team1 vs Team2 (Locatie)".
          </p>
        </CardContent>
      </Card>

      {parsedMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voorvertoning Wedstrijden</CardTitle>
            <CardDescription>
              {parsedMatches.length} wedstrijden over {Object.keys(matchesByMatchday).length} speeldagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(matchesByMatchday).map(([matchday, matches]) => (
                <div key={matchday} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-900">
                      {matchday}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {matches[0]?.date} • {matches.length} wedstrijden
                    </span>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Tijd</TableHead>
                          <TableHead>Thuisteam</TableHead>
                          <TableHead className="text-center w-16">VS</TableHead>
                          <TableHead>Uitteam</TableHead>
                          <TableHead className="w-48">Locatie</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                {match.time}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{match.homeTeam}</span>
                                <Badge className="badge-purple">Thuis</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              <span className="text-muted-foreground">-</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{match.awayTeam}</span>
                                <Badge className="badge-purple">Uit</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {match.venue}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManualSchemaTab;
