
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Save, RefreshCw, Clock, MapPin } from "lucide-react";
import { GeneratedMatch } from "./types";
import { predefinedFormats } from "./competitionFormats";

interface PreviewTabProps {
  generatedMatches: GeneratedMatch[];
  competitionName: string;
  selectedDates: number[];
  competitionFormat?: typeof predefinedFormats[0];
  isCreating: boolean;
  onSaveCompetition: () => void;
  onRegenerateSchedule: () => void;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  generatedMatches,
  competitionName,
  selectedDates,
  competitionFormat,
  isCreating,
  onSaveCompetition,
  onRegenerateSchedule,
}) => {
  if (generatedMatches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Geen wedstrijden gegenereerd. Ga naar de vorige stap om een schema te genereren.
        </p>
        <Button onClick={onRegenerateSchedule} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Schema genereren
        </Button>
      </div>
    );
  }

  // Group matches by matchday
  const matchesByMatchday = generatedMatches.reduce((acc, match) => {
    const matchdayKey = `Speeldag ${match.matchday}`;
    if (!acc[matchdayKey]) {
      acc[matchdayKey] = [];
    }
    acc[matchdayKey].push(match);
    return acc;
  }, {} as Record<string, GeneratedMatch[]>);

  return (
    <div className="space-y-6">
      {/* Competition Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {competitionName}
          </CardTitle>
          <CardDescription>
            {competitionFormat?.name} • {generatedMatches.length} wedstrijden • {Object.keys(matchesByMatchday).length} speeldagen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{generatedMatches.length}</div>
              <div className="text-sm text-muted-foreground">Totaal wedstrijden</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Object.keys(matchesByMatchday).length}</div>
              <div className="text-sm text-muted-foreground">Speeldagen</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{competitionFormat?.name}</div>
              <div className="text-sm text-muted-foreground">Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches by Matchday */}
      {Object.entries(matchesByMatchday).map(([matchday, matches]) => (
        <Card key={matchday}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary text-primary-foreground">
                {matchday}
              </Badge>
              <span className="text-lg">{matches.length} wedstrijden</span>
            </CardTitle>
            {matches[0]?.match_date && (
              <CardDescription className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {new Date(matches[0].match_date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Code</TableHead>
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
                        <Badge variant="outline" className="bg-primary text-primary-foreground font-mono">
                          {match.unique_code || `${String(match.matchday).padStart(2, '0')}${String(index + 1).padStart(2, '0')}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {match.match_time && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {match.match_time}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.home_team}</span>
                          <Badge variant="secondary" size="sm">Thuis</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.away_team}</span>
                          <Badge variant="outline" size="sm">Uit</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.location && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {match.location}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={onRegenerateSchedule}
          disabled={isCreating}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Schema opnieuw genereren
        </Button>
        
        <Button 
          onClick={onSaveCompetition}
          disabled={isCreating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isCreating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Competitie opslaan
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PreviewTab;
