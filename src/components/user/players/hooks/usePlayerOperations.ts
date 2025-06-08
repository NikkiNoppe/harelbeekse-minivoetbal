
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewPlayerData, EditingPlayerData } from "../types";
import { usePlayerListLock } from "./usePlayerListLock";

export const usePlayerOperations = (selectedTeam: number | null, refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { canEdit, isLocked, lockDate } = usePlayerListLock();
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    firstName: "", 
    lastName: "",
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayerData | null>(null);
  
  // Check if player already exists in any team
  const checkPlayerExists = async (firstName: string, lastName: string, birthDate: string, excludePlayerId?: number) => {
    try {
      let query = supabase
        .from('players')
        .select(`
          player_id, 
          first_name, 
          last_name, 
          birth_date, 
          team_id,
          teams!inner(team_name)
        `)
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim())
        .eq('birth_date', birthDate)
        .eq('is_active', true);

      if (excludePlayerId) {
        query = query.neq('player_id', excludePlayerId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking player existence:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking player existence:', error);
      return null;
    }
  };

  // Show lock warning if user tries to edit while locked
  const showLockWarning = () => {
    if (isLocked && lockDate) {
      toast({
        title: "Spelerslijst vergrendeld",
        description: `Wijzigingen zijn niet toegestaan vanaf ${new Date(lockDate).toLocaleDateString('nl-NL')}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Spelerslijst vergrendeld",
        description: "Wijzigingen zijn momenteel niet toegestaan",
        variant: "destructive",
      });
    }
  };
  
  // Handle add new player
  const handleAddPlayer = async () => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!selectedTeam) {
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPlayer.firstName.trim() || !newPlayer.lastName.trim() || !newPlayer.birthDate) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    // Check if player already exists
    const existingPlayer = await checkPlayerExists(newPlayer.firstName, newPlayer.lastName, newPlayer.birthDate);
    
    if (existingPlayer) {
      const teamName = existingPlayer.teams?.team_name || 'onbekend team';
      toast({
        title: "Speler bestaat al",
        description: `${newPlayer.firstName} ${newPlayer.lastName} is al ingeschreven bij ${teamName}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .insert({
          first_name: newPlayer.firstName.trim(),
          last_name: newPlayer.lastName.trim(),
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
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!editingPlayer) return;

    if (!editingPlayer.firstName.trim() || !editingPlayer.lastName.trim() || !editingPlayer.birthDate) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    // Check if player already exists (excluding current player)
    const existingPlayer = await checkPlayerExists(
      editingPlayer.firstName, 
      editingPlayer.lastName, 
      editingPlayer.birthDate, 
      editingPlayer.player_id
    );
    
    if (existingPlayer) {
      const teamName = existingPlayer.teams?.team_name || 'onbekend team';
      toast({
        title: "Speler bestaat al",
        description: `${editingPlayer.firstName} ${editingPlayer.lastName} is al ingeschreven bij ${teamName}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .update({
          first_name: editingPlayer.firstName.trim(),
          last_name: editingPlayer.lastName.trim(),
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
    if (!canEdit) {
      showLockWarning();
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
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
    handleRemovePlayer,
    canEdit,
    isLocked,
    lockDate
  };
};
