
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CardIcon from "./CardIcon";
import { PlayerSelection } from "../types";
import { TeamPlayer } from "./useTeamPlayers";

interface PlayerSelectionTableProps {
  teamLabel: string;
  selections: PlayerSelection[];
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  selectedPlayerIds: (number | null)[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
}

const TABLE_COLUMNS = {
  nr: "w-[40px]",
  speler: "min-w-[150px] w-[180px]",
  rugnr: "w-[54px]",
  kaarten: "w-[54px]",
};

const PlayerSelectionTable: React.FC<PlayerSelectionTableProps> = ({
  teamLabel,
  selections,
  players,
  loading,
  error,
  selectedPlayerIds,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
}) => {
  if (loading) {
    return <div className="text-center py-3">Spelers laden...</div>;
  }
  if (error) {
    return <div className="text-center py-3 text-red-600">Kan spelers niet laden</div>;
  }

  return (
    <div>
      <div
        className="font-medium text-sm text-center p-2 rounded shadow border mb-2"
        style={{
          borderColor: "var(--purple-light, #ab86dd)",
          color: "var(--purple-light, #ab86dd)",
          background: "#fff"
        }}
      >
        {teamLabel}
      </div>
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
                  {canEdit ? (
                    <Select
                      value={selection.playerId?.toString() || "no-player"}
                      onValueChange={(value) =>
                        onPlayerSelection(index, 'playerId', value === "no-player" ? null : parseInt(value))
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full min-w-[120px] text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border border-purple-dark hover:border-purple-dark">
                        <SelectValue placeholder="Selecteer speler" />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg z-50 border border-purple-dark">
                        <SelectItem value="no-player" className="w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white">Geen speler</SelectItem>
                        {Array.isArray(players) &&
                          players.map((player) => {
                            const playerIdNum = player.player_id;
                            // Player option is disabled if already selected elsewhere in this team (except for this row)
                            const alreadySelected =
                              selectedPlayerIds.includes(playerIdNum) &&
                              selection.playerId !== playerIdNum;
                            return (
                              <SelectItem
                                key={playerIdNum}
                                value={playerIdNum.toString()}
                                disabled={alreadySelected}
                                className={`w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white ${alreadySelected ? "opacity-50 text-gray-400" : ""}`}
                              >
                                {player.first_name} {player.last_name}
                              </SelectItem>
                            );
                          })}
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
                  {canEdit ? (
                    <Input
                      id={`jersey-${index}`}
                      type="number"
                      min="1"
                      max="99"
                      value={selection.jerseyNumber || ""}
                      onChange={(e) => onPlayerSelection(index, 'jerseyNumber', e.target.value)}
                      disabled={!selection.playerId}
                      className="w-12 text-center text-xs py-1 px-1 bg-white"
                    />
                  ) : (
                    <span className="text-xs">
                      {selection.jerseyNumber && <>#{selection.jerseyNumber}</>}
                    </span>
                  )}
                </td>
                {showRefereeFields && (
                  <td className={TABLE_COLUMNS.kaarten + " text-center"}>
                    {canEdit && selection.playerId ? (
                      <Select
                        value={playerCards[selection.playerId] || "none"}
                        onValueChange={(value) => onCardChange(selection.playerId!, value)}
                      >
                        <SelectTrigger className="w-[40px] min-w-0 p-0 justify-center bg-white text-purple-dark hover:bg-purple-dark hover:text-white border border-purple-dark hover:border-purple-dark">
                          <span className="sr-only">Kaart</span>
                          <CardIcon type={playerCards[selection.playerId] as any || "none"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white shadow-lg z-50 border border-purple-dark">
                          <SelectItem value="none" className="w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white">-</SelectItem>
                          <SelectItem value="yellow" className="w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white"><span className="flex items-center"><CardIcon type="yellow" /><span className="ml-1">Geel</span></span></SelectItem>
                          <SelectItem value="double_yellow" className="w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white"><span className="flex items-center"><CardIcon type="double_yellow" /><span className="ml-1">2x Geel</span></span></SelectItem>
                          <SelectItem value="red" className="w-full text-sm bg-white text-purple-dark hover:bg-purple-dark hover:text-white border-0 data-[highlighted]:bg-purple-dark data-[highlighted]:text-white"><span className="flex items-center"><CardIcon type="red" /><span className="ml-1">Rood</span></span></SelectItem>
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
    </div>
  );
};

export default PlayerSelectionTable;
