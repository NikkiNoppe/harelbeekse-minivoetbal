
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player, FormData, formSchema } from "./types";

export const usePlayerSelection = (matchId: number, teamId: number, onComplete: () => void) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Fetch team players
  const { data: teamPlayers, isLoading } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('player_id, first_name, last_name')
          .eq('team_id', teamId)
          .eq('is_active', true)
          .order('first_name');
        
        if (error) throw error;
        
        return data.map(player => ({
          playerId: player.player_id,
          playerName: `${player.first_name} ${player.last_name}`,
          selected: false,
          jerseyNumber: "",
          isCaptain: false
        }));
      } catch (error) {
        console.error("Error fetching team players:", error);
        toast({
          title: "Fout bij ophalen spelers",
          description: "Er is een probleem opgetreden bij het ophalen van de teamspelers.",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Check if there's already a match form for this team
  const { data: existingForm, isLoading: loadingForm } = useQuery({
    queryKey: ['matchForm', matchId, teamId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('match_forms')
          .select('form_id, is_submitted, home_players, away_players')
          .eq('match_id', matchId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching match form:", error);
        return null;
      }
    }
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { players: [] }
  });
  
  // Initialize form with team players and any existing selections
  useEffect(() => {
    if (teamPlayers && !isLoading) {
      let initialPlayers = teamPlayers;
      
      // If there's an existing form, try to populate from the JSONB data
      if (existingForm) {
        const isHomeTeam = true; // You might need to determine this based on your logic
        const existingPlayerData = isHomeTeam ? existingForm.home_players : existingForm.away_players;
        
        if (Array.isArray(existingPlayerData)) {
          initialPlayers = teamPlayers.map(player => {
            const existingPlayer = existingPlayerData.find((p: any) => p.playerId === player.playerId);
            if (existingPlayer) {
              return {
                ...player,
                selected: true,
                jerseyNumber: existingPlayer.jerseyNumber || "",
                isCaptain: existingPlayer.isCaptain || false
              };
            }
            return player;
          });
        }
      }
      
      form.reset({ players: initialPlayers });
    }
  }, [teamPlayers, existingForm, isLoading, loadingForm]);

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
      
      // Convert selected players to the format expected by match_forms
      const playerData = selectedPlayers.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        jerseyNumber: player.jerseyNumber,
        isCaptain: player.isCaptain
      }));
      
      // Determine if this is home or away team (you might need to adjust this logic)
      const isHomeTeam = true; // This should be determined based on your application logic
      
      const updateData = isHomeTeam 
        ? { home_players: playerData, is_submitted: true }
        : { away_players: playerData, is_submitted: true };
      
      // Update or insert the match form
      if (existingForm) {
        const { error } = await supabase
          .from('match_forms')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('form_id', existingForm.form_id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('match_forms')
          .insert({
            match_id: matchId,
            team_id: teamId,
            ...updateData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
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
    isLoading: isLoading || loadingForm,
    submitting,
    onSubmit,
    togglePlayerSelection,
    toggleCaptain
  };
};
