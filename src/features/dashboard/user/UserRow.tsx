import React from "react";
import { TableRow, TableCell } from "@shared/components/ui/table";
import { Button } from "@shared/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { User } from "@shared/types/auth";

interface UserRowProps {
  user: User;
  teamName: string;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, teamName, onEdit, onDelete }) => {
  const getRoleName = (role: string) => {
    switch (role) {
      case "admin": return "Beheerder";
      case "player_manager": return "Team";
      case "referee": return "Scheidsrechter";
      default: return role;
    }
  };

  const handleDelete = () => {
    console.log('🗑️ UserRow delete button clicked for user:', {
      id: user.id,
      username: user.username
    });
    onDelete(user.id);
  };

  return (
    <TableRow>
      <TableCell>{user.username}</TableCell>
      <TableCell>{getRoleName(user.role)}</TableCell>
      <TableCell>{user.role === "player_manager" ? teamName : "-"}</TableCell>
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
            onClick={handleDelete}
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
