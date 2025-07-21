
import { useState } from "react";
import { NewPlayerData, EditingPlayerData } from "../types";
import { usePlayerListLock } from "./usePlayerListLock";
import { usePlayerLockToast } from "./usePlayerLockToast";
import { useAddPlayerOperation } from "./useAddPlayerOperation";
import { useEditPlayerOperation } from "./useEditPlayerOperation";
import { useRemovePlayerOperation } from "./useRemovePlayerOperation";
import { useToast } from "@/hooks/use-toast";

export const usePlayerOperations = (selectedTeam: number | null, refreshPlayers: () => Promise<void>) => {
  const { canEdit, isLocked, lockDate } = usePlayerListLock();
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    firstName: "",
    lastName: "",
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayerData | null>(null);

  const { showLockWarning } = usePlayerLockToast(isLocked, lockDate);
  const { toast } = useToast();

  const { handleAddPlayer } = useAddPlayerOperation(
    selectedTeam, refreshPlayers, canEdit, showLockWarning, newPlayer, setNewPlayer
  );

  const { handleSaveEditedPlayer } = useEditPlayerOperation(
    refreshPlayers, canEdit, showLockWarning, editingPlayer, setEditingPlayer, toast
  );

  const { handleRemovePlayer } = useRemovePlayerOperation(
    refreshPlayers, canEdit, showLockWarning
  );

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
