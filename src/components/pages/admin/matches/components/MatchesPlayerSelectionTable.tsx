
import React, { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchesCardIcon from "./MatchesCardIcon";
import { PlayerSelection } from "../types";
import { TeamPlayer } from "../hooks/useTeamPlayers";

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
  nr: "w-1/6",
  speler: "w-3/6", 
  rugnr: "w-2/6",
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
  const [suspendedPlayers, setSuspendedPlayers] = React.useState<number[]>([]);

  React.useEffect(() => {
    const checkSuspensions = async () => {
      if (!players?.length) return;
      
      const currentDate = new Date();
      const suspended: number[] = [];
      
      // Import suspensionService dynamically to avoid circular imports
      const { suspensionService } = await import('@/services');
      
      for (const player of players) {
        const isEligible = await suspensionService.checkPlayerEligibility(player.player_id, currentDate);
        if (!isEligible) {
          suspended.push(player.player_id);
        }
      }
      
      setSuspendedPlayers(suspended);
    };
    
    checkSuspensions();
  }, [players]);

  const isPlayerSuspended = (playerId: number) => suspendedPlayers.includes(playerId);

  const handlePlayerChange = useCallback((value: string) => {
    const newId = value === "no-player" ? null : parseInt(value);
    onPlayerSelection(index, 'playerId', newId, false);
    // Also set playerName so UI shows names (not IDs) elsewhere
    if (newId) {
      const p = players?.find(pl => pl.player_id === newId);
      const name = p ? `${p.first_name} ${p.last_name}` : '';
      onPlayerSelection(index, 'playerName', name, false);
    } else {
      onPlayerSelection(index, 'playerName', '', false);
    }
  }, [index, onPlayerSelection, players]);

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
             <SelectContent className="dropdown-content-login-style z-[1000] bg-white">
              <SelectItem value="no-player" className="dropdown-item-login-style">Geen speler</SelectItem>
              {players && Array.isArray(players) &&
                 players.map((player) => {
                   const playerIdNum = player.player_id;
                   const alreadySelected = selectedPlayerIds.includes(playerIdNum) && selection.playerId !== playerIdNum;
                   const suspended = isPlayerSuspended(playerIdNum);
                   
                   return (
                     <PlayerOption
                       key={playerIdNum}
                       player={player}
                       isSelected={selection.playerId === playerIdNum}
                       isDisabled={alreadySelected || suspended}
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
            placeholder="Rugnr"
            value={selection.jerseyNumber || ""}
            onChange={handleJerseyChange}
            disabled={!selection.playerId}
            className="w-16 min-w-[64px] text-center text-sm py-1 px-1 input-login-style"
          />
        ) : (
          <span className="text-xs">
            {selection.jerseyNumber && <>#{selection.jerseyNumber}</>}
          </span>
        )}
      </td>
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
      {/* Desktop/tablet view */}
      <div className="hidden md:block rounded-md border bg-white pb-2">
        <table className="table min-w-full">
          <thead>
            <tr className="table-head">
              <th className={TABLE_COLUMNS.nr + " py-1 text-center"}>Nr</th>
              <th className={TABLE_COLUMNS.speler + " py-1 text-left"}>Speler</th>
              <th className={TABLE_COLUMNS.rugnr + " py-1 text-center"}>Rugnr</th>
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
                <td colSpan={3} className="text-center py-3 text-muted-foreground">
                  Geen spelers geselecteerd voor dit team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view - compact list */}
      <div className="md:hidden">
        {selections.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground">Geen spelers geselecteerd voor dit team.</div>
        ) : (
          <div className="rounded-md border bg-white divide-y">
            {selections.map((selection, index) => (
              <div key={`${selection.playerId}-${index}`} className="p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-9 shrink-0 flex items-center justify-center text-xs text-muted-foreground">#{index + 1}</span>
                   {canEdit ? (
                     <div className="w-3/6">
                       <Select
                        value={selection.playerId?.toString() || "no-player"}
                        onValueChange={(value) => {
                          const newId = value === "no-player" ? null : parseInt(value);
                          onPlayerSelection(index, 'playerId', newId, false);
                          if (newId) {
                            const p = memoizedPlayers?.find(pl => pl.player_id === newId);
                            const name = p ? `${p.first_name} ${p.last_name}` : '';
                            onPlayerSelection(index, 'playerName', name, false);
                          } else {
                            onPlayerSelection(index, 'playerName', '', false);
                          }
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="dropdown-login-style w-full h-9">
                          <SelectValue placeholder="Selecteer speler" />
                        </SelectTrigger>
                        <SelectContent className="dropdown-content-login-style z-[1000] bg-white">
                          <SelectItem value="no-player" className="dropdown-item-login-style">Geen speler</SelectItem>
                          {memoizedPlayers && Array.isArray(memoizedPlayers) && memoizedPlayers.map((player) => {
                            const playerIdNum = player.player_id;
                            const alreadySelected = memoizedSelectedPlayerIds.includes(playerIdNum) && selection.playerId !== playerIdNum;
                            return (
                              <SelectItem key={playerIdNum} value={playerIdNum.toString()} disabled={alreadySelected} className="dropdown-item-login-style">
                                {player.first_name} {player.last_name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                   ) : (
                     <div className="w-3/6 text-sm h-9 flex items-center">
                       {selection.playerName || "-"}
                      {selection.isCaptain && (
                        <span className="ml-2 text-xs bg-[var(--purple-200)] px-1 py-0.5 rounded font-semibold">(K)</span>
                      )}
                    </div>
                  )}
                  <div className="w-2/6">
                    {canEdit ? (
                      <Input
                        id={`m-jersey-${index}`}
                        type="number"
                        min="1"
                        max="99"
                        placeholder="Rugnr"
                        value={selection.jerseyNumber || ""}
                        onChange={(e) => onPlayerSelection(index, 'jerseyNumber', e.target.value, false)}
                        disabled={!selection.playerId}
                        className="w-full min-w-[96px] h-9 text-center text-sm py-1 px-2 input-login-style"
                      />
                    ) : (
                      <span className="block text-xs text-right">{selection.jerseyNumber && `#${selection.jerseyNumber}`}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PlayerSelectionTable);
