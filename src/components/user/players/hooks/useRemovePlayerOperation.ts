
import { usePlayerCRUD } from "./usePlayerCRUD";

export const useRemovePlayerOperation = (
  refreshPlayers: () => Promise<void>,
  canEdit: boolean,
  showLockWarning: () => void,
) => {
  const { removePlayer } = usePlayerCRUD(refreshPlayers);

  const handleRemovePlayer = async (playerId: number) => {
    if (!canEdit) {
      showLockWarning();
      return;
    }
    await removePlayer(playerId);
  };

  return { handleRemovePlayer };
};
