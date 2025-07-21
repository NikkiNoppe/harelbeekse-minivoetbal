import * as z from "zod";

export interface Player {
  playerId: number;
  playerName: string;
  selected: boolean;
  jerseyNumber: string;
  isCaptain: boolean;
}

export interface PlayerSelectionFormProps {
  matchId: number;
  teamId: number;
  teamName: string;
  isHomeTeam: boolean;
  onComplete: () => void;
}

// Simplified player schema without complex refinements
const playerSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  selected: z.boolean(),
  jerseyNumber: z.string(),
  isCaptain: z.boolean()
});

// Simplified form schema without complex refinements
export const formSchema = z.object({
  players: z.array(playerSchema)
});

// Define the form data type explicitly to avoid infinite type instantiation
export interface FormData {
  players: Player[];
}
