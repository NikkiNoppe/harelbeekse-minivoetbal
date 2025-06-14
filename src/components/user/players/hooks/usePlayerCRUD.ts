
import { useAddPlayer } from "./operations/useAddPlayer";
import { useUpdatePlayer } from "./operations/useUpdatePlayer";
import { useRemovePlayer } from "./operations/useRemovePlayer";

export const usePlayerCRUD = (refreshPlayers: () => Promise<void>) => {
  const { addPlayer } = useAddPlayer(refreshPlayers);
  const { updatePlayer } = useUpdatePlayer(refreshPlayers);
  const { removePlayer } = useRemovePlayer(refreshPlayers);

  return {
    addPlayer,
    updatePlayer,
    removePlayer
  };
};
