
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users } from "lucide-react";
import { MatchFormData } from "./types";

interface MatchFormListProps {
  matches: MatchFormData[];
  isLoading: boolean;
  onSelectMatch: (match: MatchFormData) => void;
  searchTerm: string;
  dateFilter: string;
  locationFilter: string;
}

// Mock data for demonstration
const MOCK_MATCHES: MatchFormData[] = [
  {
    matchId: 1,
    uniqueNumber: "0901",
    date: "2024-01-15",
    time: "20:00",
    homeTeamId: 1,
    homeTeamName: "FC Tigers",
    awayTeamId: 2,
    awayTeamName: "Sporting Lions",
    location: "Sporthal Centrum",
    isHomeTeam: true,
    matchday: "Speeldag 9",
    referee: "Jan Janssen",
    homeScore: 3,
    awayScore: 1,
    isCompleted: true
  },
  {
    matchId: 2,
    uniqueNumber: "1002",
    date: "2024-01-22",
    time: "18:30",
    homeTeamId: 3,
    homeTeamName: "Eagles United",
    awayTeamId: 1,
    awayTeamName: "FC Tigers",
    location: "Sporthal Noord",
    isHomeTeam: false,
    matchday: "Speeldag 10",
    referee: "Piet Peters",
    isCompleted: false
  },
  {
    matchId: 3,
    uniqueNumber: "1003",
    date: "2024-01-29",
    time: "19:15",
    homeTeamId: 1,
    homeTeamName: "FC Tigers",
    awayTeamId: 4,
    awayTeamName: "Thunder Wolves",
    location: "Sporthal Oost",
    isHomeTeam: true,
    matchday: "Speeldag 10",
    referee: "Maria de Vries",
    isCompleted: false
  }
];

const MatchFormList: React.FC<MatchFormListProps> = ({
  matches,
  isLoading,
  onSelectMatch,
  searchTerm,
  dateFilter,
  locationFilter
}) => {
  // Use mock data for now, filter based on search criteria
  const allMatches = MOCK_MATCHES;
  
  const filteredMatches = allMatches.filter(match => {
    const matchesSearch = !searchTerm || 
      match.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.homeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || match.date.includes(dateFilter);
    
    const matchesLocation = !locationFilter || 
      match.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesDate && matchesLocation;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Wedstrijden laden...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredMatches.map((match) => (
        <Card 
          key={match.matchId} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectMatch(match)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-primary text-white">
                    {match.uniqueNumber}
                  </Badge>
                  {match.isCompleted ? (
                    <Badge variant="secondary">Afgerond</Badge>
                  ) : (
                    <Badge variant="outline">Te spelen</Badge>
                  )}
                </div>
                
                <div className="font-medium text-lg mb-1">
                  <span className={match.isHomeTeam ? "font-bold" : ""}>
                    {match.homeTeamName}
                  </span>
                  {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                    <span className="mx-2 font-bold text-primary">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  ) : (
                    <span className="mx-2">vs</span>
                  )}
                  <span className={!match.isHomeTeam ? "font-bold" : ""}>
                    {match.awayTeamName}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {match.date} om {match.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {match.matchday}
                  </div>
                </div>
                
                {match.referee && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Scheidsrechter: {match.referee}
                  </div>
                )}
              </div>
              
              <Button 
                size="sm"
                variant={match.isCompleted ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatch(match);
                }}
              >
                {match.isCompleted ? "Bekijken" : "Invullen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {filteredMatches.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Geen wedstrijden gevonden die aan uw zoekcriteria voldoen.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchFormList;
