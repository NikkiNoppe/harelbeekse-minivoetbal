
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { MatchFormData } from "./types";

interface MatchesListProps {
  matches: MatchFormData[];
  isLoading: boolean;
  onSelectMatch: (match: MatchFormData) => void;
}

const MatchesList: React.FC<MatchesListProps> = ({ 
  matches, 
  isLoading, 
  onSelectMatch 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMatches = matches.filter(match => 
    match.homeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.uniqueNumber.includes(searchTerm)
  );

  return (
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
        {isLoading ? (
          <div className="text-center py-4">Laden...</div>
        ) : filteredMatches.length > 0 ? (
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
                {filteredMatches.map((match) => (
                  <TableRow 
                    key={match.matchId} 
                    className="cursor-pointer" 
                    onClick={() => onSelectMatch(match)}
                  >
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
                        onSelectMatch(match);
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
            Geen wedstrijden gevonden die aan uw zoekcriteria voldoen.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchesList;
