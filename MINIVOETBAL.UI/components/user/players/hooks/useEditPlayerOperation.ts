
import { useToast } from "../../../../hooks/use-toast";
import { EditingPlayerData } from "../types";
import { usePlayerCRUD } from "./usePlayerCRUD";

export const useEditPlayerOperation = (
  refreshPlayers: () => Promise<void>,
  canEdit: boolean,
  showLockWarning: () => void,
  editingPlayer: EditingPlayerData | null,
  setEditingPlayer: (player: EditingPlayerData | null) => void,
  toast: any
) => {
  const { updatePlayer } = usePlayerCRUD(refreshPlayers);

  const handleSaveEditedPlayer = async () => {
    console.log('🎯 SAVE EDIT FUNCTION CALLED');
    console.log('📊 Edit context:', {
      canEdit,
      editingPlayer,
      hasPlayer: !!editingPlayer
    });

    if (!canEdit) {
      console.log('❌ Cannot edit - locked');
      showLockWarning();
      return;
    }

    if (!editingPlayer) {
      console.log('❌ No player selected');
      toast({
        title: "Geen speler geselecteerd",
        description: "Er is geen speler geselecteerd om te bewerken",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Starting update for player:', editingPlayer.player_id);
    const success = await updatePlayer(
      editingPlayer.player_id,
      editingPlayer.firstName,
      editingPlayer.lastName,
      editingPlayer.birthDate
    );

    console.log('📊 Update result:', success);

    if (success) {
      setEditingPlayer(null);
      console.log('✅ Edit dialog closed');
    }
  };

  return { handleSaveEditedPlayer };
};
