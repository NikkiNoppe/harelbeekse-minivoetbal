
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../MINIVOETBAL.UI/components/ui/table";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { User, Edit, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "../../../MINIVOETBAL.UI/components/ui/skeleton";
import { Badge } from "../../../MINIVOETBAL.UI/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../MINIVOETBAL.UI/components/ui/tooltip";
import SearchInput from "../../../MINIVOETBAL.UI/components/ui/search-input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../MINIVOETBAL.UI/components/ui/select";
import { DbUser } from "./types";

interface UserListProps {
  users: DbUser[];
  loading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onEditUser?: (user: DbUser) => void;
  onDeleteUser?: (userId: number) => void;
  editMode?: boolean;
  // Search and filter props
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  teamFilter: string;
  onTeamFilterChange: (teamId: string) => void;
  teams: { team_id: number; team_name: string }[];
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  loading, 
  isUpdating,
  isDeleting,
  onEditUser, 
  onDeleteUser,
  editMode = false,
  // Search and filter props
  searchTerm,
  onSearchTermChange,
  roleFilter,
  onRoleFilterChange,
  teamFilter,
  onTeamFilterChange,
  teams
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <div className="mb-4 space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
        {/* Search by name */}
        <SearchInput
          placeholder="Zoeken op naam..."
          value={searchTerm}
          onChange={onSearchTermChange}
        />

        {/* Filter by role */}
        <Select
          value={roleFilter}
          onValueChange={onRoleFilterChange}
        >
          <SelectTrigger className="dropdown-login-style">
            <SelectValue placeholder="Alle rollen" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style">
            <SelectItem value="all" className="dropdown-item-login-style">Alle rollen</SelectItem>
            <SelectItem value="admin" className="dropdown-item-login-style">Administrator</SelectItem>
            <SelectItem value="player_manager" className="dropdown-item-login-style">Teamverantwoordelijke</SelectItem>
            <SelectItem value="referee" className="dropdown-item-login-style">Scheidsrechter</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by team */}
        <Select
          value={teamFilter}
          onValueChange={onTeamFilterChange}
          disabled={teams.length === 0}
        >
          <SelectTrigger className="dropdown-login-style">
            <SelectValue placeholder="Alle teams" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style">
            <SelectItem value="all" className="dropdown-item-login-style">Alle teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.team_id} value={team.team_id.toString()} className="dropdown-item-login-style">
                {team.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teams</TableHead>
              {editMode && <TableHead className="text-right w-24">Acties</TableHead>}
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
                  {editMode && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={editMode ? 5 : 4} className="text-center py-6">
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
                  {editMode && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser?.(user)}
                          className="h-8 w-8 p-0 bg-white text-purple-600 border-purple-400 hover:bg-purple-50"
                          disabled={isUpdating || isDeleting}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteUser?.(user.user_id)}
                          className="h-8 w-8 p-0 bg-white text-red-500 border-red-400 hover:bg-red-50 hover:text-red-700"
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
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserList;
