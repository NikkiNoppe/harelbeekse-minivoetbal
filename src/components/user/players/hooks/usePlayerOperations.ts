
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
    
    const success = await addPlayer(newPlayer.firstName, newPlayer.lastName, newPlayer.birthDate, selectedTeam);
    if (success) {
      setNewPlayer({firstName: "", lastName: "", birthDate: ""});
    }
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!editingPlayer) {
      console.error('No player selected for editing');
      return;
    }

    const success = await updatePlayer(
      editingPlayer.player_id,
      editingPlayer.firstName,
      editingPlayer.lastName,
      editingPlayer.birthDate
    );
    
    if (success) {
      setEditingPlayer(null);
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    await removePlayer(playerId);
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
