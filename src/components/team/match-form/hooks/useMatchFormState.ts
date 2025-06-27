
import { useState } from "react";
import { MatchFormData } from "../types";
import { PlayerSelection } from "../components/types";

export const useMatchFormState = (match: MatchFormData) => {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [selectedReferee, setSelectedReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize player cards directly from existing data
  const initializePlayerCards = (players: PlayerSelection[]) => {
    const cards: Record<number, string> = {};
    players.forEach(player => {
      if (player.playerId && player.cardType) {
        cards[player.playerId] = player.cardType;
      }
    });
    return cards;
  };

  // Initialize player cards state with existing data
  const [playerCards, setPlayerCards] = useState<Record<number, string>>(() => {
    const allPlayers = [...(match.homePlayers || []), ...(match.awayPlayers || [])];
    return initializePlayerCards(allPlayers);
  });
  
  // Initialize player selections with existing data
  const initializePlayerSelections = (players: PlayerSelection[]) => {
    const selections = Array.from({ length: 8 }, (_, index) => {
      const existingPlayer = players[index];
      if (existingPlayer) {
        return existingPlayer;
      }
      return {
        playerId: null,
        playerName: "",
        jerseyNumber: "",
        isCaptain: false,
        cardType: undefined
      };
    });
    return selections;
  };
  
  const [homeTeamSelections, setHomeTeamSelections] = useState<PlayerSelection[]>(
    initializePlayerSelections(match.homePlayers || [])
  );
  
  const [awayTeamSelections, setAwayTeamSelections] = useState<PlayerSelection[]>(
    initializePlayerSelections(match.awayPlayers || [])
  );

  // Helper function to merge card data into player selections
  const mergeCardDataIntoSelections = (selections: PlayerSelection[]) => {
    return selections.map(selection => ({
      ...selection,
      cardType: selection.playerId ? playerCards[selection.playerId] || undefined : undefined
    }));
  };

  // Get selections with card data merged
  const getHomeTeamSelectionsWithCards = () => mergeCardDataIntoSelections(homeTeamSelections);
  const getAwayTeamSelectionsWithCards = () => mergeCardDataIntoSelections(awayTeamSelections);

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
    setAwayTeamSelections,
    getHomeTeamSelectionsWithCards,
    getAwayTeamSelectionsWithCards
  };
};
