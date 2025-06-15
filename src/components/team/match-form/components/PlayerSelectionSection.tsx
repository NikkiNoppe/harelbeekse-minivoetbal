import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_TEAM_PLAYERS } from "@/data/mockData";
import { PlayerSelection, MatchFormData } from "../types";
import CardIcon from "./CardIcon";
import { useTeamPlayers } from "./useTeamPlayers";

interface PlayerSelectionSectionProps {
  match: MatchFormData;
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

const TABLE_COLUMNS = {
  nr: "w-[40px]",
  speler: "min-w-[150px] w-[180px]",
  rugnr: "w-[54px]",
  kaarten: "w-[54px]",
};

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
  // Get team ids from match data
  const homeTeamId = match.homeTeamId;
  const awayTeamId = match.awayTeamId;

  // Use the hook for live players
  const { data: homePlayers, isLoading: loadingHome, error: errorHome } = useTeamPlayers(homeTeamId);
  const { data: awayPlayers, isLoading: loadingAway, error: errorAway } = useTeamPlayers(awayTeamId);

  // Helper to get selected players for captains
  const getSelectedPlayers = (isHomeTeam: boolean) => {
    return (isHomeTeam ? homeTeamSelections : awayTeamSelections).filter(sel => sel.playerId !== null);
  };

  const getCurrentCaptain = (isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    const captain = selections.find(selection => selection.isCaptain);
    return captain ? captain.playerId?.toString() || "no-captain" : "no-captain";
  };

