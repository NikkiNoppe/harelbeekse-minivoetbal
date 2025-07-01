
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

export const formSchema = z.object({
  players: z.array(
    z.object({
      playerId: z.number(),
      playerName: z.string(),
      selected: z.boolean(),
      jerseyNumber: z.string().refine(val => {
        return !val || (parseInt(val) >= 1 && parseInt(val) <= 99);
      }, { message: "Rugnummer moet tussen 1 en 99 zijn" }),
      isCaptain: z.boolean()
    })
  ).refine(players => {
    const selectedPlayers = players.filter(p => p.selected);
    return selectedPlayers.length <= 8;
  }, {
    message: "Er kunnen maximaal 8 spelers geselecteerd worden"
  }).refine(players => {
    const selectedPlayers = players.filter(p => p.selected);
    return selectedPlayers.every(p => p.jerseyNumber !== "");
  }, {
    message: "Alle geselecteerde spelers moeten een rugnummer hebben"
  }).refine(players => {
    const selectedPlayers = players.filter(p => p.selected);
    return selectedPlayers.some(p => p.isCaptain) || selectedPlayers.length === 0;
  }, {
    message: "Er moet een kapitein aangeduid worden"
  })
});

// Define the form data type explicitly to avoid infinite type instantiation
export interface FormData {
  players: Player[];
}
