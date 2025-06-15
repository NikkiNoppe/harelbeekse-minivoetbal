import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NewPlayerData, EditingPlayerData } from "../types";
import { usePlayerListLock } from "./usePlayerListLock";
import { usePlayerCRUD } from "./usePlayerCRUD";

export const usePlayerOperations = (selectedTeam: number | null, refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { canEdit, isLocked, lockDate } = usePlayerListLock();
  const { addPlayer, updatePlayer, removePlayer } = usePlayerCRUD(refreshPlayers);
  
  console.log('🎯 usePlayerOperations initialized with:', {
    selectedTeam,
    canEdit,
    isLocked,
    lockDate,
    hasAddPlayer: !!addPlayer,
    hasUpdatePlayer: !!updatePlayer,
    hasRemovePlayer: !!removePlayer
  });
  
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
  const handleAddPlayer = async (): Promise<boolean> => {
    console.log('🎯 handleAddPlayer called - START');
    console.log('📊 Current state:', {
      canEdit,
      isLocked,
      selectedTeam,
      newPlayer,
      timestamp: new Date().toISOString()
    });

    if (!canEdit) {
      console.warn('⚠️ Cannot edit - showing lock warning');
      showLockWarning();
      return false;
    }

    if (!selectedTeam) {
      console.error('❌ No team selected');
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return false;
    }

    console.log('📝 Calling addPlayer function with data:', {
      firstName: newPlayer.firstName,
      lastName: newPlayer.lastName,
      birthDate: newPlayer.birthDate,
      teamId: selectedTeam
    });

    try {
      const success = await addPlayer(newPlayer.firstName, newPlayer.lastName, newPlayer.birthDate, selectedTeam);
      console.log('📊 Add player result:', success);

      if (success) {
        console.log('✅ Add successful, clearing form');
        setNewPlayer({firstName: "", lastName: "", birthDate: ""});
        return true;
      } else {
        console.error('❌ Add failed');
        return false;
      }
    } catch (error) {
      console.error('💥 Error in handleAddPlayer:', error);
      return false;
    }
    // (no code should reach here, but for TS strictness)
    // return false;
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    console.log('🎯 SAVE PLAYER OPERATION START');
    console.log('📊 Current state:', {
      canEdit,
      isLocked,
      editingPlayerExists: !!editingPlayer,
      editingPlayerData: editingPlayer
    });
    
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

    console.log('🔄 CALLING updatePlayer with transformed data:', {
      player_id: editingPlayer.player_id,
      firstName: editingPlayer.firstName,
      lastName: editingPlayer.lastName,
      birthDate: editingPlayer.birthDate
    });

    try {
      const success = await updatePlayer(
        editingPlayer.player_id,
        editingPlayer.firstName,
        editingPlayer.lastName,
        editingPlayer.birthDate
      );
      
      console.log('📊 Update result:', success);
      
      if (success) {
        console.log('✅ Update successful, clearing editing state and refreshing');
        setEditingPlayer(null);
        
        // Force refresh and log the process
        console.log('🔄 Starting data refresh...');
        await refreshPlayers();
        console.log('✅ Data refresh completed');
        
        toast({
          title: "Speler bijgewerkt",
          description: `${editingPlayer.firstName} ${editingPlayer.lastName} is succesvol bijgewerkt`,
        });
      } else {
        console.error('❌ Update failed');
      }
    } catch (error) {
      console.error('💥 Error in handleSaveEditedPlayer:', error);
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    console.log('🎯 REMOVE PLAYER OPERATION START');
    console.log('📊 Remove player state:', {
      canEdit,
      isLocked,
      playerId
    });
    
    if (!canEdit) {
      console.warn('⚠️ Cannot edit - showing lock warning');
      showLockWarning();
      return;
    }

    console.log('🗑️ Calling removePlayer for ID:', playerId);
    
    try {
      const success = await removePlayer(playerId);
      console.log('📊 Remove result:', success);
      
      if (success) {
        console.log('✅ Remove successful, refreshing data');
        // Force a refresh to see the changes immediately
        console.log('🔄 Starting data refresh after removal...');
        await refreshPlayers();
        console.log('✅ Data refresh after removal completed');
      } else {
        console.error('❌ Remove failed');
      }
    } catch (error) {
      console.error('💥 Error in handleRemovePlayer:', error);
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
