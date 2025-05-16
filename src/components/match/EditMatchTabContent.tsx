
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { FormMessage, FormMenuItem, EditMatchForm } from "@/components/match/MatchComponents";
import { Badge } from "@/components/ui/badge";
import { MatchFormData } from "./types";

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
    <>
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
            onSave={onSaveMatch}
            onCancel={onCancelEdit}
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
