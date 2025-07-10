import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Trophy } from "lucide-react";
import { cupService } from "@/services/cupService";
import { teamService, Team } from "@/services/teamService";

const CupWinnerAdvancement: React.FC = () => {
  const [completedMatches, setCompletedMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cupData, teamsData] = await Promise.all([
        cupService.getCupMatches(),
        teamService.getAllTeams()
      ]);

      // Find completed matches that have scores but might need winner advancement
      const completed = [
        ...cupData.achtste_finales,
        ...cupData.kwartfinales,
        ...cupData.halve_finales
      ].filter(match => 
        match.is_submitted && 
        match.home_score !== null && 
        match.away_score !== null &&
        match.home_score !== match.away_score // No draws
      );

      setCompletedMatches(completed);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getWinner = (match: any) => {
    if (match.home_score > match.away_score) {
      return { teamId: match.home_team_id, teamName: match.home_team_name };
    } else if (match.away_score > match.home_score) {
      return { teamId: match.away_team_id, teamName: match.away_team_name };
    }
    return null;
  };

  const getNextRound = (uniqueNumber: string) => {
    if (uniqueNumber.startsWith('1/8-')) {
      const matchNum = parseInt(uniqueNumber.split('-')[1]);
      return `QF-${Math.ceil(matchNum / 2)}`;
    } else if (uniqueNumber.startsWith('QF-')) {
      const matchNum = parseInt(uniqueNumber.split('-')[1]);
      return `SF-${Math.ceil(matchNum / 2)}`;
    } else if (uniqueNumber.startsWith('SF-')) {
      return 'FINAL';
    }
    return null;
  };

  const handleAdvanceWinner = async () => {
    if (!selectedMatch || !selectedWinner) {
      toast({
        title: "Onvolledige selectie",
        description: "Selecteer zowel een wedstrijd als een winnaar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const match = completedMatches.find(m => m.match_id.toString() === selectedMatch);
      if (!match) return;

      const nextRound = getNextRound(match.unique_number);
      if (!nextRound) {
        toast({
          title: "Geen volgende ronde",
          description: "Deze wedstrijd heeft geen volgende ronde",
          variant: "destructive"
        });
        return;
      }

      const result = await cupService.advanceWinner(
        parseInt(selectedMatch),
        parseInt(selectedWinner),
        nextRound
      );

      if (result.success) {
        toast({
          title: "Succes!",
          description: result.message,
        });
        await loadData();
        setSelectedMatch("");
        setSelectedWinner("");
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMatchData = completedMatches.find(m => m.match_id.toString() === selectedMatch);
  const winner = selectedMatchData ? getWinner(selectedMatchData) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Winnaar Doorschuiven
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Schuif winnaars handmatig door naar de volgende ronde van het bekertoernooi.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Voltooide Wedstrijd</label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een voltooide wedstrijd" />
                </SelectTrigger>
                <SelectContent>
                  {completedMatches.map((match) => {
                    const winner = getWinner(match);
                    return (
                      <SelectItem key={match.match_id} value={match.match_id.toString()}>
                        {match.unique_number}: {match.home_team_name} {match.home_score}-{match.away_score} {match.away_team_name}
                        {winner && ` (🏆 ${winner.teamName})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedMatchData && (
              <div>
                <label className="text-sm font-medium">Winnaar</label>
                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bevestig de winnaar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedMatchData.home_team_id.toString()}>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {selectedMatchData.home_team_name} ({selectedMatchData.home_score})
                      </div>
                    </SelectItem>
                    <SelectItem value={selectedMatchData.away_team_id.toString()}>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {selectedMatchData.away_team_name} ({selectedMatchData.away_score})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedMatchData && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Volgende ronde:</strong> {getNextRound(selectedMatchData.unique_number)}
                </p>
                {winner && (
                  <p className="text-sm">
                    <strong>Automatisch gedetecteerde winnaar:</strong> {winner.teamName}
                  </p>
                )}
              </div>
            )}

            <Button 
              onClick={handleAdvanceWinner}
              disabled={!selectedMatch || !selectedWinner || isLoading}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {isLoading ? "Doorschuiven..." : "Winnaar Doorschuiven"}
            </Button>
          </div>

          {completedMatches.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Geen voltooide wedstrijden gevonden
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CupWinnerAdvancement; 