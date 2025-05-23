
import React, { useState, useEffect } from "react";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, UserPlus, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface PlayerSelectionFormProps {
  matchId: number;
  teamId: number;
  teamName: string;
  isHomeTeam: boolean;
  onComplete: () => void;
}

interface Player {
  playerId: number;
  playerName: string;
  selected: boolean;
  jerseyNumber: string;
  isCaptain: boolean;
}

const formSchema = z.object({
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

type FormData = z.infer<typeof formSchema>;

const PlayerSelectionForm: React.FC<PlayerSelectionFormProps> = ({ 
  matchId, 
  teamId, 
  teamName,
  isHomeTeam,
  onComplete
}) => {
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
          .select('player_id, player_name')
          .eq('team_id', teamId)
          .eq('is_active', true)
          .order('player_name');
        
        if (error) throw error;
        
        return data.map(player => ({
          playerId: player.player_id,
          playerName: player.player_name,
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
        // First check if there's an existing form
        const { data: formData, error: formError } = await supabase
          .from('match_forms')
          .select('form_id, is_submitted')
          .eq('match_id', matchId)
          .eq('team_id', teamId)
          .single();
        
        if (formError && formError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw formError;
        }
        
        if (!formData) return null;
        
        // If form exists, get the player selections
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
    defaultValues: {
      players: []
    }
  });
  
  // Initialize form with team players and any existing selections
  useEffect(() => {
    if (teamPlayers && !isLoading) {
      if (formData && formData.players) {
        // Merge team players with existing selections
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
  
  // Submit the form to save player selections
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
      
      // Create or update the match form
      let formId;
      
      if (existingForm) {
        formId = existingForm.formId;
        
        // Update the existing form status if needed
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
        
        // Delete existing player selections to replace with new ones
        const { error: deleteError } = await supabase
          .from('match_form_players')
          .delete()
          .eq('form_id', formId);
        
        if (deleteError) throw deleteError;
      } else {
        // Create a new form
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
      
      // Insert the player selections
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
  
  // Toggle player selection
  const togglePlayerSelection = (index: number, selected: boolean) => {
    const currentPlayers = form.getValues().players;
    
    // Count how many players are already selected
    const selectedCount = currentPlayers.filter(p => p.selected).length;
    
    // If we're trying to select a new player and already have 8, show an error
    if (selected && selectedCount >= 8 && !currentPlayers[index].selected) {
      toast({
        title: "Maximaal 8 spelers",
        description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
        variant: "destructive"
      });
      return;
    }
    
    // If we're unselecting the captain, need to clear that flag
    if (!selected && currentPlayers[index].isCaptain) {
      form.setValue(`players.${index}.isCaptain`, false);
    }
    
    // Update the selected state
    form.setValue(`players.${index}.selected`, selected);
  };
  
  // Toggle captain selection
  const toggleCaptain = (index: number) => {
    const currentPlayers = form.getValues().players;
    const isCaptain = !currentPlayers[index].isCaptain;
    
    // If this player is becoming a captain, unset any other captains
    if (isCaptain) {
      currentPlayers.forEach((_, i) => {
        if (i !== index) {
          form.setValue(`players.${i}.isCaptain`, false);
        }
      });
    }
    
    form.setValue(`players.${index}.isCaptain`, isCaptain);
  };
  
  if (isLoading || loadingForm) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Spelersinformatie laden...</span>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
            <h3 className="text-lg font-medium">Selecteer spelers voor {teamName}</h3>
            <div className="text-sm bg-muted p-2 rounded flex items-center gap-2">
              <span className="font-semibold text-md">
                {form.watch('players').filter(p => p.selected).length}
                <span className="text-primary">/8</span>
              </span> 
              <span>spelers geselecteerd</span>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <h4 className="font-medium mb-2">Instructies:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Selecteer maximaal 8 spelers voor deze wedstrijd</li>
              <li>Vul voor elke geselecteerde speler het rugnummer in (1-99)</li>
              <li>Duid één speler aan als kapitein</li>
            </ul>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Selectie</TableHead>
                  <TableHead>Speler</TableHead>
                  <TableHead className="w-24 text-center">Rugnr.</TableHead>
                  <TableHead className="w-24 text-center">Kapitein</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.watch('players').map((player, index) => (
                  <TableRow key={player.playerId} className={player.selected ? "bg-muted/40" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={player.selected}
                        onCheckedChange={(checked) => {
                          togglePlayerSelection(index, checked === true);
                        }}
                      />
                    </TableCell>
                    <TableCell>{player.playerName}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Input 
                          type="number"
                          min={1}
                          max={99}
                          disabled={!player.selected}
                          {...form.register(`players.${index}.jerseyNumber`)}
                          className="w-16 text-center"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={player.isCaptain}
                          disabled={!player.selected}
                          onCheckedChange={() => toggleCaptain(index)}
                          className={player.isCaptain ? "border-primary" : ""}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {form.watch('players').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Geen spelers gevonden voor dit team.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {form.formState.errors.players && (
            <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                {form.formState.errors.players.message}
              </p>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Formulier opslaan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default PlayerSelectionForm;
