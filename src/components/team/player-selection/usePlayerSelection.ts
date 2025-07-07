
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player, FormData, formSchema } from "./types";

// Define a simplified type for existing player data from the database
interface ExistingPlayerData {
  playerId: number;
  playerName: string;
  jerseyNumber: string;
  isCaptain: boolean;
}

export const usePlayerSelection = (matchId: number, teamId: number, onComplete: () => void) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Fetch team players function
  const fetchTeamPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name')
      .eq('team_id', teamId)
      .order('first_name');
    
    if (error) {
      console.error("Error fetching team players:", error);
      toast({
        title: "Fout bij ophalen spelers",
        description: "Er is een probleem opgetreden bij het ophalen van de teamspelers.",
        variant: "destructive"
      });
      throw error;
    }
    
    return (data || []).map((dbPlayer) => ({
      playerId: dbPlayer.player_id,
      playerName: `${dbPlayer.first_name} ${dbPlayer.last_name}`,
      selected: false,
      jerseyNumber: "",
      isCaptain: false
    }));
  };

  const fetchMatchData = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('match_id, is_submitted, home_players, away_players, home_team_id, away_team_id')
      .eq('match_id', matchId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching match data:", error);
      throw error;
    }
    
    return data;
  };

  // Use React Query without explicit typing to avoid deep instantiation
  const {
    data: teamPlayers,
    isLoading
  } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: fetchTeamPlayers
  });
  
  const {
    data: existingMatch,
    isLoading: loadingMatch
  } = useQuery({
    queryKey: ['matchData', matchId, teamId],
    queryFn: fetchMatchData
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { players: [] }
  });
  
  useEffect(() => {
    if (teamPlayers && !isLoading) {
      let initialPlayers = teamPlayers;
      
      if (existingMatch) {
        const isHomeTeam = existingMatch.home_team_id === teamId;
        const existingPlayerData = isHomeTeam ? existingMatch.home_players : existingMatch.away_players;
        
        if (Array.isArray(existingPlayerData)) {
          initialPlayers = teamPlayers.map(player => {
            const existingPlayer = existingPlayerData.find((p: any) => {
              return p && typeof p === 'object' && !Array.isArray(p) && 
                     'playerId' in p && p.playerId === player.playerId;
            });
            
            if (existingPlayer && typeof existingPlayer === 'object' && !Array.isArray(existingPlayer)) {
              const playerData = existingPlayer as Record<string, any>;
              return {
                ...player,
                selected: true,
                jerseyNumber: String(playerData.jerseyNumber || ""),
                isCaptain: Boolean(playerData.isCaptain || false)
              };
            }
            return player;
          });
        }
      }
      
      form.reset({ players: initialPlayers });
    }
  }, [teamPlayers, existingMatch, isLoading, loadingMatch, form, teamId]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      const selectedPlayers = data.players.filter(p => p.selected);
      
      if (selectedPlayers.length === 0) {
        toast({
          title: "Geen spelers geselecteerd",
          description: "Selecteer ten minste één speler voor het formulier.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      if (selectedPlayers.length > 8) {
        toast({
          title: "Te veel spelers",
          description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      const playersWithoutJersey = selectedPlayers.filter(p => !p.jerseyNumber.trim());
      if (playersWithoutJersey.length > 0) {
        toast({
          title: "Ontbrekende rugnummers",
          description: "Alle geselecteerde spelers moeten een rugnummer hebben.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      const invalidJerseyNumbers = selectedPlayers.filter(p => {
        const num = parseInt(p.jerseyNumber);
        return isNaN(num) || num < 1 || num > 99;
      });
      if (invalidJerseyNumbers.length > 0) {
        toast({
          title: "Ongeldige rugnummers",
          description: "Rugnummers moeten tussen 1 en 99 zijn.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      if (!selectedPlayers.some(p => p.isCaptain)) {
        toast({
          title: "Geen kapitein aangeduid",
          description: "Er moet een kapitein aangeduid worden.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      const playerData = selectedPlayers.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        jerseyNumber: player.jerseyNumber,
        isCaptain: player.isCaptain
      }));
      
      const isHomeTeam = existingMatch?.home_team_id === teamId;
      
      const updateData = isHomeTeam 
        ? { home_players: playerData, is_submitted: true }
        : { away_players: playerData, is_submitted: true };
      
      const { error } = await supabase
        .from('matches')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('match_id', matchId);
      
      if (error) throw error;
      
      toast({
        title: "Formulier opgeslagen",
        description: "Het wedstrijdformulier is succesvol ingediend."
      });
      
      onComplete();
    } catch (error) {
      console.error("Error submitting match form:", error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een probleem opgetreden bij het opslaan van het formulier.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlayerSelection = (index: number, selected: boolean) => {
    const currentPlayers = form.getValues().players;
    const selectedCount = currentPlayers.filter(p => p.selected).length;
    
    if (selected && selectedCount >= 8 && !currentPlayers[index].selected) {
      toast({
        title: "Maximaal 8 spelers",
        description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selected && currentPlayers[index].isCaptain) {
      form.setValue(`players.${index}.isCaptain`, false);
    }
    
    form.setValue(`players.${index}.selected`, selected);
  };
  
  const toggleCaptain = (index: number) => {
    const currentPlayers = form.getValues().players;
    const isCaptain = !currentPlayers[index].isCaptain;
    
    if (isCaptain) {
      currentPlayers.forEach((_, i) => {
        if (i !== index) {
          form.setValue(`players.${i}.isCaptain`, false);
        }
      });
    }
    
    form.setValue(`players.${index}.isCaptain`, isCaptain);
  };

  return {
    form,
    isLoading: isLoading || loadingMatch,
    submitting,
    onSubmit,
    togglePlayerSelection,
    toggleCaptain
  };
};
