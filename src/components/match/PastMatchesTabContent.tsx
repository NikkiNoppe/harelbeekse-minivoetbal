
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ListFilter } from "lucide-react";
import { FormMessage, PastMatchesList } from "@/components/match/MatchComponents";
import { PastMatch } from "./types";

interface PastMatchesTabContentProps {
  isLoading: boolean;
  pastMatches: PastMatch[];
}

export const PastMatchesTabContent: React.FC<PastMatchesTabContentProps> = ({
  isLoading,
  pastMatches
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter past matches based on search term
  const filteredPastMatches = pastMatches.filter(match => {
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
        ) : filteredPastMatches.length === 0 ? (
          <FormMessage>Er zijn nog geen afgelopen wedstrijden.</FormMessage>
        ) : (
          <PastMatchesList matches={filteredPastMatches} />
        )}
      </CardContent>
    </Card>
  );
};
