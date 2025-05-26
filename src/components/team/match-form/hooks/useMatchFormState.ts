
import { useState } from "react";
import { MatchFormData } from "../types";
import { PlayerSelection } from "../components/types";

export const useMatchFormState = (match: MatchFormData) => {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [selectedReferee, setSelectedReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [playerCards, setPlayerCards] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize 8 empty player selection slots
  const [homeTeamSelections, setHomeTeamSelections] = useState<PlayerSelection[]>(
    Array.from({ length: 8 }, () => ({
      playerId: null,
      playerName: "",
      jerseyNumber: "",
      isCaptain: false
    }))
  );
  
  const [awayTeamSelections, setAwayTeamSelections] = useState<PlayerSelection[]>(
    Array.from({ length: 8 }, () => ({
      playerId: null,
      playerName: "",
      jerseyNumber: "",
      isCaptain: false
    }))
  );

  return {
    homeScore,
    setHomeScore,
    awayScore,
    setAwayScore,
    selectedReferee,
    setSelectedReferee,
    refereeNotes,
    setRefereeNotes,
    playerCards,
    setPlayerCards,
    isSubmitting,
    setIsSubmitting,
    homeTeamSelections,
    setHomeTeamSelections,
    awayTeamSelections,
    setAwayTeamSelections
  };
};
