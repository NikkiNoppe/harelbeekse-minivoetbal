
import { useAddPlayer } from "./operations/useAddPlayer";
import { useUpdatePlayer } from "./operations/useUpdatePlayer";
import { useRemovePlayer } from "./operations/useRemovePlayer";

export const usePlayerCRUD = (refreshPlayers: () => Promise<void>) => {
  const { addPlayer, isAdding } = useAddPlayer(refreshPlayers);
  const { updatePlayer, isUpdating } = useUpdatePlayer(refreshPlayers);
  const { removePlayer, isRemoving } = useRemovePlayer(refreshPlayers);

  return {
    addPlayer,
    updatePlayer,
    removePlayer,
    isAdding,
    isUpdating,
    isRemoving
  };
};
