import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Download, Calendar, Clock, MapPin } from "lucide-react";
import { AIGeneratedSchedule, AdvancedCompetitionConfig } from "../types-advanced";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface PreviewImportTabProps {
  aiGeneratedSchedule: AIGeneratedSchedule | null;
  config: AdvancedCompetitionConfig;
  selectedTeams: number[];
  onImport: () => void;
  onPrevious: () => void;
}

const PreviewImportTab: React.FC<PreviewImportTabProps> = ({
  aiGeneratedSchedule,
  config,
  selectedTeams,
  onImport,
  onPrevious
}) => {
  if (!aiGeneratedSchedule) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen schema gegenereerd</h3>
          <p className="text-muted-foreground">
            Ga terug naar de vorige stap om een schema te genereren
          </p>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Terug naar Generatie
          </Button>
          <Button disabled>
            Schema Importeren
          </Button>
        </div>
      </div>
    );
  }

  const { matches, matchdays, validation_notes, confidence_score } = aiGeneratedSchedule;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Schema Voorvertoning</h3>
      </div>

      {/* Schema statistieken */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{matches.length}</div>
              <div className="text-sm text-muted-foreground">Totaal wedstrijden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{matchdays.length}</div>
              <div className="text-sm text-muted-foreground">Speeldagen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(confidence_score * 100)}%</div>
              <div className="text-sm text-muted-foreground">AI Betrouwbaarheid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{validation_notes.length}</div>
              <div className="text-sm text-muted-foreground">Opmerkingen</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={confidence_score >= 0.8 ? "default" : confidence_score >= 0.6 ? "secondary" : "destructive"}>
              {confidence_score >= 0.8 ? "Uitstekend" : confidence_score >= 0.6 ? "Goed" : "Verbetering mogelijk"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              AI betrouwbaarheidsscore: {Math.round(confidence_score * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Validatie opmerkingen */}
      {validation_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              AI Opmerkingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validation_notes.map((note, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-3 h-3 mt-1 text-purple-500 flex-shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Schema per speeldag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Speelschema</CardTitle>
          <CardDescription>
            Gegenereerd schema georganiseerd per speeldag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {matchdays.map((matchday, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary text-primary-foreground">
                    {matchday.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(matchday.date), 'EEEE dd MMMM yyyy', { locale: nl })} • {matchday.matches.length} wedstrijden
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
                      {matchday.matches.map((match, matchIndex) => (
                        <TableRow key={matchIndex}>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {match.match_time || '20:00'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{match.home_team_name}</span>
                              <Badge variant="secondary" className="text-xs">Thuis</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            <span className="text-muted-foreground">-</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{match.away_team_name}</span>
                              <Badge variant="outline" className="text-xs">Uit</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {match.location || 'TBD'}
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

      {/* Import acties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema Importeren</CardTitle>
          <CardDescription>
            Importeer het AI-gegenereerde schema naar je competitie database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Wat gebeurt er bij importeren?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Competitie wordt aangemaakt: "{config.name}"</li>
                <li>• {matchdays.length} speeldagen worden aangemaakt</li>
                <li>• {matches.length} wedstrijden worden ingepland</li>
                <li>• Alle team voorkeuren zijn meegenomen</li>
                <li>• Schema is direct beschikbaar in wedstrijdformulieren</li>
              </ul>
            </div>

            <Button onClick={onImport} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Schema Importeren
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Terug naar Generatie
        </Button>
        <Button onClick={onImport} variant="default">
          <CheckCircle className="w-4 h-4 mr-2" />
          Definitief Importeren
        </Button>
      </div>
    </div>
  );
};

export default PreviewImportTab;
