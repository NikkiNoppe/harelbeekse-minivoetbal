
import React, { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchesCardIcon from "./MatchesCardIcon";
import PlayerSelectValue from "./PlayerSelectValue";
import PlayerDataRefreshPopup from "./PlayerDataRefreshPopup";
import { PlayerSelection } from "../types";
import { TeamPlayer } from "../hooks/useTeamPlayers";

interface PlayerSelectionTableProps {
  teamLabel: string;
  selections: PlayerSelection[];
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  retryCount?: number;
  selectedPlayerIds: (number | null)[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
  onRefreshPlayers?: () => Promise<void>;
}

const TABLE_COLUMNS = {
  speler: "w-[60%]", 
  rugnr: "w-[40%]",
} as const;

// Memoized player option component
const PlayerOption = React.memo<{
  player: TeamPlayer;
  isSelected: boolean;
  isDisabled: boolean;
}>(({ player, isSelected, isDisabled }) => {
  const fullName = `${player.first_name} ${player.last_name}`;
  const fontSize = fullName.length > 15 ? 'text-xs' : fullName.length > 10 ? 'text-sm' : '';
  
  return (
    <SelectItem
      value={player.player_id.toString()}
      disabled={isDisabled}
      className={`dropdown-item-login-style ${fontSize} ${isDisabled ? "opacity-50 text-gray-400" : ""}`}
      style={{ 
        textOverflow: 'ellipsis', 
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    >
      {fullName}
    </SelectItem>
  );
});

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
      borderColor: "var(--purple-light)",
      color: "var(--purple-light)",
      background: "var(--color-white)"
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
  loading?: boolean;
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
  loading = false,
  onPlayerSelection, 
  onCardChange 
}) => {
  // Use preloaded suspension data from players instead of individual API calls
  const isPlayerSuspended = useCallback((playerId: number) => {
    const player = players?.find(p => p.player_id === playerId);
    return player ? !player.is_eligible : false;
  }, [players]);

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
      <td className={TABLE_COLUMNS.speler + " text-sm"}>
        {canEdit ? (
          <Select
            value={selection.playerId?.toString() || "no-player"}
            onValueChange={handlePlayerChange}
            disabled={!canEdit || loading}
          >
            <SelectTrigger className="dropdown-login-style min-w-[100px] max-w-full">
              <PlayerSelectValue 
                placeholder={loading ? "Laden..." : "Selecteer speler"} 
                selectedPlayerName={selection.playerName}
              />
              {loading && (
                <div className="absolute right-2 animate-spin rounded-full h-3 w-3 border-b-2 border-primary" aria-hidden="true"></div>
              )}
            </SelectTrigger>
             <SelectContent className="dropdown-content-login-style z-[1001] bg-white">
              <SelectItem value="no-player" className="dropdown-item-login-style">Geen speler</SelectItem>
               {loading ? (
                     <SelectItem value="loading" disabled className="dropdown-item-login-style text-center" aria-busy="true">
                       <div className="flex items-center justify-center gap-2">
                         <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" aria-hidden="true"></div>
                         <span>Spelers laden...</span>
                       </div>
                     </SelectItem>
               ) : (
                 <>
               {/* Show fallback for selected player that might not be in current list */}
               {selection.playerId && selection.playerName && 
                !players?.find(p => p.player_id === selection.playerId) && (
                 <SelectItem 
                   value={selection.playerId.toString()} 
                   className="dropdown-item-login-style opacity-75"
                 >
                   {selection.playerName} (niet beschikbaar)
                 </SelectItem>
               )}
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
                 </>
               )}
            </SelectContent>
          </Select>
        ) : (
          <span className="block w-full">
            {selection.playerName || "-"}
            {selection.isCaptain && (
              <span className="ml-2 text-xs bg-secondary px-1 py-0.5 rounded font-semibold">(K)</span>
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
            className="w-16 min-w-[64px] text-center text-sm py-1 px-2 input-login-style"
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
  retryCount = 0,
  selectedPlayerIds,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
  onRefreshPlayers,
}) => {
  // Memoize expensive computations
  const memoizedSelectedPlayerIds = useMemo(() => selectedPlayerIds, [selectedPlayerIds]);
  const memoizedPlayers = useMemo(() => players, [players]);
  const memoizedPlayerCards = useMemo(() => playerCards, [playerCards]);

  if (loading) {
    const retryMessage = retryCount && retryCount > 0 ? ` (Poging ${retryCount}/3...)` : '';
    return (
      <div className="space-y-3">
        <div className="text-center py-3 text-purple-600 flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span>Spelers laden...{retryMessage}</span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded-md"></div>
          <div className="h-10 bg-muted rounded-md"></div>
          <div className="h-10 bg-muted rounded-md"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-center py-3 text-destructive flex flex-col items-center gap-2" role="alert">
          <span>Kan spelers niet laden</span>
          {onRefreshPlayers && (
            <button
              onClick={() => onRefreshPlayers()}
              className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm min-h-[44px]"
              aria-label="Opnieuw proberen"
            >
              🔄 Opnieuw proberen
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Refresh popup for failed data loads */}
      {onRefreshPlayers && (
        <PlayerDataRefreshPopup
          players={players}
          loading={loading}
          error={error}
          onRefresh={onRefreshPlayers}
          teamLabel={teamLabel}
        />
      )}
      <TeamHeader teamLabel={teamLabel} />
      {/* Desktop/tablet view */}
      <div className="hidden md:block rounded-md border bg-white pb-2">
        <table className="table min-w-full">
          <thead>
            <tr className="table-head">
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
                loading={loading || !memoizedPlayers}
                onPlayerSelection={onPlayerSelection}
                onCardChange={onCardChange}
              />
            ))}
            {selections.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-3 text-muted-foreground">
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
                 <div className="grid grid-cols-[3fr_1fr] gap-2 min-w-0">
                   {canEdit ? (
                     <div className="min-w-0">
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
                         disabled={!canEdit || loading}
                       >
                          <SelectTrigger className="dropdown-login-style w-full max-w-full h-9">
                            <PlayerSelectValue 
                              placeholder={loading ? "Laden..." : "Selecteer speler"} 
                              selectedPlayerName={selection.playerName}
                            />
                            {loading && (
                              <div className="absolute right-2 animate-spin rounded-full h-3 w-3 border-b-2 border-primary" aria-hidden="true"></div>
                            )}
                         </SelectTrigger>
                         <SelectContent className="dropdown-content-login-style z-[1001] bg-white">
                           <SelectItem value="no-player" className="dropdown-item-login-style">Geen speler</SelectItem>
                           {loading ? (
                     <SelectItem value="loading" disabled className="dropdown-item-login-style text-center" aria-busy="true">
                       <div className="flex items-center justify-center gap-2">
                         <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" aria-hidden="true"></div>
                         <span>Spelers laden...</span>
                       </div>
                     </SelectItem>
                           ) : (
                            memoizedPlayers && Array.isArray(memoizedPlayers) && memoizedPlayers.map((player) => {
                              const playerIdNum = player.player_id;
                              const alreadySelected = memoizedSelectedPlayerIds.includes(playerIdNum) && selection.playerId !== playerIdNum;
                              const fullName = `${player.first_name} ${player.last_name}`;
                              const fontSize = fullName.length > 15 ? 'text-xs' : fullName.length > 10 ? 'text-sm' : '';
                              
                              return (
                                <SelectItem 
                                  key={playerIdNum} 
                                  value={playerIdNum.toString()} 
                                  disabled={alreadySelected} 
                                  className={`dropdown-item-login-style ${fontSize}`}
                                  style={{ 
                                    textOverflow: 'ellipsis', 
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {fullName}
                                </SelectItem>
                              );
                            })
                           )}
                         </SelectContent>
                       </Select>
                     </div>
                    ) : (
                      <div className="min-w-0 text-sm h-9 flex items-center">
                        {selection.playerName || "-"}
                       {selection.isCaptain && (
                         <span className="ml-2 text-xs bg-secondary px-1 py-0.5 rounded font-semibold">(K)</span>
                       )}
                     </div>
                   )}
                   <div className="min-w-0">
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
                        className="w-full min-w-[64px] h-9 text-center text-sm py-1 px-2 input-login-style"
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
