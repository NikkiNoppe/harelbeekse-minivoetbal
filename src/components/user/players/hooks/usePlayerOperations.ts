
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewPlayerData, EditingPlayerData } from "../types";

export const usePlayerOperations = (selectedTeam: number | null, refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    firstName: "", 
    lastName: "",
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayerData | null>(null);
  
  // Handle add new player
  const handleAddPlayer = async () => {
    if (!selectedTeam) {
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.birthDate) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players' as any)
        .insert({
          first_name: newPlayer.firstName,
          last_name: newPlayer.lastName,
          birth_date: newPlayer.birthDate,
          team_id: selectedTeam,
          is_active: true
        });
      
      if (error) throw error;
      
      await refreshPlayers();
      setNewPlayer({firstName: "", lastName: "", birthDate: ""});
      
      toast({
        title: "Speler toegevoegd",
        description: `${newPlayer.firstName} ${newPlayer.lastName} is toegevoegd aan het team`,
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    if (!editingPlayer) return;
    
    try {
      const { error } = await supabase
        .from('players' as any)
        .update({
          first_name: editingPlayer.firstName,
          last_name: editingPlayer.lastName,
          birth_date: editingPlayer.birthDate
        })
        .eq('player_id', editingPlayer.player_id);
      
      if (error) throw error;
      
      await refreshPlayers();
      setEditingPlayer(null);
      
      toast({
        title: "Speler bijgewerkt",
        description: "De gegevens van de speler zijn bijgewerkt",
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    try {
      const { error } = await supabase
        .from('players' as any)
        .update({ is_active: false })
        .eq('player_id', playerId);
      
      if (error) throw error;
      
      await refreshPlayers();
      
      toast({
        title: "Speler verwijderd",
        description: "De speler is verwijderd uit het team",
      });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
    }
  };

  return {
    newPlayer,
    setNewPlayer,
    editingPlayer,
    setEditingPlayer,
    handleAddPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer
  };
};
