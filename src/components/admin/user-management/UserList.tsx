
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash2 } from "lucide-react";

interface DbUser {
  user_id: number;
  username: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
}

interface UserListProps {
  users: DbUser[];
  loading: boolean;
  onEditUser: (user: DbUser) => void;
  onDeleteUser: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({ users, loading, onEditUser, onDeleteUser }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                Gebruikers laden...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                Geen gebruikers gevonden
              </TableCell>
            </TableRow>
          ) : (
            users.map(user => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user.username}
                  </div>
                </TableCell>
                <TableCell>
                  {user.role === "admin" && "Administrator"}
                  {user.role === "player_manager" && "Teamverantwoordelijke"}
                  {user.role === "referee" && "Scheidsrechter"}
                </TableCell>
                <TableCell>
                  {user.team_name || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Bewerken</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(user.user_id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Verwijderen</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;
