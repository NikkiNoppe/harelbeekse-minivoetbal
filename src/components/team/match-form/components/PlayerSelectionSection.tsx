import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_TEAM_PLAYERS } from "@/data/mockData";

interface PlayerSelection {
  playerId: number | null;
  playerName: string;
  jerseyNumber: string;
  isCaptain: boolean;
}

interface PlayerSelectionSectionProps {
  match: any;
  homeTeamSelections: PlayerSelection[];
  awayTeamSelections: PlayerSelection[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
  teamId: number;
  isTeamManager: boolean;
}

export const PlayerSelectionSection: React.FC<PlayerSelectionSectionProps> = ({
  match,
  homeTeamSelections,
  awayTeamSelections,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
  teamId,
  isTeamManager
}) => {
  const homeTeamPlayers = MOCK_TEAM_PLAYERS[match.homeTeamId as keyof typeof MOCK_TEAM_PLAYERS] || [];
  const awayTeamPlayers = MOCK_TEAM_PLAYERS[match.awayTeamId as keyof typeof MOCK_TEAM_PLAYERS] || [];

  // Get selected players for captain dropdown
  const getSelectedPlayersForCaptain = (isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    return selections.filter(selection => selection.playerId !== null);
  };

  // Get current captain
  const getCurrentCaptain = (isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    const captain = selections.find(selection => selection.isCaptain);
    return captain ? captain.playerId?.toString() || "no-captain" : "no-captain";
  };

  // Handle captain selection
  const handleCaptainChange = (captainPlayerId: string, isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      onPlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
    });
  };

  const renderPlayerSelectionRows = (isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    const players = isHomeTeam ? homeTeamPlayers : awayTeamPlayers;
    
    // Team managers can only edit their own team
    const canEditThisTeamAsManager = isTeamManager && (
      (isHomeTeam && teamId === match.homeTeamId) || 
      (!isHomeTeam && teamId === match.awayTeamId)
    );
    
    // Referees can edit both teams
    const canEditThisTeam = showRefereeFields || canEditThisTeamAsManager;

    return selections.map((selection, index) => (
      <div key={index} className="flex items-center justify-between p-3 border rounded bg-white">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium w-8">{index + 1}.</span>
          
          {canEditThisTeam && canEdit ? (
            <Select
              value={selection.playerId?.toString() || "no-player"}
              onValueChange={(value) => onPlayerSelection(index, 'playerId', value === "no-player" ? null : parseInt(value), isHomeTeam)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecteer speler" />
              </SelectTrigger>
              <SelectContent>
                {/* "Geen speler" item gets purple_light border */}
                <SelectItem
                  value="no-player"
                  className="border border-[var(--purple-400)] bg-white !font-medium"
                >
                  Geen speler
                </SelectItem>
                {players.map((player) => (
                  <SelectItem key={player.player_id} value={player.player_id.toString()}>
                    {player.player_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="flex-1 text-sm">
              {selection.playerName || "-"}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {canEditThisTeam && canEdit && (
            <div className="flex items-center gap-1">
              <Label htmlFor={`jersey-${isHomeTeam ? 'home' : 'away'}-${index}`} className="text-xs">Rugnr:</Label>
              <Input
                id={`jersey-${isHomeTeam ? 'home' : 'away'}-${index}`}
                type="number"
                min="1"
                max="99"
                value={selection.jerseyNumber}
                onChange={(e) => onPlayerSelection(index, 'jerseyNumber', e.target.value, isHomeTeam)}
                disabled={!selection.playerId}
                className="w-16 text-center text-xs"
              />
            </div>
          )}
          
          {!canEditThisTeam && (selection.jerseyNumber || selection.isCaptain) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selection.jerseyNumber && <span>#{selection.jerseyNumber}</span>}
              {selection.isCaptain && <span>(K)</span>}
            </div>
          )}
          
          {showRefereeFields && canEdit && selection.playerId && (
            <Select
              value={playerCards[selection.playerId] || "none"}
              onValueChange={(value) => onCardChange(selection.playerId!, value)}
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
    ));
  };

  const renderCaptainSelection = (isHomeTeam: boolean) => {
    const canEditThisTeamAsManager = isTeamManager && (
      (isHomeTeam && teamId === match.homeTeamId) || 
      (!isHomeTeam && teamId === match.awayTeamId)
    );
    
    const canEditThisTeam = showRefereeFields || canEditThisTeamAsManager;
    const selectedPlayers = getSelectedPlayersForCaptain(isHomeTeam);
    const currentCaptain = getCurrentCaptain(isHomeTeam);

    if (!canEditThisTeam || !canEdit || selectedPlayers.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        <Label className="text-sm font-medium">Kapitein</Label>
        <Select
          value={currentCaptain}
          onValueChange={(value) => {
            const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
            selections.forEach((selection, index) => {
              const isCaptain = value !== "no-captain" && selection.playerId?.toString() === value;
              onPlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer kapitein" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-captain">Geen kapitein</SelectItem>
            {selectedPlayers.map((player) => (
              <SelectItem key={player.playerId} value={player.playerId?.toString() || "no-captain"}>
                {player.playerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)", background: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">Spelers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team Players */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-center p-2 rounded shadow" style={{ background: "#ab86dd", color: "#fff" }}>
              {match.homeTeamName} (Thuis)
            </h4>
            <div className="space-y-2">
              {renderPlayerSelectionRows(true)}
            </div>
            {renderCaptainSelection(true)}
          </div>

          {/* Away Team Players */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-center p-2 rounded shadow" style={{ background: "#e9e0ff", color: "var(--main-color-dark)" }}>
              {match.awayTeamName} (Uit)
            </h4>
            <div className="space-y-2">
              {renderPlayerSelectionRows(false)}
            </div>
            {renderCaptainSelection(false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
