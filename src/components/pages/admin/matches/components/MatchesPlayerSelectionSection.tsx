import React, { useMemo, useCallback, useState } from "react";
import OptimizedMatchesPlayerSelectionTable from "./OptimizedMatchesPlayerSelectionTable";
import MatchesCaptainSelection from "./MatchesCaptainSelection";
import PlayerSelectionActions from "./MatchesPlayerSelectionActions";
import { PlayerSelection, MatchFormData } from "../types";
import { useEnhancedMatchFormSubmission } from "../hooks/useEnhancedMatchFormSubmission";
import { useToast } from "@/hooks/use-toast";
import { canTeamManagerEdit } from "@/lib/matchLockUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerSelectionSectionProps {
  match: MatchFormData;
  homeTeamSelections: PlayerSelection[];
  awayTeamSelections: PlayerSelection[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
  teamId: number;
  isTeamManager: boolean;
}

export const PlayerSelectionSection: React.FC<PlayerSelectionSectionProps> = ({
  match,
  homeTeamSelections,
  awayTeamSelections,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
  teamId,
  isTeamManager,
}) => {
  const [isSubmittingPlayers, setIsSubmittingPlayers] = useState(false);
  const { submitMatchForm } = useEnhancedMatchFormSubmission();
  const { toast } = useToast();
  
  // Collapsible state for mobile - both teams closed by default
  const [homeTeamOpen, setHomeTeamOpen] = useState(false);
  const [awayTeamOpen, setAwayTeamOpen] = useState(false);
  
  // Convert match date string to Date object for suspension checks
  const matchDate = useMemo(() => new Date(match.date), [match.date]);

  // Helper: prevent duplicate selection - memoized for performance
  const getSelectedPlayerIds = useCallback((selections: PlayerSelection[]) =>
    selections.map((sel) => sel.playerId).filter((id): id is number => id !== null), []);

  // Captain logic with better logging
  const getCurrentCaptain = useCallback((selections: PlayerSelection[]) =>
    selections.find((selection) => selection.isCaptain)?.playerId?.toString() || "no-captain", []);
  
  const handleCaptainChange = useCallback((captainPlayerId: string, isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      onPlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
    });
  }, [homeTeamSelections, awayTeamSelections, onPlayerSelection]);

  // Memoize selected player IDs for performance
  const homeSelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(homeTeamSelections), [homeTeamSelections, getSelectedPlayerIds]);
  
  const awaySelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(awayTeamSelections), [awayTeamSelections, getSelectedPlayerIds]);

  // Handle team-specific editing for team managers
  const canEditHome = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.homeTeamId === teamId;
    }
    return canEdit; // Non-team managers depend on canEdit (which includes time-based locking)
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit]);
  
  const canEditAway = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.awayTeamId === teamId;
    }
    return canEdit; // Non-team managers depend on canEdit (which includes time-based locking)
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit]);

  // Save players for team managers
  const handleSavePlayerSelection = useCallback(async () => {
    if (!isTeamManager || !canEdit) return;
    
    setIsSubmittingPlayers(true);
    try {
      const updatedMatch = {
        ...match,
        homePlayers: homeTeamSelections,
        awayPlayers: awayTeamSelections,
        isCompleted: false // Only updating player selection, not completing match
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

  return (
    <div className="space-y-4">
      {/* Mobile-first: Stacked cards, collapsible on mobile */}
      <div className="space-y-3">
        {/* Home Team Card */}
        <Collapsible open={homeTeamOpen} onOpenChange={setHomeTeamOpen}>
          <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
            <CollapsibleTrigger asChild>
              <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center' }}>
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
                <OptimizedMatchesPlayerSelectionTable
                  teamId={match.homeTeamId}
                  matchDate={matchDate}
                  teamLabel={`${match.homeTeamName} (Thuis)`}
                  selections={homeTeamSelections}
                  selectedPlayerIds={homeSelectedPlayerIds}
                  onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, true)}
                  onCardChange={onCardChange}
                  playerCards={playerCards}
                  canEdit={canEditHome}
                  showRefereeFields={showRefereeFields}
                />
                <div className="mt-4">
                  <MatchesCaptainSelection
                    selections={homeTeamSelections}
                    onCaptainChange={(playerId) => handleCaptainChange(playerId?.toString() || "no-captain", true)}
                    canEdit={canEditHome}
                    teamLabel={`${match.homeTeamName} (Thuis)`}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Away Team Card */}
        <Collapsible open={awayTeamOpen} onOpenChange={setAwayTeamOpen}>
          <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
            <CollapsibleTrigger asChild>
              <CardHeader className="text-sm font-semibold hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center' }}>
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
                <OptimizedMatchesPlayerSelectionTable
                  teamId={match.awayTeamId}
                  matchDate={matchDate}
                  teamLabel={`${match.awayTeamName} (Uit)`}
                  selections={awayTeamSelections}
                  selectedPlayerIds={awaySelectedPlayerIds}
                  onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, false)}
                  onCardChange={onCardChange}
                  playerCards={playerCards}
                  canEdit={canEditAway}
                  showRefereeFields={showRefereeFields}
                />
                <div className="mt-4">
                  <MatchesCaptainSelection
                    selections={awayTeamSelections}
                    onCaptainChange={(playerId) => handleCaptainChange(playerId?.toString() || "no-captain", false)}
                    canEdit={canEditAway}
                    teamLabel={`${match.awayTeamName} (Uit)`}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
      
      {/* Save button for team managers */}
      <PlayerSelectionActions
        onSavePlayerSelection={handleSavePlayerSelection}
        isSubmittingPlayers={isSubmittingPlayers}
        canEdit={canEdit}
        isTeamManager={isTeamManager}
      />
    </div>
  );
};

export default React.memo(PlayerSelectionSection);
