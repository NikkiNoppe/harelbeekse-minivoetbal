
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MatchesFormMessage } from "./components/MatchesFormMessage";
import { MatchesFormMenuItem } from "./components/MatchesFormMenuItem";
import { MatchesEditForm } from "./components/MatchesEditForm";
import { MatchFormData } from "./types/matchesTypes";

interface EditMatchTabContentProps {
  isLoading: boolean;
  upcomingMatches: MatchFormData[];
  selectedMatch: MatchFormData | null;
  onSaveMatch: (data: MatchFormData) => void;
  onEditMatch: (match: MatchFormData) => void;
  onCancelEdit: () => void;
}

export const EditMatchTabContent: React.FC<EditMatchTabContentProps> = ({
  isLoading,
  upcomingMatches,
  selectedMatch,
  onSaveMatch,
  onEditMatch,
  onCancelEdit
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Filter matches based on search term and date filter
  const filteredUpcomingMatches = upcomingMatches.filter(match => {
    // Always apply the search term filter if present
    const termMatch = !searchTerm ? true : (
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Apply date filter if present
    const dateMatch = !dateFilter ? true : match.date.includes(dateFilter);
    
    return termMatch && dateMatch;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijdformulier</CardTitle>
          <CardDescription>
            Selecteer een wedstrijd uit de lijst hieronder om het wedstrijdformulier in te vullen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchesEditForm 
            initialData={selectedMatch || {
              date: "",
              time: "",
              homeTeam: "",
              awayTeam: "",
              location: "",
            }}
            onSave={onSaveMatch}
            onCancel={onCancelEdit}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aankomende wedstrijden</CardTitle>
          <CardDescription>
            Wedstrijden worden aangemaakt tijdens de competitie-setup en hebben een uniek wedstrijdnummer
          </CardDescription>
          
          <div className="mt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Zoek op wedstrijdnummer, team of locatie..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Filter op datum"
                className="pl-8"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <MatchesFormMessage>Wedstrijden laden...</MatchesFormMessage>
            ) : filteredUpcomingMatches.length === 0 ? (
              <MatchesFormMessage>Er zijn geen aankomende wedstrijden die aan uw zoekcriteria voldoen.</MatchesFormMessage>
            ) : (
              <div className="grid gap-2">
                {filteredUpcomingMatches.map((match) => (
                  <MatchesFormMenuItem
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
                    onClick={() => onEditMatch(match)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
