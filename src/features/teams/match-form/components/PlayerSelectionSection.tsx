import React from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PlayerSelectionTable } from "./PlayerSelectionTable";
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
          teamId={teamId}
          players={players}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={onPlayerSelect}
          onPlayerRemove={onPlayerRemove}
          onJerseyNumberChange={onJerseyNumberChange}
          onCaptainSelect={onCaptainSelect}
          canEdit={canEdit && !isLocked}
        />
      </CardContent>
    </Card>
  );
};
