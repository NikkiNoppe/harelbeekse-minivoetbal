
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "./types";
import { updateMatchForm, lockMatchForm } from "./matchFormService";
import { Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_TEAM_PLAYERS } from "@/data/mockData";

interface CompactMatchFormProps {
  match: MatchFormData;
  onComplete: () => void;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
}

// Mock referees data
const MOCK_REFEREES = [
  { id: 1, name: "Jan Janssen" },
  { id: 2, name: "Marie Pieters" },
  { id: 3, name: "Tom Van Der Berg" },
  { id: 4, name: "Lisa Vermeulen" }
];

const CompactMatchForm: React.FC<CompactMatchFormProps> = ({
  match,
  onComplete,
  isAdmin,
  isReferee,
  teamId
}) => {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [selectedReferee, setSelectedReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [playerCards, setPlayerCards] = useState<Record<number, string>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<Record<number, { selected: boolean, jerseyNumber: string, isCaptain: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;
  const isTeamManager = !isAdmin && !isReferee;
  const canEditMatchData = isReferee || isAdmin;
  
  // Get players for home and away teams
  const homeTeamPlayers = MOCK_TEAM_PLAYERS[match.homeTeamId as keyof typeof MOCK_TEAM_PLAYERS] || [];
  const awayTeamPlayers = MOCK_TEAM_PLAYERS[match.awayTeamId as keyof typeof MOCK_TEAM_PLAYERS] || [];
  
  // Determine which team's players the current user can edit
  const userTeamPlayers = teamId === match.homeTeamId ? homeTeamPlayers : 
                          teamId === match.awayTeamId ? awayTeamPlayers : [];

  const handleCardChange = (playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  };

  const handlePlayerSelection = (playerId: number, field: 'selected' | 'jerseyNumber' | 'isCaptain', value: boolean | string) => {
    setSelectedPlayers(prev => {
      const updated = {
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [field]: value
        }
      };
      
      // If setting captain to true, unset all other captains
      if (field === 'isCaptain' && value === true) {
        Object.keys(updated).forEach(id => {
          if (parseInt(id) !== playerId) {
            updated[parseInt(id)] = { ...updated[parseInt(id)], isCaptain: false };
          }
        });
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Validation logic based on user role
    if (isTeamManager) {
      const selectedCount = Object.values(selectedPlayers).filter(p => p.selected).length;
      if (selectedCount === 0) {
        toast({
          title: "Geen spelers geselecteerd",
          description: "Selecteer ten minste één speler voor het formulier.",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedCount > 8) {
        toast({
          title: "Te veel spelers",
          description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
          variant: "destructive"
        });
        return;
      }

      const invalidPlayers = Object.entries(selectedPlayers).filter(([_, player]) => 
        player.selected && (!player.jerseyNumber || player.jerseyNumber.trim() === "")
      );
      
      if (invalidPlayers.length > 0) {
        toast({
          title: "Rugnummers ontbreken",
          description: "Alle geselecteerde spelers moeten een rugnummer hebben.",
          variant: "destructive"
        });
        return;
      }
    }

    if (canEditMatchData && (!homeScore || !awayScore)) {
      toast({
        title: "Fout",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: canEditMatchData ? parseInt(homeScore) : match.homeScore,
        awayScore: canEditMatchData ? parseInt(awayScore) : match.awayScore,
        referee: selectedReferee,
        refereeNotes,
        isCompleted: canEditMatchData ? true : match.isCompleted,
        playersSubmitted: isTeamManager ? true : match.playersSubmitted
      };

      await updateMatchForm(updatedMatch);
      
      if (isReferee && !match.isLocked) {
        await lockMatchForm(match.matchId);
        updatedMatch.isLocked = true;
      }
      
      toast({
        title: isReferee ? "Formulier vergrendeld" : "Opgeslagen",
        description: isReferee 
          ? "Het wedstrijdformulier is definitief afgesloten."
          : isTeamManager 
            ? "De spelersselectie is opgeslagen."
            : "De wijzigingen zijn opgeslagen."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary text-white">
                {match.uniqueNumber}
              </Badge>
              {match.isLocked && <Lock className="h-4 w-4 text-gray-500" />}
            </div>
            <div className="text-sm text-muted-foreground">
              {match.date} om {match.time} - {match.location}
              {match.matchday && ` | ${match.matchday}`}
            </div>
          </div>
          <CardTitle className="text-lg">
            {match.homeTeamName} vs {match.awayTeamName}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Match Data Section - Only visible but not editable for team managers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wedstrijdgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="homeScore">{match.homeTeamName}</Label>
              <Input
                id="homeScore"
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={!canEdit || !canEditMatchData}
                className="text-center text-lg font-bold"
              />
            </div>
            
            <div className="flex justify-center items-center">
              <span className="text-2xl font-bold">-</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="awayScore">{match.awayTeamName}</Label>
              <Input
                id="awayScore"
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={!canEdit || !canEditMatchData}
                className="text-center text-lg font-bold"
              />
            </div>
          </div>

          {/* Referee Selection */}
          <div className="space-y-2">
            <Label htmlFor="referee">Scheidsrechter</Label>
            <Select
              value={selectedReferee}
              onValueChange={setSelectedReferee}
              disabled={!canEdit || !canEditMatchData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer scheidsrechter" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_REFEREES.map((referee) => (
                  <SelectItem key={referee.id} value={referee.name}>
                    {referee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Players Section - Two columns for home and away teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spelers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Home Team Players */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-center bg-blue-50 p-2 rounded">
                {match.homeTeamName} (Thuis)
              </h4>
              <div className="space-y-2">
                {homeTeamPlayers.map((player) => {
                  const canEditPlayer = isTeamManager && teamId === match.homeTeamId && canEdit;
                  return (
                    <div key={player.player_id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {canEditPlayer && (
                          <input
                            type="checkbox"
                            checked={selectedPlayers[player.player_id]?.selected || false}
                            onChange={(e) => handlePlayerSelection(player.player_id, 'selected', e.target.checked)}
                            className="w-4 h-4"
                          />
                        )}
                        <span className="text-sm font-medium">{player.player_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {canEditPlayer && (
                          <>
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`jersey-${player.player_id}`} className="text-xs">Rugnr:</Label>
                              <Input
                                id={`jersey-${player.player_id}`}
                                type="number"
                                min="1"
                                max="99"
                                value={selectedPlayers[player.player_id]?.jerseyNumber || ""}
                                onChange={(e) => handlePlayerSelection(player.player_id, 'jerseyNumber', e.target.value)}
                                disabled={!selectedPlayers[player.player_id]?.selected}
                                className="w-16 text-center text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedPlayers[player.player_id]?.isCaptain || false}
                                onChange={(e) => handlePlayerSelection(player.player_id, 'isCaptain', e.target.checked)}
                                disabled={!selectedPlayers[player.player_id]?.selected}
                                className="w-3 h-3"
                              />
                              <Label className="text-xs">K</Label>
                            </div>
                          </>
                        )}
                        
                        {showRefereeFields && canEdit && (
                          <Select
                            value={playerCards[player.player_id] || "none"}
                            onValueChange={(value) => handleCardChange(player.player_id, value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-</SelectItem>
                              <SelectItem value="yellow">Geel</SelectItem>
                              <SelectItem value="double_yellow">2x Geel</SelectItem>
                              <SelectItem value="red">Rood</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Away Team Players */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-center bg-red-50 p-2 rounded">
                {match.awayTeamName} (Uit)
              </h4>
              <div className="space-y-2">
                {awayTeamPlayers.map((player) => {
                  const canEditPlayer = isTeamManager && teamId === match.awayTeamId && canEdit;
                  return (
                    <div key={player.player_id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {canEditPlayer && (
                          <input
                            type="checkbox"
                            checked={selectedPlayers[player.player_id]?.selected || false}
                            onChange={(e) => handlePlayerSelection(player.player_id, 'selected', e.target.checked)}
                            className="w-4 h-4"
                          />
                        )}
                        <span className="text-sm font-medium">{player.player_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {canEditPlayer && (
                          <>
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`jersey-${player.player_id}`} className="text-xs">Rugnr:</Label>
                              <Input
                                id={`jersey-${player.player_id}`}
                                type="number"
                                min="1"
                                max="99"
                                value={selectedPlayers[player.player_id]?.jerseyNumber || ""}
                                onChange={(e) => handlePlayerSelection(player.player_id, 'jerseyNumber', e.target.value)}
                                disabled={!selectedPlayers[player.player_id]?.selected}
                                className="w-16 text-center text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedPlayers[player.player_id]?.isCaptain || false}
                                onChange={(e) => handlePlayerSelection(player.player_id, 'isCaptain', e.target.checked)}
                                disabled={!selectedPlayers[player.player_id]?.selected}
                                className="w-3 h-3"
                              />
                              <Label className="text-xs">K</Label>
                            </div>
                          </>
                        )}
                        
                        {showRefereeFields && canEdit && (
                          <Select
                            value={playerCards[player.player_id] || "none"}
                            onValueChange={(value) => handleCardChange(player.player_id, value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-</SelectItem>
                              <SelectItem value="yellow">Geel</SelectItem>
                              <SelectItem value="double_yellow">2x Geel</SelectItem>
                              <SelectItem value="red">Rood</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referee Notes - Only for referees and admins */}
      {showRefereeFields && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notities scheidsrechter</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={refereeNotes}
              onChange={(e) => setRefereeNotes(e.target.value)}
              disabled={!canEdit}
              placeholder="Bijzonderheden, opmerkingen..."
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canEdit}
          className="flex items-center gap-2 px-8"
        >
          <Save className="h-4 w-4" />
          {isReferee ? "Bevestigen & Vergrendelen" : 
           isTeamManager ? "Spelers opslaan" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
};

export default CompactMatchForm;
