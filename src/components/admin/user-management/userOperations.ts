
import { Team } from "./types";
import { useAddUser } from "./operations/useAddUser";
import { useUpdateUser } from "./operations/useUpdateUser";
import { useDeleteUser } from "./operations/useDeleteUser";

export const useUserOperations = (teams: Team[], refreshData: () => Promise<void>) => {
  const { addUser } = useAddUser(teams, refreshData);
  const { updateUser } = useUpdateUser(teams, refreshData);
  const { deleteUser } = useDeleteUser(refreshData);

  return { addUser, updateUser, deleteUser };
};
