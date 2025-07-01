import { useToast } from "@shared/hooks/use-toast";
import { NewPlayerData } from "../types";
import { usePlayerCRUD } from "./usePlayerCRUD";

export const useAddPlayerOperation = (
  selectedTeam: number | null,
  refreshPlayers: () => Promise<void>,
  canEdit: boolean,
  showLockWarning: () => void,
  newPlayer: NewPlayerData,
  setNewPlayer: (player: NewPlayerData) => void
) => {
  const { toast } = useToast();
  const { addPlayer } = usePlayerCRUD(refreshPlayers);

  const handleAddPlayer = async (): Promise<boolean> => {
    if (!canEdit) {
      showLockWarning();
      return false;
    }

    if (!selectedTeam) {
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return false;
    }

    const success = await addPlayer(
      newPlayer.firstName,
      newPlayer.lastName,
      newPlayer.birthDate,
      selectedTeam
    );

    if (success) {
      setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
      return true;
    } else {
      return false;
    }
  };

  return { handleAddPlayer };
};
