
import { useToast } from "@/hooks/use-toast";
import { EditingPlayerData } from "../types";
import { usePlayerCRUD } from "./usePlayerCRUD";

export const useEditPlayerOperation = (
  refreshPlayers: () => Promise<void>,
  canEdit: boolean,
  showLockWarning: () => void,
  editingPlayer: EditingPlayerData | null,
  setEditingPlayer: (player: EditingPlayerData | null) => void,
  setEditDialogOpen: (open: boolean) => void,
  toast: any
) => {
  const { updatePlayer } = usePlayerCRUD(refreshPlayers);

  const handleSaveEditedPlayer = async () => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!editingPlayer) {
      toast({
        title: "Geen speler geselecteerd",
        description: "Er is geen speler geselecteerd om te bewerken",
        variant: "destructive",
      });
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
      setEditDialogOpen(false); // Close the edit dialog
    }
  };

  return { handleSaveEditedPlayer };
};
