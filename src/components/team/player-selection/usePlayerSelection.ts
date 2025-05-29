
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
  const [existingForm, setExistingForm] = useState<any | null>(null);

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
  
  // Fetch existing form data if it exists
  const { data: formData, isLoading: loadingForm } = useQuery({
    queryKey: ['matchForm', matchId, teamId],
    queryFn: async () => {
      try {
        const { data: formData, error: formError } = await supabase
          .from('match_forms')
          .select('form_id, is_submitted')
          .eq('match_id', matchId)
          .eq('team_id', teamId)
          .single();
        
        if (formError && formError.code !== 'PGRST116') {
          throw formError;
        }
        
        if (!formData) return null;
        
        const { data: playerData, error: playerError } = await supabase
          .from('match_form_players')
          .select('player_id, jersey_number, is_captain')
          .eq('form_id', formData.form_id);
        
        if (playerError) throw playerError;
        
        return {
          formId: formData.form_id,
          isSubmitted: formData.is_submitted,
          players: playerData.map(p => ({
            playerId: p.player_id,
            jerseyNumber: p.jersey_number,
            isCaptain: p.is_captain
          }))
        };
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
      if (formData && formData.players) {
        const initialPlayers = teamPlayers.map(player => {
          const existingPlayer = formData.players.find(p => p.playerId === player.playerId);
          return existingPlayer ? {
            ...player,
            selected: true,
            jerseyNumber: existingPlayer.jerseyNumber.toString(),
            isCaptain: existingPlayer.isCaptain
          } : player;
        });
        
        form.reset({ players: initialPlayers });
        setExistingForm(formData);
      } else {
        form.reset({ players: teamPlayers });
      }
    }
  }, [teamPlayers, formData, isLoading, loadingForm]);

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
      
      let formId;
      
      if (existingForm) {
        formId = existingForm.formId;
        
        if (!existingForm.isSubmitted) {
          const { error: updateError } = await supabase
            .from('match_forms')
            .update({ 
              is_submitted: true,
              updated_at: new Date().toISOString()
            })
            .eq('form_id', formId);
          
          if (updateError) throw updateError;
        }
        
        const { error: deleteError } = await supabase
          .from('match_form_players')
          .delete()
          .eq('form_id', formId);
        
        if (deleteError) throw deleteError;
      } else {
        const { data: newForm, error: createError } = await supabase
          .from('match_forms')
          .insert({
            match_id: matchId,
            team_id: teamId,
            is_submitted: true
          })
          .select('form_id')
          .single();
        
        if (createError) throw createError;
        formId = newForm.form_id;
      }
      
      const { error: insertError } = await supabase
        .from('match_form_players')
        .insert(
          selectedPlayers.map(player => ({
            form_id: formId,
            player_id: player.playerId,
            jersey_number: parseInt(player.jerseyNumber),
            is_captain: player.isCaptain
          }))
        );
      
      if (insertError) throw insertError;
      
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
