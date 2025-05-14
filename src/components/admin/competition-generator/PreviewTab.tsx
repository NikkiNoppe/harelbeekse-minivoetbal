
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { GeneratedMatch, CompetitionFormat } from "@/components/admin/competition-generator/types";

interface PreviewTabProps {
  generatedMatches: GeneratedMatch[];
  competitionName: string;
  selectedTeams: number[];
  competitionFormat: CompetitionFormat | undefined;
  selectedDates: number[];
  isCreating: boolean;
  onSaveCompetition: () => void;
  onRegenerateSchedule: () => void;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  generatedMatches,
  competitionName,
  selectedTeams,
  competitionFormat,
  selectedDates,
  isCreating,
  onSaveCompetition,
  onRegenerateSchedule
}) => {
  
  if (generatedMatches.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Voorvertoning Competitieschema</h3>
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">
            Nog geen competitieschema gegenereerd. Ga naar het tabblad "Speeldagen" en klik op "Schema Genereren".
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Voorvertoning Competitieschema</h3>
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Competitiedetails</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Naam</dt>
                <dd>{competitionName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Teams</dt>
                <dd>{selectedTeams.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Format</dt>
                <dd>{competitionFormat?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Wedstrijden</dt>
                <dd>{generatedMatches.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Speeldagen</dt>
                <dd>{selectedDates.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Speeldag</TableHead>
              <TableHead>Thuisploeg</TableHead>
              <TableHead className="text-center">vs</TableHead>
              <TableHead>Uitploeg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generatedMatches.map((match, index) => (
              <TableRow key={index}>
                <TableCell>Speeldag {match.matchday}</TableCell>
                <TableCell>{match.home_team_name}</TableCell>
                <TableCell className="text-center">vs</TableCell>
                <TableCell>{match.away_team_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={onRegenerateSchedule}>
          Opnieuw Genereren
        </Button>
        <Button 
          variant="default" 
          onClick={onSaveCompetition} 
          disabled={isCreating}
        >
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Competitie Aanmaken
        </Button>
      </div>
    </div>
  );
};

export default PreviewTab;
