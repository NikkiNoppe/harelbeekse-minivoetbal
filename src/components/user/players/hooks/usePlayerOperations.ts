
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NewPlayerData, EditingPlayerData } from "../types";
import { usePlayerListLock } from "./usePlayerListLock";
import { usePlayerCRUD } from "./usePlayerCRUD";

export const usePlayerOperations = (selectedTeam: number | null, refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { canEdit, isLocked, lockDate } = usePlayerListLock();
  const { addPlayer, updatePlayer, removePlayer } = usePlayerCRUD(refreshPlayers);
  
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    firstName: "", 
    lastName: "",
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayerData | null>(null);

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
    console.log('🎯 handleAddPlayer called - canEdit:', canEdit, 'isLocked:', isLocked);
    
    if (!canEdit) {
      console.warn('⚠️ Cannot edit - showing lock warning');
      showLockWarning();
      return;
    }

    if (!selectedTeam) {
      console.error('❌ No team selected');
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return;
    }

    console.log('📝 Adding player:', newPlayer, 'to team:', selectedTeam);
    
    const success = await addPlayer(newPlayer.firstName, newPlayer.lastName, newPlayer.birthDate, selectedTeam);
    if (success) {
      setNewPlayer({firstName: "", lastName: "", birthDate: ""});
    }
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    console.log('🎯 handleSaveEditedPlayer called - canEdit:', canEdit, 'isLocked:', isLocked);
    
    if (!canEdit) {
      console.warn('⚠️ Cannot edit - showing lock warning');
      showLockWarning();
      return;
    }

    if (!editingPlayer) {
      console.error('❌ No player selected for editing');
      toast({
        title: "Geen speler geselecteerd",
        description: "Er is geen speler geselecteerd om te bewerken",
        variant: "destructive",
      });
      return;
    }

    console.log('📝 Updating player with data:', {
      player_id: editingPlayer.player_id,
      firstName: editingPlayer.firstName,
      lastName: editingPlayer.lastName,
      birthDate: editingPlayer.birthDate
    });

    const success = await updatePlayer(
      editingPlayer.player_id,
      editingPlayer.firstName,
      editingPlayer.lastName,
      editingPlayer.birthDate
    );
    
    if (success) {
      setEditingPlayer(null);
      // Force a refresh to see the changes immediately
      await refreshPlayers();
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    console.log('🎯 handleRemovePlayer called for player:', playerId, '- canEdit:', canEdit, 'isLocked:', isLocked);
    
    if (!canEdit) {
      console.warn('⚠️ Cannot edit - showing lock warning');
      showLockWarning();
      return;
    }

    console.log('🗑️ Removing player:', playerId);
    const success = await removePlayer(playerId);
    if (success) {
      // Force a refresh to see the changes immediately
      await refreshPlayers();
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