  const handleCaptainChange = (captainPlayerId: string, isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      onPlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
    });
  };

  // Render table for a team
  const renderPlayerSelectionTable = (isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    const players = isHomeTeam ? homePlayers : awayPlayers;
    const loading = isHomeTeam ? loadingHome : loadingAway;
    const error = isHomeTeam ? errorHome : errorAway;
    const canEditThisTeam = canEdit;

    if (loading) {
      return <div className="text-center py-3">Spelers laden...</div>;
    }
    if (error) {
      return <div className="text-center py-3 text-red-600">Kan spelers niet laden</div>;
    }

    return (
      <div className="rounded-md border bg-white pb-2">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--purple-light)] bg-[var(--purple-light,#ab86dd)] text-xs font-semibold">
              <th className={TABLE_COLUMNS.nr + " py-1 text-center"}>Nr</th>
              <th className={TABLE_COLUMNS.speler + " py-1 text-left"}>Speler</th>
              <th className={TABLE_COLUMNS.rugnr + " py-1 text-center"}>Rugnr</th>
              {showRefereeFields && <th className={TABLE_COLUMNS.kaarten + " py-1 text-center"}>Kaarten</th>}
            </tr>
          </thead>
          <tbody>
            {selections.map((selection, index) => (
              <tr key={index}
                className={`align-middle border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-[var(--purple-100,#f5f0ff)]'}`}
              >
                <td className={TABLE_COLUMNS.nr + " text-center text-sm"}>{index + 1}</td>
                <td className={TABLE_COLUMNS.speler + " text-sm"}>
                  {canEditThisTeam ? (
                    <Select
                      value={selection.playerId?.toString() || "no-player"}
                      onValueChange={(value) => onPlayerSelection(index, 'playerId', value === "no-player" ? null : parseInt(value), isHomeTeam)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full min-w-[120px] text-sm" >
                        <SelectValue placeholder="Selecteer speler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-player">
                          Geen speler
                        </SelectItem>
                        {Array.isArray(players) && players.map((player) => (
                          <SelectItem key={player.player_id} value={player.player_id.toString()}>
                            {player.first_name} {player.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="block w-full">
                      {selection.playerName || "-"}
                      {selection.isCaptain && <span className="ml-2 text-xs bg-[var(--purple-200)] px-1 py-0.5 rounded font-semibold">(K)</span>}
                    </span>
                  )}
                </td>
                <td className={TABLE_COLUMNS.rugnr + " text-center px-0"}>
                  {canEditThisTeam ? (
                    <Input
                      id={`jersey-${isHomeTeam ? 'home' : 'away'}-${index}`}
                      type="number"
                      min="1"
                      max="99"
                      value={selection.jerseyNumber || ""}
                      onChange={(e) => onPlayerSelection(index, 'jerseyNumber', e.target.value, isHomeTeam)}
                      disabled={!selection.playerId}
                      className="w-12 text-center text-xs py-1 px-1"
                    />
                  ) : (
                    <span className="text-xs">{selection.jerseyNumber && <>#{selection.jerseyNumber}</>}</span>
                  )}
                </td>
                {showRefereeFields && (
                  <td className={TABLE_COLUMNS.kaarten + " text-center"}>
                    {canEditThisTeam && selection.playerId ? (
                      <Select
                        value={playerCards[selection.playerId] || "none"}
                        onValueChange={(value) => onCardChange(selection.playerId!, value)}
                      >
                        <SelectTrigger className="w-[40px] min-w-0 p-0 justify-center">
                          <span className="sr-only">Kaart</span>
                          <CardIcon type={playerCards[selection.playerId] as any || "none"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-</SelectItem>
                          <SelectItem value="yellow"><span className="flex items-center"><CardIcon type="yellow" /><span className="ml-1">Geel</span></span></SelectItem>
                          <SelectItem value="double_yellow"><span className="flex items-center"><CardIcon type="double_yellow" /><span className="ml-1">2x Geel</span></span></SelectItem>
                          <SelectItem value="red"><span className="flex items-center"><CardIcon type="red" /><span className="ml-1">Rood</span></span></SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <CardIcon type={playerCards[selection.playerId!] as any || "none"} />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {selections.length === 0 && (
              <tr>
                <td colSpan={showRefereeFields ? 4 : 3} className="text-center py-3 text-muted-foreground">
                  Geen spelers geselecteerd voor dit team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCaptainSelection = (isHomeTeam: boolean) => {
    const canEditThisTeam = canEdit;
    const selectedPlayers = getSelectedPlayers(isHomeTeam);
    const currentCaptain = getCurrentCaptain(isHomeTeam);

    if (!canEditThisTeam || selectedPlayers.length === 0) {
      return null;
    }

    // Use live player names if available
    const players = isHomeTeam ? homePlayers : awayPlayers;

    return (
      <div className="mt-2 mb-2">
        <Label className="text-sm font-medium">Kapitein</Label>
        <Select
          value={currentCaptain}
          onValueChange={(value) => handleCaptainChange(value, isHomeTeam)}
        >
          <SelectTrigger className="w-[180px] mt-1">
            <SelectValue placeholder="Selecteer kapitein" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-captain">Geen kapitein</SelectItem>
            {selectedPlayers.map((player) => {
              // Prefer matching name from live db if possible
              let name = player.playerName;
              const dbPlayer = Array.isArray(players)
                ? players.find(p => p.player_id === player.playerId)
                : undefined;
              if (dbPlayer) {
                name = `${dbPlayer.first_name} ${dbPlayer.last_name}`;
              }
              return (
                <SelectItem key={player.playerId} value={player.playerId?.toString() || "no-captain"}>
                  {name}
                </SelectItem>
              );
            })}
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
          <div>
            <div
              className="font-medium text-sm text-center p-2 rounded shadow border mb-2"
              style={{
                borderColor: "var(--purple-light, #ab86dd)",
                color: "var(--purple-light, #ab86dd)",
                background: "#fff"
              }}
            >
              {match.homeTeamName} (Thuis)
            </div>
            {renderPlayerSelectionTable(true)}
            {renderCaptainSelection(true)}
          </div>
          <div>
            <div
              className="font-medium text-sm text-center p-2 rounded shadow border mb-2"
              style={{
                borderColor: "var(--purple-light, #ab86dd)",
                color: "var(--purple-light, #ab86dd)",
                background: "#fff"
              }}
            >
              {match.awayTeamName} (Uit)
            </div>
            {renderPlayerSelectionTable(false)}
            {renderCaptainSelection(false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
