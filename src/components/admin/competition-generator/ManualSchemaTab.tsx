
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ParsedMatch {
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
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
      // Create manual competition schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('manual_competition_schedules')
        .insert({
          name: competitionName,
          schema_text: schemaText,
          parsed_data: parsedMatches,
          status: 'processed'
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Get team IDs
      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name');

      const teamMap = new Map(teams?.map(t => [t.team_name, t.team_id]) || []);

      // Create matches in the database
      const matchesToInsert = parsedMatches.map(match => ({
        schedule_id: schedule.schedule_id,
        home_team_id: teamMap.get(match.homeTeam) || null,
        away_team_id: teamMap.get(match.awayTeam) || null,
        match_date: match.date,
        match_time: match.time,
        matchday: match.matchday,
        notes: `Venue: ${match.venue}`
      }));

      const { error: matchesError } = await supabase
        .from('manual_schedule_matches')
        .insert(matchesToInsert);

      if (matchesError) throw matchesError;

      toast.success("Schema succesvol aangemaakt!");
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
            <CardTitle>Geparste Wedstrijden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {parsedMatches.map((match, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Speeldag {match.matchday}</span>
                  <span>{match.homeTeam} vs {match.awayTeam}</span>
                  <span className="text-sm text-muted-foreground">
                    {match.date} {match.time} - {match.venue}
                  </span>
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
