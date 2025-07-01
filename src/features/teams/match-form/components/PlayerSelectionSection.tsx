
import React from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import PlayerSelectionTable from "./PlayerSelectionTable";
import { PlayerSelection } from "./types";
import { TeamPlayer } from "./useTeamPlayers";

interface PlayerSelectionSectionProps {
  teamId?: number;
  teamName: string;
  players: TeamPlayer[];
  selectedPlayers: PlayerSelection[];
  onPlayerSelect: (player: PlayerSelection) => void;
  onPlayerRemove: (playerId: number) => void;
  onJerseyNumberChange: (playerId: number, jerseyNumber: string) => void;
  onCaptainSelect: (playerId: number) => void;
  canEdit: boolean;
  isLocked?: boolean;
}

export const PlayerSelectionSection: React.FC<PlayerSelectionSectionProps> = ({
  teamId,
  teamName,
  players,
  selectedPlayers,
  onPlayerSelect,
  onPlayerRemove,
  onJerseyNumberChange,
  onCaptainSelect,
  canEdit,
  isLocked
}) => {
  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">{teamName} Selectie</CardTitle>
      </CardHeader>
      <CardContent>
        <PlayerSelectionTable
          teamLabel={teamName}
          selections={selectedPlayers}
          players={players}
          loading={false}
          error={null}
          selectedPlayerIds={selectedPlayers.map(p => p.playerId)}
          onPlayerSelection={() => {}}
          onCardChange={() => {}}
          playerCards={{}}
          canEdit={canEdit && !isLocked}
          showRefereeFields={false}
        />
      </CardContent>
    </Card>
  );
};
