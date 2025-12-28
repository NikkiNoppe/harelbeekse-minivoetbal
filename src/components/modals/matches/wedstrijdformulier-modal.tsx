import React, { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { MatchesPenaltyShootoutModal } from "@/components/modals";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { refereeService, type Referee } from "@/services/core";
import { Loader2, Users, Trash2, Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeamPlayersWithSuspensions, type TeamPlayer } from "@/components/pages/admin/matches/hooks/useTeamPlayers";
import { PlayerDataRefreshModal } from "@/components/modals";
import MatchesCardIcon from "@/components/pages/admin/matches/components/MatchesCardIcon";
import { costSettingsService, financialService } from "@/domains/financial";
import { getCurrentDate } from "@/lib/dateUtils";
import { MatchFormData, PlayerSelection } from "@/components/pages/admin/matches/types";
import { useMatchFormState } from "@/components/pages/admin/matches/hooks/useMatchFormState";
import { useEnhancedMatchFormSubmission } from "@/components/pages/admin/matches/hooks/useEnhancedMatchFormSubmission";
import { canEditMatch, canTeamManagerEdit } from "@/lib/matchLockUtils";

interface WedstrijdformulierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchFormData;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
  onComplete?: () => void;
}

export const WedstrijdformulierModal: React.FC<WedstrijdformulierModalProps> = ({
  open,
  onOpenChange,
  match,
  isAdmin,
  isReferee,
  teamId,
  onComplete
}) => {
  const {
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
  } = useMatchFormState(match);

  const { submitMatchForm } = useEnhancedMatchFormSubmission();
  const [showPenaltyModal, setShowPenaltyModal] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<MatchFormData | null>(null);
  const [homeCardsOpen, setHomeCardsOpen] = React.useState(false);
  const [awayCardsOpen, setAwayCardsOpen] = React.useState(false);
  const [isKaartenOpen, setIsKaartenOpen] = useState(false);
  const [isBoetesOpen, setIsBoetesOpen] = useState(false);
  const [isNotitiesOpen, setIsNotitiesOpen] = useState(false);
  const [isGegevensOpen, setIsGegevensOpen] = useState(false);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loadingReferees, setLoadingReferees] = useState(true);
  const [homeTeamOpen, setHomeTeamOpen] = useState(false);
  const [awayTeamOpen, setAwayTeamOpen] = useState(false);
  const [isSubmittingPlayers, setIsSubmittingPlayers] = useState(false);
  const { toast } = useToast();
  
  // Card management state (from MatchesRefereeCardsSection)
  type TeamKey = "home" | "away";
  interface CardItem {
    team: TeamKey | "";
    playerId: number | null;
    cardType: "yellow" | "double_yellow" | "red";
  }
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [savedCards, setSavedCards] = useState<Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }>>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Penalty management state (from MatchesRefereePenaltySection)
  interface PenaltyItem {
    id?: number;
    costSettingId: number;
    teamId: number;
  }
  const [penalties, setPenalties] = useState<PenaltyItem[]>([]);
  const [availablePenalties, setAvailablePenalties] = useState<any[]>([]);
  const [isLoadingPenalties, setIsLoadingPenalties] = useState(false);
  const [savedPenalties, setSavedPenalties] = useState<Array<{ teamName: string; penaltyName: string; amount: number }>>([]);

  const penaltyTeamOptions = useMemo(() => ([
    { id: match.homeTeamId, name: match.homeTeamName },
    { id: match.awayTeamId, name: match.awayTeamName },
  ]), [match.homeTeamId, match.homeTeamName, match.awayTeamId, match.awayTeamName]);

  // Load available penalties
  useEffect(() => {
    const loadAvailablePenalties = async () => {
      try {
        const costSettings = await costSettingsService.getPenalties();
        setAvailablePenalties(costSettings);
      } catch (error) {
        console.error('Error loading penalties:', error);
      }
    };
    loadAvailablePenalties();
  }, []);

  // Load existing penalties
  useEffect(() => {
    const loadExistingPenalties = async () => {
      try {
        const homeTeamTransactions = await financialService.getTeamTransactions(match.homeTeamId);
        const awayTeamTransactions = await financialService.getTeamTransactions(match.awayTeamId);
        
        const matchPenalties = [...homeTeamTransactions, ...awayTeamTransactions]
          .filter(t => t.match_id === match.matchId && t.transaction_type === 'penalty')
          .map(t => ({
            teamName: t.team_id === match.homeTeamId ? match.homeTeamName : match.awayTeamName,
            penaltyName: t.cost_settings?.name || 'Boete',
            amount: t.amount
          }));
        
        setSavedPenalties(matchPenalties);
      } catch (error) {
        console.error('Error loading existing penalties:', error);
      }
    };
    loadExistingPenalties();
  }, [match.matchId, match.homeTeamId, match.awayTeamId, match.homeTeamName, match.awayTeamName]);

  const addPenalty = useCallback(() => {
    setPenalties(prev => [...prev, {
      costSettingId: 0,
      teamId: match.homeTeamId,
    }]);
  }, [match.homeTeamId]);

  const updatePenalty = useCallback((index: number, field: keyof PenaltyItem, value: any) => {
    setPenalties(prev => prev.map((penalty, i) => 
      i === index ? { ...penalty, [field]: value } : penalty
    ));
  }, []);

  const savePenalties = useCallback(async () => {
    if (penalties.length === 0) return;

    setIsLoadingPenalties(true);
    try {
      const currentDate = getCurrentDate();
      const savedThis: Array<{ teamName: string; penaltyName: string; amount: number }> = [];
      
      for (const penalty of penalties) {
        if (penalty.costSettingId && penalty.teamId) {
          const costSetting = availablePenalties.find(cs => cs.id === penalty.costSettingId);
          if (costSetting) {
            await financialService.addTransaction({
              team_id: penalty.teamId,
              amount: costSetting.amount,
              description: null,
              transaction_type: 'penalty',
              transaction_date: currentDate,
              match_id: match.matchId,
              penalty_type_id: null,
              cost_setting_id: penalty.costSettingId
            });
            const teamName = penaltyTeamOptions.find(t => t.id === penalty.teamId)?.name || 'Team';
            savedThis.push({ teamName, penaltyName: costSetting.name, amount: costSetting.amount });
          }
        }
      }

      toast({
        title: "Boetes opgeslagen",
        description: "De boetes zijn succesvol toegevoegd aan de teamtransacties.",
      });

      setPenalties([]);
      setSavedPenalties(prev => [...savedThis, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error saving penalties:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de boetes.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPenalties(false);
    }
  }, [penalties, availablePenalties, match.matchId, penaltyTeamOptions, toast]);

  const removeSavedPenalty = useCallback((index: number) => {
    setSavedPenalties(prev => prev.filter((_, i) => i !== index));
  }, []);

  const CARD_OPTIONS = [
    { value: "yellow", label: "Geel" },
    { value: "double_yellow", label: "2x Geel" },
    { value: "red", label: "Rood" },
  ] as const;

  const playersByTeam = useMemo(() => ({
    home: homeTeamSelections.filter(s => s.playerId !== null),
    away: awayTeamSelections.filter(s => s.playerId !== null)
  }), [homeTeamSelections, awayTeamSelections]);

  // Load existing cards from database
  useEffect(() => {
    const loadExistingCards = async () => {
      setIsLoadingCards(true);
      try {
        const existingCards: Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }> = [];
        
        if (match.homePlayers) {
          for (const player of match.homePlayers) {
            if (player.playerId && player.cardType && player.cardType !== 'none') {
              existingCards.push({
                team: 'home',
                playerName: player.playerName || `Speler #${player.playerId}`,
                cardType: player.cardType,
                playerId: player.playerId
              });
            } 
          }
        }
        
        if (match.awayPlayers) {
          for (const player of match.awayPlayers) {
            if (player.playerId && player.cardType && player.cardType !== 'none') {
              existingCards.push({
                team: 'away',
                playerName: player.playerName || `Speler #${player.playerId}`,
                cardType: player.cardType,
                playerId: player.playerId
              });
            }
          }
        }
        
        setSavedCards(existingCards);
      } catch (error) {
        console.error('Error loading existing cards:', error);
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadExistingCards();
  }, [match.homePlayers, match.awayPlayers]);

  const addCardItem = useCallback(() => {
    setCardItems(prev => [...prev, { team: "", playerId: null, cardType: "yellow" }]);
  }, []);

  const updateCardItem = useCallback((index: number, field: keyof CardItem, value: any) => {
    setCardItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value, ...(field === "team" ? { playerId: null } : {}) } : it));
  }, []);


  const userRole = useMemo(() => (isAdmin ? "admin" : isReferee ? "referee" : "player_manager"), [isAdmin, isReferee]);
  const isTeamManager = useMemo(() => !isAdmin && !isReferee, [isAdmin, isReferee]);
  const canEdit = useMemo(() => canEditMatch(match.isLocked, match.date, match.time, isAdmin, isReferee), [match.isLocked, match.date, match.time, isAdmin, isReferee]);
  const showRefereeFields = useMemo(() => isReferee || isAdmin, [isReferee, isAdmin]);

  const isAddPenaltyButtonDisabled = useMemo(() => {
    return !canEdit || isLoadingPenalties;
  }, [canEdit, isLoadingPenalties]);

  const isSavePenaltyButtonDisabled = useMemo(() => {
    return penalties.length === 0 || isLoadingPenalties || !canEdit;
  }, [penalties.length, isLoadingPenalties, canEdit]);
  const hideInlineCardSelectors = useMemo(() => isReferee || isAdmin, [isReferee, isAdmin]);
  const isCupMatch = useMemo(() => match.matchday?.includes('🏆'), [match.matchday]);
  const canTeamManagerEditMatch = useMemo(() => 
    canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId), 
    [match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId]
  );

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  const handleCardChange = useCallback((playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  }, [setPlayerCards]);

  const saveCardItems = useCallback(async () => {
    setIsSavingCards(true);
    try {
      let saved = 0;
      const sessionAdds: Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }> = [];
      for (const it of cardItems) {
        if (it.team && it.playerId && it.cardType) {
          handleCardChange(it.playerId, it.cardType);
          saved++;
          const list = it.team === "home" ? playersByTeam.home : playersByTeam.away;
          const sel = list.find(s => s.playerId === it.playerId);
          sessionAdds.push({ 
            team: it.team as TeamKey, 
            playerName: sel?.playerName || `Speler #${it.playerId}`, 
            cardType: it.cardType,
            playerId: it.playerId
          });
        }
      }
      toast({ title: "Kaarten opgeslagen", description: `${saved} kaart(en) toegevoegd.` });
      setCardItems([]);
      setSavedCards(prev => [...sessionAdds, ...prev].slice(0, 20));
    } finally {
      setIsSavingCards(false);
    }
  }, [cardItems, handleCardChange, playersByTeam, toast]);

  const removeSavedCard = useCallback((index: number) => {
    const cardToRemove = savedCards[index];
    if (cardToRemove?.playerId) {
      handleCardChange(cardToRemove.playerId, 'none');
    }
    setSavedCards(prev => prev.filter((_, i) => i !== index));
  }, [savedCards, handleCardChange]);

  const updatePlayerSelection = useCallback((
    selections: PlayerSelection[],
    setSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>,
    index: number,
    field: keyof PlayerSelection,
    value: any
  ) => {
    setSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === "isCaptain" && value === true) {
        updated.forEach((sel, idx) => {
          if (idx !== index) updated[idx].isCaptain = false;
        });
      }
      
      if (field === "playerId" && value === null) {
        updated[index].playerName = "";
        updated[index].jerseyNumber = "";
        updated[index].isCaptain = false;
        if (updated[index].playerId) {
          setPlayerCards(prev => {
            const newCards = { ...prev };
            delete newCards[updated[index].playerId!];
            return newCards;
          });
        }
      }
      return updated;
    });
  }, [setPlayerCards]);

  const handlePlayerSelection = useCallback((
    index: number,
    field: keyof PlayerSelection,
    value: any,
    isHomeTeam: boolean
  ) => {
    const setSelections = isHomeTeam ? setHomeTeamSelections : setAwayTeamSelections;
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    updatePlayerSelection(selections, setSelections, index, field, value);
  }, [homeTeamSelections, awayTeamSelections, setHomeTeamSelections, setAwayTeamSelections, updatePlayerSelection]);

  // State for match data fields (date, time, location, matchday)
  const [matchData, setMatchData] = React.useState({
    date: match.date,
    time: match.time,
    location: match.location,
    matchday: match.matchday || "",
  });

  // Handler for match data changes (date, time, location, matchday)
  const handleMatchDataChange = useCallback((field: string, value: string) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Player selection logic (from PlayerSelectionSection)
  const matchDate = useMemo(() => {
    try {
      return new Date(match.date);
    } catch (error) {
      console.error('Error parsing match date:', error, match.date);
      return new Date();
    }
  }, [match.date]);

  // Load players for both teams
  const { 
    playersWithSuspensions: homePlayersWithSuspensions, 
    loading: homeLoading, 
    error: homeError, 
    suspensionLoading: homeSuspensionLoading, 
    retryCount: homeRetryCount, 
    refetch: homeRefetch 
  } = useTeamPlayersWithSuspensions(match.homeTeamId, matchDate);

  const { 
    playersWithSuspensions: awayPlayersWithSuspensions, 
    loading: awayLoading, 
    error: awayError, 
    suspensionLoading: awaySuspensionLoading, 
    retryCount: awayRetryCount, 
    refetch: awayRefetch 
  } = useTeamPlayersWithSuspensions(match.awayTeamId, matchDate);

  const homeIsLoading = homeLoading || homeSuspensionLoading;
  const awayIsLoading = awayLoading || awaySuspensionLoading;

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [WedstrijdformulierModal] Player loading status:', {
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        matchDate: matchDate?.toISOString(),
        homeLoading: homeIsLoading,
        awayLoading: awayIsLoading,
        homePlayersCount: homePlayersWithSuspensions?.length || 0,
        awayPlayersCount: awayPlayersWithSuspensions?.length || 0,
        homeError: homeError?.message,
        awayError: awayError?.message
      });
    }
  }, [match.homeTeamId, match.awayTeamId, matchDate, homeIsLoading, awayIsLoading, homePlayersWithSuspensions, awayPlayersWithSuspensions, homeError, awayError]);

  // Sync player names when players are loaded - this ensures playerName is always set correctly
  useEffect(() => {
    if (!homeIsLoading && homePlayersWithSuspensions && homePlayersWithSuspensions.length > 0) {
      setHomeTeamSelections(prev => prev.map(selection => {
        if (selection.playerId) {
          const player = homePlayersWithSuspensions.find(p => p.player_id === selection.playerId);
          if (player) {
            const expectedName = `${player.first_name} ${player.last_name}`;
            // Always update playerName to ensure it matches the loaded player data
            return {
              ...selection,
              playerName: expectedName
            };
          }
        }
        return selection;
      }));
    }
  }, [homePlayersWithSuspensions, homeIsLoading]);

  useEffect(() => {
    if (!awayIsLoading && awayPlayersWithSuspensions && awayPlayersWithSuspensions.length > 0) {
      setAwayTeamSelections(prev => prev.map(selection => {
        if (selection.playerId) {
          const player = awayPlayersWithSuspensions.find(p => p.player_id === selection.playerId);
          if (player) {
            const expectedName = `${player.first_name} ${player.last_name}`;
            // Always update playerName to ensure it matches the loaded player data
            return {
              ...selection,
              playerName: expectedName
            };
          }
        }
        return selection;
      }));
    }
  }, [awayPlayersWithSuspensions, awayIsLoading]);

  const createUpdatedMatch = useCallback((homeScore: number | null, awayScore: number | null) => {
    const homeSelections = getHomeTeamSelectionsWithCards();
    const awaySelections = getAwayTeamSelectionsWithCards();
    
    // Ensure all selected players have playerName set
    const homePlayersWithNames = homeSelections.map(selection => {
      if (selection.playerId && (!selection.playerName || selection.playerName === '')) {
        // Try to find the player name from loaded players
        const player = homePlayersWithSuspensions?.find(p => p.player_id === selection.playerId);
        if (player) {
          return {
            ...selection,
            playerName: `${player.first_name} ${player.last_name}`
          };
        }
      }
      return selection;
    });
    
    const awayPlayersWithNames = awaySelections.map(selection => {
      if (selection.playerId && (!selection.playerName || selection.playerName === '')) {
        // Try to find the player name from loaded players
        const player = awayPlayersWithSuspensions?.find(p => p.player_id === selection.playerId);
        if (player) {
          return {
            ...selection,
            playerName: `${player.first_name} ${player.last_name}`
          };
        }
      }
      return selection;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [WedstrijdformulierModal] Creating updated match with players:', {
        homePlayers: homePlayersWithNames.filter(p => p.playerId !== null).map(p => ({ playerId: p.playerId, playerName: p.playerName })),
        awayPlayers: awayPlayersWithNames.filter(p => p.playerId !== null).map(p => ({ playerId: p.playerId, playerName: p.playerName }))
      });
    }
    
    return {
      ...match,
      ...matchData, // Include updated match data fields
      homeScore,
      awayScore,
      referee: selectedReferee,
      refereeNotes,
      isCompleted: homeScore != null && awayScore != null,
      homePlayers: homePlayersWithNames,
      awayPlayers: awayPlayersWithNames
    };
  }, [match, matchData, selectedReferee, refereeNotes, getHomeTeamSelectionsWithCards, getAwayTeamSelectionsWithCards, homePlayersWithSuspensions, awayPlayersWithSuspensions]);

  const handleSubmit = useCallback(async () => {
    const parsedHomeScore = homeScore !== "" ? parseInt(homeScore) : null;
    const parsedAwayScore = awayScore !== "" ? parseInt(awayScore) : null;
    
    if (isCupMatch && parsedHomeScore !== null && parsedAwayScore !== null && parsedHomeScore === parsedAwayScore) {
      const updatedMatch = createUpdatedMatch(parsedHomeScore, parsedAwayScore);
      setPendingSubmission(updatedMatch);
      setShowPenaltyModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedMatch = createUpdatedMatch(parsedHomeScore, parsedAwayScore);
      const result = await submitMatchForm(updatedMatch, isAdmin, userRole);
      if (result.success) {
        handleComplete();
      }
    } catch (error) {
      console.error('Error submitting match form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [homeScore, awayScore, isCupMatch, createUpdatedMatch, submitMatchForm, isAdmin, userRole, handleComplete, setIsSubmitting]);

  const handlePenaltyResult = useCallback(async (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => {
    if (!pendingSubmission) return;
    
    setIsSubmitting(true);
    try {
      const updatedHomeScore = winner === 'home' ? (pendingSubmission.homeScore || 0) + 1 : pendingSubmission.homeScore;
      const updatedAwayScore = winner === 'away' ? (pendingSubmission.awayScore || 0) + 1 : pendingSubmission.awayScore;
      const finalMatch: MatchFormData = {
        ...pendingSubmission,
        homeScore: updatedHomeScore,
        awayScore: updatedAwayScore,
        refereeNotes: `${pendingSubmission.refereeNotes || ''}${pendingSubmission.refereeNotes ? '\n\n' : ''}${notes}`
      };
      const result = await submitMatchForm(finalMatch, isAdmin, userRole);
      if (result.success) {
        handleComplete();
      }
    } catch (error) {
      console.error('Error submitting match form with penalties:', error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
    }
  }, [pendingSubmission, isAdmin, userRole, submitMatchForm, handleComplete, setIsSubmitting]);

  // Keyboard shortcut handler
  const canActuallyEdit = useMemo(() => isTeamManager ? canTeamManagerEditMatch : canEdit, [isTeamManager, canTeamManagerEditMatch, canEdit]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (canActuallyEdit && !isSubmitting) {
          handleSubmit();
        }
      }
      // Enter key to save (when not in input/textarea)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (canActuallyEdit && !isSubmitting) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canActuallyEdit, isSubmitting, handleSubmit]);

  // Focus on first score input when modal opens (only if scores are empty)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const firstScoreInput = document.getElementById('home-score');
      if (firstScoreInput && canActuallyEdit && !homeScore && !awayScore) {
        firstScoreInput.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [open, canActuallyEdit, homeScore, awayScore]);

  // Load referees from database (from MatchDataSection)
  // Always load when modal opens or when match changes to ensure fresh data
  useEffect(() => {
    if (!open) {
      // Reset loading state when modal closes
      setLoadingReferees(false);
      return;
    }

    const loadReferees = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 250; // Minimum 250ms loading time for better UX
      
      try {
        setLoadingReferees(true);
        console.log('🔄 Loading referees from database...');
        const refereesData = await refereeService.getReferees();
        
        if (!refereesData || refereesData.length === 0) {
          console.warn('⚠️ No referees found in database');
          setReferees([]);
        } else {
          setReferees(refereesData);
          console.log(`✅ Loaded ${refereesData.length} referees:`, refereesData.map(r => r.username));
        }
      } catch (error: any) {
        console.error('❌ Error loading referees:', error);
        // Show error toast to user
        toast({
          title: "Fout bij laden scheidsrechters",
          description: error?.message || "Kon scheidsrechters niet laden. Probeer het opnieuw.",
          variant: "destructive",
        });
        // Set empty array on error to prevent UI issues
        setReferees([]);
      } finally {
        // Ensure minimum loading time for better UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
        if (remainingTime > 0) {
          setTimeout(() => {
            setLoadingReferees(false);
          }, remainingTime);
        } else {
          setLoadingReferees(false);
        }
      }
    };

    // Always load referees when modal opens
    loadReferees();
  }, [open, match.matchId, toast]);

  // Memoize referees for performance
  const memoizedReferees = useMemo(() => referees, [referees]);
  
  // Referee selector logic (from MatchDataSection)
  const selectedRefereeExists = useMemo(() => 
    selectedReferee && memoizedReferees.some(ref => ref.username === selectedReferee),
    [memoizedReferees, selectedReferee]
  );
  
  // Always show selectedReferee if it exists, even if not in the list yet (during loading or if referee was removed)
  // Only show undefined if there's no selectedReferee at all
  const refereeSelectValue = useMemo(() => {
    if (selectedReferee) {
      // If we have a selectedReferee, always use it (even if not in list yet)
      return selectedReferee;
    }
    // Only return undefined if there's no selectedReferee
    return undefined;
  }, [selectedReferee]);

  // Player selection logic (from PlayerSelectionSection)
  const getSelectedPlayerIds = useCallback((selections: PlayerSelection[]) =>
    selections.map((sel) => sel.playerId).filter((id): id is number => id !== null), []);
  
  const homeSelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(homeTeamSelections), [homeTeamSelections, getSelectedPlayerIds]);
  
  const awaySelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(awayTeamSelections), [awayTeamSelections, getSelectedPlayerIds]);

  const canEditHome = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.homeTeamId === teamId;
    }
    return isTeamManager ? canTeamManagerEditMatch : canEdit;
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit, canTeamManagerEditMatch]);
  
  const canEditAway = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.awayTeamId === teamId;
    }
    return isTeamManager ? canTeamManagerEditMatch : canEdit;
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit, canTeamManagerEditMatch]);

  const handleCaptainChange = useCallback((captainPlayerId: string, isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      handlePlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
    });
  }, [homeTeamSelections, awayTeamSelections, handlePlayerSelection]);

  const handleSavePlayerSelection = useCallback(async () => {
    if (!isTeamManager || !canEdit) return;
    
    setIsSubmittingPlayers(true);
    try {
      const updatedMatch = {
        ...match,
        homePlayers: homeTeamSelections,
        awayPlayers: awayTeamSelections,
        isCompleted: false
      };
      
      const result = await submitMatchForm(updatedMatch, false, "player_manager");
      if (result.success) {
        toast({
          title: "Spelers opgeslagen",
          description: "De spelersselectie is succesvol opgeslagen.",
        });
      }
    } catch (error) {
      console.error('Error saving player selection:', error);
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het opslaan van de spelers.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPlayers(false);
    }
  }, [isTeamManager, canEdit, match, homeTeamSelections, awayTeamSelections, submitMatchForm, toast]);

  // Score validation and display logic (from MatchesScoreSection)
  const isValidScore = useCallback((score: string) => {
    if (!score || score === "") return false;
    const num = parseInt(score);
    return !isNaN(num) && num >= 0 && num <= 99;
  }, []);

  const homeScoreValid = useMemo(() => isValidScore(homeScore), [homeScore, isValidScore]);
  const awayScoreValid = useMemo(() => isValidScore(awayScore), [awayScore, isValidScore]);

  const displayHomeScore = useMemo(() => homeScore || "", [homeScore]);
  const displayAwayScore = useMemo(() => awayScore || "", [awayScore]);

  const homeScoreClassName = useMemo(() => cn(
    "input-login-style text-center text-3xl font-bold h-16 md:h-20",
    "border-2 transition-all",
    homeScoreValid 
      ? "border-[var(--accent)] bg-[var(--color-50)]" 
      : "border-[var(--color-300)]",
    "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20",
    "disabled:border-[var(--color-300)] disabled:opacity-100"
  ), [homeScoreValid]);

  const awayScoreClassName = useMemo(() => cn(
    "input-login-style text-center text-3xl font-bold h-16 md:h-20",
    "border-2 transition-all",
    awayScoreValid 
      ? "border-[var(--accent)] bg-[var(--color-50)]" 
      : "border-[var(--color-300)]",
    "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20",
    "disabled:border-[var(--color-300)] disabled:opacity-100"
  ), [awayScoreValid]);

  // Sync player names when players are loaded - this ensures playerName is always set correctly
  useEffect(() => {
    if (!homeIsLoading && homePlayersWithSuspensions && homePlayersWithSuspensions.length > 0) {
      setHomeTeamSelections(prev => prev.map(selection => {
        if (selection.playerId) {
          const player = homePlayersWithSuspensions.find(p => p.player_id === selection.playerId);
          if (player) {
            const expectedName = `${player.first_name} ${player.last_name}`;
            // Always update playerName to ensure it matches the loaded player data
            return {
              ...selection,
              playerName: expectedName
            };
          }
        }
        return selection;
      }));
    }
  }, [homePlayersWithSuspensions, homeIsLoading]);

  useEffect(() => {
    if (!awayIsLoading && awayPlayersWithSuspensions && awayPlayersWithSuspensions.length > 0) {
      setAwayTeamSelections(prev => prev.map(selection => {
        if (selection.playerId) {
          const player = awayPlayersWithSuspensions.find(p => p.player_id === selection.playerId);
          if (player) {
            const expectedName = `${player.first_name} ${player.last_name}`;
            // Always update playerName to ensure it matches the loaded player data
            return {
              ...selection,
              playerName: expectedName
            };
          }
        }
        return selection;
      }));
    }
  }, [awayPlayersWithSuspensions, awayIsLoading]);

  const getPlayerSelectValueClassName = useCallback((playerName: string | null | undefined) => {
    if (!playerName) return 'truncate max-w-full';
    if (playerName.length > 15) return 'truncate max-w-full text-xs';
    if (playerName.length > 10) return 'truncate max-w-full text-sm';
    return 'truncate max-w-full';
  }, []);

  const isPlayerSuspended = useCallback((playerId: number, players: TeamPlayer[] | undefined) => {
    const player = players?.find(p => p.player_id === playerId);
    return player ? !player.is_eligible : false;
  }, []);

  // Helper function to get player name from selection or players list
  const getPlayerDisplayName = useCallback((
    selection: PlayerSelection,
    players: TeamPlayer[] | undefined
  ): string | null => {
    if (selection.playerName) {
      return selection.playerName;
    }
    if (selection.playerId && players) {
      const player = players.find(p => p.player_id === selection.playerId);
      if (player) {
        return `${player.first_name} ${player.last_name}`;
      }
    }
    return null;
  }, []);

  // Helper function to render player selection table for a team (without hooks)
  const renderPlayerSelectionTable = useCallback((
    teamLabel: string,
    selections: PlayerSelection[],
    selectedPlayerIds: (number | null)[],
    canEditTeam: boolean,
    isHomeTeam: boolean,
    players: TeamPlayer[] | undefined,
    isLoading: boolean,
    error: any,
    retryCount: number | undefined,
    refetch: (() => Promise<void>) | undefined
  ) => {
    const memoizedSelectedPlayerIds = useMemo(() => selectedPlayerIds, [selectedPlayerIds]);
    const memoizedPlayers = useMemo(() => players, [players]);

    if (isLoading) {
      const retryMessage = retryCount && retryCount > 0 ? ` (Poging ${retryCount}/3...)` : '';
      return (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Spelers worden geladen...{retryMessage}</span>
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
            {refetch && (
              <button
                onClick={() => refetch()}
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

    const TABLE_COLUMNS = { speler: "w-[60%]", rugnr: "w-[40%]" } as const;

    return (
      <div>
        {refetch && (
          <PlayerDataRefreshModal
            players={memoizedPlayers}
            loading={isLoading}
            error={error}
            onRefresh={refetch}
            teamLabel={teamLabel}
          />
        )}
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
              {selections.map((selection, index) => {
                const handlePlayerChange = (value: string) => {
                  const newId = value === "no-player" ? null : parseInt(value);
                  handlePlayerSelection(index, 'playerId', newId, isHomeTeam);
                  if (newId) {
                    const p = memoizedPlayers?.find(pl => pl.player_id === newId);
                    const name = p ? `${p.first_name} ${p.last_name}` : '';
                    handlePlayerSelection(index, 'playerName', name, isHomeTeam);
                  } else {
                    handlePlayerSelection(index, 'playerName', '', isHomeTeam);
                  }
                };

                return (
                  <tr key={`${selection.playerId}-${index}`} className="table-row">
                    <td className={TABLE_COLUMNS.speler + " text-sm"}>
                      {canEditTeam ? (
                        <Select
                          value={selection.playerId?.toString() || "no-player"}
                          onValueChange={handlePlayerChange}
                          disabled={!canEditTeam || isLoading}
                        >
                          <SelectTrigger 
                            className={cn(
                              "dropdown-login-style w-full max-w-full min-h-[44px] text-sm",
                              isLoading && "opacity-75 cursor-wait"
                            )}
                            disabled={isLoading}
                          >
                            <SelectValue 
                              placeholder={
                                isLoading 
                                  ? "Spelers worden geladen uit database..." 
                                  : error 
                                    ? "Fout bij laden, probeer opnieuw" 
                                    : "Selecteer speler"
                              }
                              className={getPlayerSelectValueClassName(
                                getPlayerDisplayName(selection, memoizedPlayers) || undefined
                              )}
                              style={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            />
                            {isLoading && (
                              <div className="absolute right-2 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                              </div>
                            )}
                          </SelectTrigger>
                          <SelectContent className="dropdown-content-login-style z-[1001] bg-white">
                            <SelectItem value="no-player" className="dropdown-item-login-style" disabled={isLoading}>
                              Geen speler
                            </SelectItem>
                            {isLoading ? (
                              <SelectItem value="loading" disabled className="dropdown-item-login-style text-center" aria-busy="true">
                                <div className="flex items-center justify-center gap-2 py-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-sm font-medium">Spelers worden geladen uit database...</span>
                                </div>
                              </SelectItem>
                            ) : error ? (
                              <SelectItem value="error" disabled className="dropdown-item-login-style text-center text-destructive">
                                <div className="flex flex-col items-center justify-center gap-1 py-2">
                                  <span className="text-sm font-medium">Fout bij laden spelers</span>
                                  {refetch && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        refetch();
                                      }}
                                      className="text-xs text-primary hover:underline mt-1"
                                    >
                                      Probeer opnieuw
                                    </button>
                                  )}
                                </div>
                              </SelectItem>
                            ) : (
                              <>
                                {selection.playerId && selection.playerName && 
                                 memoizedPlayers !== undefined && 
                                 !isLoading &&
                                 !memoizedPlayers.find(p => p.player_id === selection.playerId) && (
                                  <SelectItem 
                                    value={selection.playerId.toString()} 
                                    className="dropdown-item-login-style opacity-75"
                                  >
                                    {selection.playerName} (niet beschikbaar)
                                  </SelectItem>
                                )}
                                {memoizedPlayers && Array.isArray(memoizedPlayers) &&
                                  memoizedPlayers.map((player) => {
                                    const playerIdNum = player.player_id;
                                    const alreadySelected = memoizedSelectedPlayerIds.includes(playerIdNum) && selection.playerId !== playerIdNum;
                                    const suspended = isPlayerSuspended(playerIdNum, memoizedPlayers);
                                    const fullName = `${player.first_name} ${player.last_name}`;
                                    const fontSize = fullName.length > 15 ? 'text-xs' : fullName.length > 10 ? 'text-sm' : '';
                                    
                                    return (
                                      <SelectItem
                                        key={playerIdNum}
                                        value={playerIdNum.toString()}
                                        disabled={alreadySelected || suspended}
                                        className={`dropdown-item-login-style ${fontSize} ${alreadySelected || suspended ? "opacity-50 text-gray-400" : ""}`}
                                        style={{ 
                                          textOverflow: 'ellipsis', 
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {fullName}
                                      </SelectItem>
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
                      {canEditTeam ? (
                        <Input
                          id={`jersey-${index}`}
                          type="number"
                          min="1"
                          max="99"
                          placeholder="Rugnr"
                          value={selection.jerseyNumber || ""}
                          onChange={(e) => handlePlayerSelection(index, 'jerseyNumber', e.target.value, isHomeTeam)}
                          disabled={!selection.playerId}
                          className="w-16 min-w-[64px] text-center text-xs py-1 px-2 input-login-style h-8"
                          style={{ fontSize: '16px' }}
                        />
                      ) : (
                        <span className="text-xs">
                          {selection.jerseyNumber && <>#{selection.jerseyNumber}</>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
              {selections.map((selection, index) => {
                const handlePlayerChangeMobile = (value: string) => {
                  const newId = value === "no-player" ? null : parseInt(value);
                  handlePlayerSelection(index, 'playerId', newId, isHomeTeam);
                  if (newId) {
                    const p = memoizedPlayers?.find(pl => pl.player_id === newId);
                    const name = p ? `${p.first_name} ${p.last_name}` : '';
                    handlePlayerSelection(index, 'playerName', name, isHomeTeam);
                  } else {
                    handlePlayerSelection(index, 'playerName', '', isHomeTeam);
                  }
                };

                return (
                  <div key={`${selection.playerId}-${index}`} className="p-2">
                    <div className="grid grid-cols-[3fr_1fr] gap-2 min-w-0">
                      {canEditTeam ? (
                        <div className="min-w-0">
                          <Select
                            value={selection.playerId?.toString() || "no-player"}
                            onValueChange={handlePlayerChangeMobile}
                            disabled={!canEditTeam || isLoading}
                          >
                            <SelectTrigger 
                              className={cn(
                                "dropdown-login-style w-full max-w-full min-h-[44px] text-sm",
                                isLoading && "opacity-75 cursor-wait"
                              )}
                              disabled={isLoading}
                            >
                              <SelectValue 
                                placeholder={
                                  isLoading 
                                    ? "Spelers worden geladen uit database..." 
                                    : error 
                                      ? "Fout bij laden, probeer opnieuw" 
                                      : "Selecteer speler"
                                }
                                className={getPlayerSelectValueClassName(
                                  getPlayerDisplayName(selection, memoizedPlayers) || undefined
                                )}
                                style={{
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap'
                                }}
                              />
                              {isLoading && (
                                <div className="absolute right-2 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                                </div>
                              )}
                            </SelectTrigger>
                            <SelectContent className="dropdown-content-login-style z-[1001] bg-white">
                              <SelectItem value="no-player" className="dropdown-item-login-style" disabled={isLoading}>
                                Geen speler
                              </SelectItem>
                              {isLoading ? (
                                <SelectItem value="loading" disabled className="dropdown-item-login-style text-center" aria-busy="true">
                                  <div className="flex items-center justify-center gap-2 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm font-medium">Spelers worden geladen uit database...</span>
                                  </div>
                                </SelectItem>
                              ) : error ? (
                                <SelectItem value="error" disabled className="dropdown-item-login-style text-center text-destructive">
                                  <div className="flex flex-col items-center justify-center gap-1 py-2">
                                    <span className="text-sm font-medium">Fout bij laden spelers</span>
                                    {refetch && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          refetch();
                                        }}
                                        className="text-xs text-primary hover:underline mt-1"
                                      >
                                        Probeer opnieuw
                                      </button>
                                    )}
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
                        <div className="min-w-0 text-xs h-8 flex items-center">
                          {selection.playerName || "-"}
                          {selection.isCaptain && (
                            <span className="ml-2 text-xs bg-secondary px-1 py-0.5 rounded font-semibold">(K)</span>
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        {canEditTeam ? (
                          <Input
                            id={`m-jersey-${index}`}
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Rugnr"
                            value={selection.jerseyNumber || ""}
                            onChange={(e) => handlePlayerSelection(index, 'jerseyNumber', e.target.value, isHomeTeam)}
                            disabled={!selection.playerId}
                            className="w-full min-w-[64px] h-8 text-center text-xs py-1 px-2 input-login-style"
                            style={{ fontSize: '16px' }}
                          />
                        ) : (
                          <span className="block text-xs text-right">{selection.jerseyNumber && `#${selection.jerseyNumber}`}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }, [matchDate, handlePlayerSelection]);

  // Helper function to render captain selection
  const renderCaptainSelection = useCallback((
    selections: PlayerSelection[],
    canEditTeam: boolean,
    teamLabel: string,
    isHomeTeam: boolean
  ) => {
    const availablePlayers = useMemo(() => {
      return selections.filter(selection => selection.playerId !== null);
    }, [selections]);

    const currentCaptain = useMemo(() => {
      return selections.find(selection => selection.isCaptain);
    }, [selections]);

    const captainValue = useMemo(() => {
      return currentCaptain?.playerId?.toString() || "no-captain";
    }, [currentCaptain]);

    const hasPlayers = availablePlayers.length > 0;

    const handleCaptainChangeLocal = useCallback((value: string) => {
      if (value === "no-captain") {
        handleCaptainChange("no-captain", isHomeTeam);
      } else {
        handleCaptainChange(value, isHomeTeam);
      }
    }, [isHomeTeam]);

    return (
      <div className="space-y-2">
        <Label htmlFor={`captain-select-${isHomeTeam ? 'home' : 'away'}`}>Aanvoerder{teamLabel ? ` — ${teamLabel}` : ''}</Label>
        <Select
          value={captainValue}
          onValueChange={handleCaptainChangeLocal}
          disabled={!canEditTeam || !hasPlayers}
        >
          <SelectTrigger className="w-full h-8 text-sm mt-1 dropdown-login-style">
            <SelectValue placeholder={hasPlayers ? "Selecteer aanvoerder" : "Geen spelers beschikbaar"} />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style z-[1000] bg-white">
            {hasPlayers ? (
              <>
                <SelectItem value="no-captain" className="dropdown-item-login-style">
                  Geen aanvoerder
                </SelectItem>
                {availablePlayers.map((selection) => (
                  <SelectItem
                    key={selection.playerId}
                    value={selection.playerId!.toString()}
                    className="dropdown-item-login-style"
                  >
                    {selection.playerName || `Speler #${selection.playerId}`}
                  </SelectItem>
                ))}
              </>
            ) : (
              <SelectItem value="no-captain" disabled className="dropdown-item-login-style">
                Geen spelers geselecteerd
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }, [handleCaptainChange]);

  const refereeFields = useMemo(() => showRefereeFields && (
    <>
      {/* Boetes sectie */}
      <Collapsible open={isBoetesOpen} onOpenChange={setIsBoetesOpen}>
        <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: isBoetesOpen ? 'var(--color-100)' : 'white' }}>
              <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                <CardTitle className="flex items-center gap-2 text-sm m-0">
                  Boetes
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                    isBoetesOpen && "transform rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[var(--color-200)]">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={addPenalty}
                    disabled={isAddPenaltyButtonDisabled}
                    className="btn btn--secondary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Boete Toevoegen
                  </Button>
                </div>

                {penalties.length > 0 && (
                  <div className="relative space-y-4">
                    <button
                      type="button"
                      className="btn--close absolute top-2 right-2 w-3 h-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Sluiten"
                      onClick={() => setPenalties([])}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {penalties.map((penalty, index) => (
                      <div key={`penalty-${index}`} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <Label htmlFor={`penalty-team-${index}`}>Team</Label>
                          <Select
                            value={penalty.teamId.toString()}
                            onValueChange={(v) => updatePenalty(index, 'teamId', parseInt(v))}
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="dropdown-login-style">
                              <SelectValue placeholder="Selecteer team" />
                            </SelectTrigger>
                            <SelectContent className="dropdown-content-login-style z-50">
                              {penaltyTeamOptions.map((team) => (
                                <SelectItem
                                  key={team.id}
                                  value={team.id.toString()}
                                  className="dropdown-item-login-style"
                                >
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1">
                          <Label htmlFor={`penalty-cost-${index}`}>Type Boete</Label>
                          <Select
                            value={penalty.costSettingId.toString()}
                            onValueChange={(v) => updatePenalty(index, 'costSettingId', parseInt(v))}
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="dropdown-login-style">
                              <SelectValue placeholder="Selecteer boete type" />
                            </SelectTrigger>
                            <SelectContent className="dropdown-content-login-style z-50">
                              {availablePenalties.map((costSetting) => (
                                <SelectItem
                                  key={costSetting.id}
                                  value={costSetting.id.toString()}
                                  className="dropdown-item-login-style"
                                >
                                  {costSetting.name} - €{costSetting.amount}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={savePenalties}
                        disabled={isSavePenaltyButtonDisabled}
                        className="btn btn--primary"
                      >
                        {isLoadingPenalties ? "Bezig..." : "Boetes Opslaan"}
                      </Button>
                    </div>
                  </div>
                )}

                {penalties.length === 0 && savedPenalties.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nog geen boetes toegevoegd</p>
                    <p className="text-sm">Klik op "Boete Toevoegen" om een boete toe te voegen</p>
                  </div>
                )}

                {savedPenalties.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">Toegevoegd (sessie)</div>
                    <div className="space-y-1">
                      {savedPenalties.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1.5 bg-white">
                          <div className="truncate">
                            <span className="font-medium">{p.teamName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{p.penaltyName}</span>
                            <span className="text-muted-foreground">€{p.amount}</span>
                            <Button type="button" variant="outline" onClick={() => removeSavedPenalty(i)} className="btn btn--icon btn--danger" aria-label="Verwijderen">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Notities sectie */}
      <Collapsible open={isNotitiesOpen} onOpenChange={setIsNotitiesOpen}>
        <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: isNotitiesOpen ? 'var(--color-100)' : 'white' }}>
              <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                <CardTitle className="flex items-center gap-2 text-sm m-0">
                  Notities
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                    isNotitiesOpen && "transform rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[var(--color-200)]">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    id="referee-notes"
                    value={refereeNotes}
                    onChange={(e) => setRefereeNotes(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Voeg hier eventuele notities toe..."
                    className="min-h-[120px] input-login-style"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  ), [showRefereeFields, refereeNotes, setRefereeNotes, canEdit, match, isBoetesOpen, isNotitiesOpen]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Wedstrijdformulier"
      size="lg"
      aria-describedby="match-form-description"
      showCloseButton={true}
      primaryAction={{
        label: isSubmitting ? "Bezig..." : "Opslaan",
        onClick: handleSubmit,
        disabled: isSubmitting || (!canActuallyEdit && !isAdmin),
        loading: isSubmitting,
        variant: "primary"
      }}
    >
      <div id="match-form-description" className="sr-only">
        Vul scores, spelers en details van de wedstrijd in
      </div>
      <div className="space-y-6">
        {/* SCORE - PROMINENT BOVENAAN */}
        <div className="space-y-4 pb-2">
          {/* Section Title */}
          <div className="text-center">
            <h3 className="text-xl font-bold" style={{ color: 'var(--primary)', paddingTop: '8px', paddingBottom: '8px' }}>
              Score
            </h3>
          </div>

          {/* Score Inputs Container */}
          <div className="relative">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-end">
              {/* Home Team Score */}
              <div className="space-y-2">
                <Label 
                  htmlFor="home-score" 
                  className="text-sm font-semibold text-center block"
                  style={{ color: 'var(--accent)' }}
                >
                  {match.homeTeamName}
                </Label>
                <div className="relative">
                  <Input
                    id="home-score"
                    type="number"
                    min="0"
                    max="99"
                    value={displayHomeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    disabled={!isAdmin && !isReferee}
                    className={homeScoreClassName}
                    style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      padding: '1rem'
                    }}
                    aria-label={`Score voor ${match.homeTeamName}`}
                  />
                </div>
              </div>

              {/* Score Separator */}
              <div className="flex items-center justify-center pb-2">
                <span 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: 'var(--accent)', height: '47px' }}
                  aria-label="tegen"
                >
                  -
                </span>
              </div>

              {/* Away Team Score */}
              <div className="space-y-2">
                <Label 
                  htmlFor="away-score" 
                  className="text-sm font-semibold text-center block"
                  style={{ color: 'var(--accent)' }}
                >
                  {match.awayTeamName}
                </Label>
                <div className="relative">
                  <Input
                    id="away-score"
                    type="number"
                    min="0"
                    max="99"
                    value={displayAwayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    disabled={!isAdmin && !isReferee}
                    className={awayScoreClassName}
                    style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      padding: '1rem'
                    }}
                    aria-label={`Score voor ${match.awayTeamName}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basisgegevens */}
        <div className="space-y-4">
          {/* Gegevens - Collapsible */}
          <Collapsible open={isGegevensOpen} onOpenChange={setIsGegevensOpen}>
            <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CollapsibleTrigger asChild>
                <CardHeader className="text-sm font-semibold px-5 hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: isGegevensOpen ? 'var(--color-100)' : 'white' }}>
                  <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                    <CardTitle className="flex items-center gap-2 text-sm m-0">
                      Gegevens
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                        isGegevensOpen && "transform rotate-180"
                      )}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-[var(--color-200)]">
                <CardContent className="pt-4 space-y-4">
                  {/* First row: Date, Time (1/2 - 1/2 on mobile) */}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="match-date" style={{ color: 'var(--accent)' }}>Datum</Label>
                      <Input
                        id="match-date"
                        type="date"
                        value={matchData.date}
                        onChange={(e) => handleMatchDataChange("date", e.target.value)}
                        disabled={!showRefereeFields}
                        className="input-login-style h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="match-time" style={{ color: 'var(--accent)' }}>Tijd</Label>
                      <Input
                        id="match-time"
                        type="time"
                        value={matchData.time}
                        onChange={(e) => handleMatchDataChange("time", e.target.value)}
                        disabled={!showRefereeFields}
                        className="input-login-style h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Second row: Location full width */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="match-location" style={{ color: 'var(--accent)' }}>Locatie</Label>
                      <Input
                        id="match-location"
                        value={matchData.location}
                        onChange={(e) => handleMatchDataChange("location", e.target.value)}
                        disabled={!showRefereeFields}
                        placeholder="Wedstrijdlocatie"
                        className="input-login-style h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Administratieve gegevens */}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="match-matchday" style={{ color: 'var(--accent)' }}>Speeldag</Label>
                      <Input
                        id="match-matchday"
                        value={matchData.matchday || ""}
                        onChange={(e) => handleMatchDataChange("matchday", e.target.value)}
                        disabled={!showRefereeFields}
                        placeholder="Speeldag"
                        className="input-login-style h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="match-referee" style={{ color: 'var(--accent)' }}>Scheidsrechter</Label>
                      <Select
                        value={refereeSelectValue}
                        onValueChange={setSelectedReferee}
                        disabled={!canEdit || loadingReferees}
                      >
                        <SelectTrigger className="dropdown-login-style min-h-[44px] h-[44px] text-sm w-full">
                          <SelectValue 
                            placeholder={
                              loadingReferees 
                                ? "Scheidsrechters worden geladen..." 
                                : selectedReferee 
                                  ? selectedReferee 
                                  : "Selecteer scheidsrechter"
                            } 
                          />
                          {loadingReferees && (
                            <div className="absolute right-2 flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                            </div>
                          )}
                        </SelectTrigger>
                        <SelectContent className="dropdown-content-login-style z-modal bg-card" style={{ backgroundColor: 'white' }}>
                          {loadingReferees ? (
                            <SelectItem value="loading" disabled className="dropdown-item-login-style text-center" aria-busy="true">
                              <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-sm font-medium">Scheidsrechters worden geladen...</span>
                              </div>
                            </SelectItem>
                          ) : (
                            <>
                              {/* Always show selected referee first, even if not in list yet (during loading or if referee was removed) */}
                              {selectedReferee && !selectedRefereeExists && (
                                <SelectItem 
                                  value={selectedReferee} 
                                  className="dropdown-item-login-style opacity-75"
                                >
                                  {selectedReferee} {!loadingReferees && "(niet beschikbaar)"}
                                </SelectItem>
                              )}
                              {/* Show all available referees */}
                              {memoizedReferees.length > 0 ? (
                                memoizedReferees.map((referee) => (
                                  <SelectItem key={referee.user_id} value={referee.username} className="dropdown-item-login-style">
                                    {referee.username}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-referees" disabled className="dropdown-item-login-style text-center text-muted-foreground">
                                  Geen scheidsrechters beschikbaar
                                </SelectItem>
                              )}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Spelers */}
        <h3 className="text-xl font-semibold text-center text-purple-dark">Spelers</h3>
        
        <div className="space-y-4">
          {/* Mobile-first: Stacked cards, collapsible on mobile */}
          <div className="space-y-3">
            {/* Home Team Card */}
            <Collapsible open={homeTeamOpen} onOpenChange={setHomeTeamOpen}>
              <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
                <CollapsibleTrigger asChild>
                  <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: homeTeamOpen ? 'var(--color-100)' : 'white' }}>
                    <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                      <CardTitle className="flex items-center gap-2 text-sm flex-1 m-0">
                        <Users className="h-4 w-4 text-primary" />
                        {match.homeTeamName}
                      </CardTitle>
                      <span className="text-sm font-normal text-muted-foreground ml-auto mr-2">(Thuis)</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                          homeTeamOpen && "transform rotate-180"
                        )}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-[var(--color-200)]">
                  <CardContent className="pt-4">
                    {renderPlayerSelectionTable(
                      `${match.homeTeamName} (Thuis)`,
                      homeTeamSelections,
                      homeSelectedPlayerIds,
                      canEditHome,
                      true,
                      homePlayersWithSuspensions,
                      homeIsLoading,
                      homeError,
                      homeRetryCount,
                      homeRefetch
                    )}
                    <div className="mt-4">
                      {renderCaptainSelection(homeTeamSelections, canEditHome, `${match.homeTeamName} (Thuis)`, true)}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Away Team Card */}
            <Collapsible open={awayTeamOpen} onOpenChange={setAwayTeamOpen}>
              <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
                <CollapsibleTrigger asChild>
                  <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: awayTeamOpen ? 'var(--color-100)' : 'white' }}>
                    <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                      <CardTitle className="flex items-center gap-2 text-sm flex-1 m-0">
                        <Users className="h-4 w-4 text-primary" />
                        {match.awayTeamName}
                      </CardTitle>
                      <span className="text-sm font-normal text-muted-foreground ml-auto mr-2">(Uit)</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                          awayTeamOpen && "transform rotate-180"
                        )}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-[var(--color-200)]">
                  <CardContent className="pt-4">
                    {renderPlayerSelectionTable(
                      `${match.awayTeamName} (Uit)`,
                      awayTeamSelections,
                      awaySelectedPlayerIds,
                      canEditAway,
                      false,
                      awayPlayersWithSuspensions,
                      awayIsLoading,
                      awayError,
                      awayRetryCount,
                      awayRefetch
                    )}
                    <div className="mt-4">
                      {renderCaptainSelection(awayTeamSelections, canEditAway, `${match.awayTeamName} (Uit)`, false)}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          
          {/* Save button for team managers */}
          {isTeamManager && canEdit && (
            <div className="flex justify-center mt-4">
              {/* PlayerSelectionActions is empty, so no button needed */}
            </div>
          )}
        </div>

        {/* Kaarten, Boetes & Notities - Hidden for team managers */}
        {!isTeamManager && (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-center text-purple-dark">Wedstrijd</h3>
            <Collapsible open={isKaartenOpen} onOpenChange={setIsKaartenOpen}>
            <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CollapsibleTrigger asChild>
                <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: isKaartenOpen ? 'var(--color-100)' : 'white' }}>
                  <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                    <CardTitle className="flex items-center gap-2 text-sm m-0">
                      Kaarten
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                        isKaartenOpen && "transform rotate-180"
                      )}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-[var(--color-200)]">
                <CardContent className="pt-4">
                  {showRefereeFields && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        {canEdit && (
                          <Button onClick={addCardItem} className="btn btn--secondary h-8 px-3">
                            <Plus className="h-4 w-4 mr-2" />
                            Kaart toevoegen
                          </Button>
                        )}
                      </div>

                      {cardItems.length > 0 && (
                        <div className="relative space-y-3">
                          <button
                            type="button"
                            className="btn--close absolute top-2 right-2 w-3 h-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Sluiten"
                            onClick={() => setCardItems([])}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                          {cardItems.map((it, idx) => {
                            const teamPlayers = it.team === "home" ? playersByTeam.home : it.team === "away" ? playersByTeam.away : [];
                            return (
                              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 p-3 border border-border rounded-lg bg-muted">
                                <div className="w-full md:w-1/3">
                                  <Label className="text-xs">Team</Label>
                                  <Select value={it.team} onValueChange={(v) => updateCardItem(idx, "team", v)} disabled={!canEdit}>
                                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                                      <SelectValue placeholder="Selecteer team" />
                                    </SelectTrigger>
                                    <SelectContent className="dropdown-content-login-style z-50">
                                      <SelectItem value="home" className="dropdown-item-login-style">Thuis — {match.homeTeamName}</SelectItem>
                                      <SelectItem value="away" className="dropdown-item-login-style">Uit — {match.awayTeamName}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="w-full md:w-1/3">
                                  <Label className="text-xs">Speler</Label>
                                  <Select value={it.playerId ? String(it.playerId) : undefined} onValueChange={(v) => updateCardItem(idx, "playerId", parseInt(v))} disabled={!canEdit || !it.team}>
                                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                                      <SelectValue placeholder={!it.team ? "Eerst team kiezen" : "Selecteer speler"} />
                                    </SelectTrigger>
                                    <SelectContent className="dropdown-content-login-style z-50">
                                      {teamPlayers.map(sel => (
                                        <SelectItem key={sel.playerId!} value={String(sel.playerId!)} className="dropdown-item-login-style">
                                          {sel.playerName || `Speler #${sel.playerId}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="w-full md:w-1/3">
                                  <Label className="text-xs">Type kaart</Label>
                                  <Select value={it.cardType} onValueChange={(v) => updateCardItem(idx, "cardType", v)} disabled={!canEdit}>
                                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dropdown-content-login-style z-50">
                                      {CARD_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="dropdown-item-login-style">
                                          <span className="flex items-center">
                                            <MatchesCardIcon type={opt.value as any} />
                                            <span className="ml-1">{opt.label}</span>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}

                          <div className="flex justify-end">
                            <Button className="btn btn--primary h-8 px-3" onClick={saveCardItems} disabled={isSavingCards}>Kaarten opslaan</Button>
                          </div>
                        </div>
                      )}

                      {isLoadingCards && (
                        <div className="text-center py-6 text-gray-500 text-sm">Kaarten laden...</div>
                      )}

                      {!isLoadingCards && cardItems.length === 0 && savedCards.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">Nog geen kaarten toegevoegd</div>
                      )}

                      {savedCards.length > 0 && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            {savedCards.map((c, i) => (
                              <div key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1.5 bg-white">
                                <div className="truncate">
                                  <span className="font-medium">{c.team === 'home' ? 'Thuis' : 'Uit'}</span>
                                  <span className="mx-1">-</span>
                                  <span className="truncate inline-block max-w-[13rem] align-middle">{c.playerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <MatchesCardIcon type={c.cardType as any} />
                                    <span>{c.cardType === 'yellow' ? 'Geel' : c.cardType === 'double_yellow' ? '2x Geel' : 'Rood'}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => removeSavedCard(i)}
                                    className="btn btn--icon btn--danger"
                                    aria-label="Verwijderen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
            {refereeFields}
          </div>
        )}
        
        {/* Hidden fields to preserve poll data */}
        <>
          <input
            type="hidden"
            name="assignedRefereeId"
            value={(match as any).assignedRefereeId || ''}
          />
          <input
            type="hidden"
            name="pollGroupId"
            value={(match as any).pollGroupId || ''}
          />
          <input
            type="hidden"
            name="pollMonth"
            value={(match as any).pollMonth || ''}
          />
        </>
        
        <MatchesPenaltyShootoutModal
          open={showPenaltyModal}
          onOpenChange={setShowPenaltyModal}
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
          onPenaltyResult={handlePenaltyResult}
        />
      </div>
    </AppModal>
  );
};

