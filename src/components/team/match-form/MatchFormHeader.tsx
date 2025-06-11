import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Users, User, Save } from "lucide-react";
import { MatchFormData } from "./types";
import { useToast } from "@/hooks/use-toast";

interface MatchFormHeaderProps {
  selectedMatch: MatchFormData;
  onBackToOverview: () => void;
  hasElevatedPermissions?: boolean;
}

const MatchFormHeader: React.FC<MatchFormHeaderProps> = ({
  selectedMatch,
  onBackToOverview,
  hasElevatedPermissions = false
}) => {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(selectedMatch.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(selectedMatch.awayScore?.toString() || "");

  const handleSaveScore = () => {
    if (!hasElevatedPermissions) {
      toast({
        title: "Geen toegang",
        description: "U heeft geen rechten om scores in te vullen",
        variant: "destructive"
      });
      return;
    }

    if (!homeScore || !awayScore) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return;
    }

    // Here you would save the score to the backend
    toast({
      title: "Score opgeslagen",
      description: `${selectedMatch.homeTeamName} ${homeScore} - ${awayScore} ${selectedMatch.awayTeamName}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Wedstrijdformulier</h2>
        <Button variant="ghost" onClick={onBackToOverview}>
          Terug naar overzicht
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary text-white">
              {selectedMatch.uniqueNumber}
            </Badge>
            {selectedMatch.isCompleted ? (
              <Badge variant="secondary">Afgerond</Badge>
            ) : (
              <Badge variant="outline">Te spelen</Badge>
            )}
            {hasElevatedPermissions && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Verhoogde rechten
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg">
            {selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}
          </CardTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{selectedMatch.date} om {selectedMatch.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{selectedMatch.location}</span>
            </div>
            {selectedMatch.matchday && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{selectedMatch.matchday}</span>
              </div>
            )}
            {selectedMatch.referee && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{selectedMatch.referee}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Score invoeren</Label>
              {hasElevatedPermissions && (
                <Button 
                  onClick={handleSaveScore}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Score opslaan
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1">
                <Label htmlFor="homeScore" className="text-sm text-muted-foreground">
                  {selectedMatch.homeTeamName}
                </Label>
                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="text-center text-lg font-bold"
                  placeholder="0"
                  disabled={!hasElevatedPermissions}
                />
              </div>
              
              <div className="flex items-center justify-center py-6">
                <span className="text-2xl font-bold text-muted-foreground">-</span>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="awayScore" className="text-sm text-muted-foreground">
                  {selectedMatch.awayTeamName}
                </Label>
                <Input
                  id="awayScore"
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="text-center text-lg font-bold"
                  placeholder="0"
                  disabled={!hasElevatedPermissions}
                />
              </div>
            </div>
            
            {!hasElevatedPermissions && (
              <p className="text-sm text-muted-foreground mt-2">
                Alleen admin en scheidsrechters kunnen scores invoeren
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchFormHeader;
