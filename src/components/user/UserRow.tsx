
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { User } from "@/components/auth/AuthProvider";

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{user.username}</TableCell>
      <TableCell>
        {user.role === "admin" && "Administrator"}
        {user.role === "team" && "Teamverantwoordelijke"}
        {user.role === "referee" && "Scheidsrechter"}
      </TableCell>
      <TableCell>
        {user.teamId ? `Team ${user.teamId}` : "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/10"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
