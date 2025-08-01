
import React, { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchesCardIcon from "./MatchesCardIcon";
import { PlayerSelection } from "../types/MatchesFormTypes";
import { TeamPlayer } from "./useTeamPlayers";

interface PlayerSelectionTableProps {
  teamLabel: string;
  selections: PlayerSelection[];
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  selectedPlayerIds: (number | null)[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
}

const TABLE_COLUMNS = {
  nr: "w-[40px]",
  speler: "min-w-[150px] w-[180px]",
  rugnr: "w-[54px]",
  kaarten: "w-[40px]",
} as const;

// Memoized player option component
const PlayerOption = React.memo<{
  player: TeamPlayer;
  isSelected: boolean;
  isDisabled: boolean;
}>(({ player, isSelected, isDisabled }) => (
  <SelectItem
    value={player.player_id.toString()}
    disabled={isDisabled}
    className={`dropdown-item-login-style ${isDisabled ? "opacity-50 text-gray-400" : ""}`}
  >
    {player.first_name} {player.last_name}
  </SelectItem>
));

// Memoized card option component
const CardOption = React.memo<{
  value: string;
  label: string;
  iconType: "red" | "yellow" | "none" | "double_yellow";
}>(({ value, label, iconType }) => (
  <SelectItem value={value} className="dropdown-item-login-style">
    <span className="flex items-center">
      <MatchesCardIcon type={iconType} />
      <span className="ml-1">{label}</span>
    </span>
  </SelectItem>
));

// Memoized team header component
const TeamHeader = React.memo<{ teamLabel: string }>(({ teamLabel }) => (
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
));

// Memoized player row component
const PlayerRow = React.memo<{
  selection: PlayerSelection;
  index: number;
  players: TeamPlayer[] | undefined;
  selectedPlayerIds: (number | null)[];
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
}>(({ 
  selection, 
  index, 
  players, 
  selectedPlayerIds, 
  playerCards, 
  canEdit, 
  showRefereeFields, 
  onPlayerSelection, 
  onCardChange 
}) => {
  const handlePlayerChange = useCallback((value: string) => {
    onPlayerSelection(index, 'playerId', value === "no-player" ? null : parseInt(value), false);
  }, [index, onPlayerSelection]);

  const handleJerseyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPlayerSelection(index, 'jerseyNumber', e.target.value, false);
  }, [index, onPlayerSelection]);

  const handleCardChange = useCallback((value: string) => {
    if (selection.playerId) {
      onCardChange(selection.playerId, value);
    }
  }, [selection.playerId, onCardChange]);

  const isPlayerSelected = useMemo(() => 
    selectedPlayerIds.includes(selection.playerId) && selection.playerId !== null,
    [selectedPlayerIds, selection.playerId]
  );

  return (
    <tr className="table-row">
      <td className={TABLE_COLUMNS.nr + " text-center text-sm"}>{index + 1}</td>
      <td className={TABLE_COLUMNS.speler + " text-sm"}>
        {canEdit ? (
          <Select
            value={selection.playerId?.toString() || "no-player"}
            onValueChange={handlePlayerChange}
            disabled={!canEdit}
          >
            <SelectTrigger className="dropdown-login-style min-w-[120px]">
              <SelectValue placeholder="Selecteer speler" />
            </SelectTrigger>
            <SelectContent className="dropdown-content-login-style">
              <SelectItem value="no-player" className="dropdown-item-login-style">Geen speler</SelectItem>
              {players && Array.isArray(players) &&
                players.map((player) => {
                  const playerIdNum = player.player_id;
                  const alreadySelected = selectedPlayerIds.includes(playerIdNum) && selection.playerId !== playerIdNum;
                  
                  return (
                    <PlayerOption
                      key={playerIdNum}
                      player={player}
                      isSelected={selection.playerId === playerIdNum}
                      isDisabled={alreadySelected}
                    />
                  );
                })}
            </SelectContent>
          </Select>
        ) : (
          <span className="block w-full">
            {selection.playerName || "-"}
            {selection.isCaptain && (
              <span className="ml-2 text-xs bg-[var(--purple-200)] px-1 py-0.5 rounded font-semibold">(K)</span>
            )}
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
            onChange={handleJerseyChange}
            disabled={!selection.playerId}
            className="w-12 text-center text-xs py-1 px-1 input-login-style"
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
              onValueChange={handleCardChange}
            >
              <SelectTrigger className="w-[48px] min-w-0 p-0 justify-center dropdown-login-style !w-[48px] !min-w-[48px]">
                <span className="sr-only">Kaart</span>
                <MatchesCardIcon type={playerCards[selection.playerId] as any || "none"} />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                <SelectItem value="none" className="dropdown-item-login-style">-</SelectItem>
                <CardOption value="yellow" label="Geel" iconType="yellow" />
                <CardOption value="double_yellow" label="2x Geel" iconType="double_yellow" />
                <CardOption value="red" label="Rood" iconType="red" />
              </SelectContent>
            </Select>
          ) : (
            <MatchesCardIcon type={playerCards[selection.playerId!] as any || "none"} />
          )}
        </td>
      )}
    </tr>
  );
});

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
  // Memoize expensive computations
  const memoizedSelectedPlayerIds = useMemo(() => selectedPlayerIds, [selectedPlayerIds]);
  const memoizedPlayers = useMemo(() => players, [players]);
  const memoizedPlayerCards = useMemo(() => playerCards, [playerCards]);

  if (loading) {
    return <div className="text-center py-3">Spelers laden...</div>;
  }
  
  if (error) {
    return <div className="text-center py-3 text-red-600">Kan spelers niet laden</div>;
  }

  return (
    <div>
      <TeamHeader teamLabel={teamLabel} />
      <div className="rounded-md border bg-white pb-2">
        <table className="table min-w-full">
          <thead>
            <tr className="table-head">
              <th className={TABLE_COLUMNS.nr + " py-1 text-center"}>Nr</th>
              <th className={TABLE_COLUMNS.speler + " py-1 text-left"}>Speler</th>
              <th className={TABLE_COLUMNS.rugnr + " py-1 text-center"}>Rugnr</th>
              {showRefereeFields && <th className={TABLE_COLUMNS.kaarten + " py-1 text-center"}>Kaarten</th>}
            </tr>
          </thead>
          <tbody>
            {selections.map((selection, index) => (
              <PlayerRow
                key={`${selection.playerId}-${index}`}
                selection={selection}
                index={index}
                players={memoizedPlayers}
                selectedPlayerIds={memoizedSelectedPlayerIds}
                playerCards={memoizedPlayerCards}
                canEdit={canEdit}
                showRefereeFields={showRefereeFields}
                onPlayerSelection={onPlayerSelection}
                onCardChange={onCardChange}
              />
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

export default React.memo(PlayerSelectionTable);
