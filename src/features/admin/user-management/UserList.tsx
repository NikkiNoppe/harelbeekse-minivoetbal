
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
import { User, Edit, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DbUser {
  user_id: number;
  username: string;
  email?: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
  teams?: { team_id: number; team_name: string }[];
}

interface UserListProps {
  users: DbUser[];
  loading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onEditUser: (user: DbUser) => void;
  onDeleteUser: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  loading, 
  isUpdating,
  isDeleting,
  onEditUser, 
  onDeleteUser 
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead className="text-right w-24">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
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
                <TableCell className="text-muted-foreground">
                  {user.email || "-"}
                </TableCell>
                <TableCell>
                  {user.role === "admin" && "Administrator"}
                  {user.role === "player_manager" && "Teamverantwoordelijke"}
                  {user.role === "referee" && "Scheidsrechter"}
                </TableCell>
                <TableCell>
                  {user.teams && user.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.teams.length <= 2 ? (
                        // Show all teams if 2 or fewer
                        user.teams.map(team => (
                          <Badge key={team.team_id} variant="outline" className="bg-slate-50">
                            {team.team_name}
                          </Badge>
                        ))
                      ) : (
                        // Show first team and count for more than 2
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="bg-slate-50">
                                  {user.teams[0].team_name}
                                </Badge>
                                <Badge variant="secondary">
                                  +{user.teams.length - 1}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {user.teams.map(team => (
                                  <div key={team.team_id}>{team.team_name}</div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      className="h-8 w-8 p-0"
                      disabled={isUpdating || isDeleting}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(user.user_id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      disabled={isUpdating || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
