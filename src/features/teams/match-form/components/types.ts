export interface PlayerSelection {
  playerId: number | null;
  playerName: string;
  jerseyNumber: string;
  isCaptain: boolean;
  cardType?: string;
  yellowCards?: number;
  redCards?: number;
}
