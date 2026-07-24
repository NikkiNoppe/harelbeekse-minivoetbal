
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { User } from "@/types/auth";

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
    onDelete(user.id);
  };

  return (
    <TableRow>
      <TableCell>{user.username}</TableCell>
      <TableCell>{getRoleName(user.role)}</TableCell>
      <TableCell>{user.role === "player_manager" ? teamName : "-"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="unstyled"
            onClick={() => onEdit(user)}
            className="btn btn--icon btn--edit"
            aria-label={`Bewerk ${user.username}`}
          >
            <Edit className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="unstyled"
            onClick={handleDelete}
            className="btn btn--icon btn--danger"
            aria-label={`Verwijder ${user.username}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
