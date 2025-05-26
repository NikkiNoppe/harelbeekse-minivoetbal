
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
      <div key={index} className="flex items-center justify-between p-3 border rounded">
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
                <SelectItem value="no-player">Geen speler</SelectItem>
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
            <>
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
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selection.isCaptain}
                  onChange={(e) => onPlayerSelection(index, 'isCaptain', e.target.checked, isHomeTeam)}
                  disabled={!selection.playerId}
                  className="w-3 h-3"
                />
                <Label className="text-xs">K</Label>
              </div>
            </>
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

  return (
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
              {renderPlayerSelectionRows(true)}
            </div>
          </div>

          {/* Away Team Players */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-center bg-red-50 p-2 rounded">
              {match.awayTeamName} (Uit)
            </h4>
            <div className="space-y-2">
              {renderPlayerSelectionRows(false)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
