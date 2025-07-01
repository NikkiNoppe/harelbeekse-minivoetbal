
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player, FormData, formSchema } from "./types";

interface DatabasePlayer {
  player_id: number;
  first_name: string;
  last_name: string;
}

interface MatchQueryResult {
  match_id: number;
  is_submitted: boolean;
  home_players: any;
  away_players: any;
  home_team_id: number;
  away_team_id: number;
}

export const usePlayerSelection = (matchId: number, teamId: number, onComplete: () => void) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Fetch team players with simplified query structure
  const fetchTeamPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name')
      .eq('team_id', teamId)
      .eq('is_active', true)
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
    
    // Transform to Player format
    const players: Player[] = (data || []).map((dbPlayer: DatabasePlayer) => ({
      playerId: dbPlayer.player_id,
      playerName: `${dbPlayer.first_name} ${dbPlayer.last_name}`,
      selected: false,
      jerseyNumber: "",
      isCaptain: false
    }));
    
    return players;
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
    
    return data as MatchQueryResult | null;
  };

  const teamPlayersQuery = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: fetchTeamPlayers
  });
  
  const matchQuery = useQuery({
    queryKey: ['matchData', matchId, teamId],
    queryFn: fetchMatchData
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { players: [] }
  });
  
  // Use the simplified query results
  const teamPlayers = teamPlayersQuery.data;
  const isLoading = teamPlayersQuery.isLoading;
  const existingMatch = matchQuery.data;
  const loadingMatch = matchQuery.isLoading;
  
  // Initialize form with team players and any existing selections
  useEffect(() => {
    if (teamPlayers && !isLoading) {
      let initialPlayers: Player[] = teamPlayers;
      
      // If there's an existing match, try to populate from the JSONB data
      if (existingMatch) {
        const isHomeTeam = existingMatch.home_team_id === teamId;
        const existingPlayerData = isHomeTeam ? existingMatch.home_players : existingMatch.away_players;
        
        if (Array.isArray(existingPlayerData)) {
          initialPlayers = teamPlayers.map(player => {
            const existingPlayer = existingPlayerData.find((p: any) => p.playerId === player.playerId);
            if (existingPlayer && typeof existingPlayer === 'object' && existingPlayer !== null) {
              return {
                ...player,
                selected: true,
                jerseyNumber: (existingPlayer as any).jerseyNumber || "",
                isCaptain: (existingPlayer as any).isCaptain || false
              };
            }
            return player;
          });
        }
      }
      
      form.reset({ players: initialPlayers });
    }
  }, [teamPlayers, existingMatch, isLoading, loadingMatch, form]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      const selectedPlayers = data.players.filter(p => p.selected);
      
      if (selectedPlayers.length === 0) {
        toast({
          title: "Geen spelers geselecteer",
          description: "Selecteer ten minste één speler voor het formulier.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // Convert selected players to the format expected by matches table
      const playerData = selectedPlayers.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        jerseyNumber: player.jerseyNumber,
        isCaptain: player.isCaptain
      }));
      
      // Determine if this is home or away team
      const isHomeTeam = existingMatch?.home_team_id === teamId;
      
      const updateData = isHomeTeam 
        ? { home_players: playerData, is_submitted: true }
        : { away_players: playerData, is_submitted: true };
      
      // Update the match with player data
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
