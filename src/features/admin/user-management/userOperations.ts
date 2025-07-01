
import { Team } from "./types";
import { useAddUser } from "./operations/useAddUser";
import { useUpdateUser } from "./operations/useUpdateUser";
import { useDeleteUser } from "./operations/useDeleteUser";

export const useUserOperations = (refreshData: () => Promise<void>) => {
  const { addUser } = useAddUser(refreshData);
  const { updateUser } = useUpdateUser(refreshData);
  const { deleteUser } = useDeleteUser(refreshData);

  return { addUser, updateUser, deleteUser };
};
