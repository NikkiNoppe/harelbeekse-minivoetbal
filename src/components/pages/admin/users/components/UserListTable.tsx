
import React, { useState } from "react";
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
import SearchInput from "@/components/ui/search-input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AppAlertModal } from "@/components/modals";
import { DbUser } from "../userTypes";

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
  addUserButton?: React.ReactNode;
}

const UserListTable: React.FC<UserListProps> = ({ 
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
  teams,
  addUserButton
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DbUser | null>(null);

  const handleDeleteClick = (user: DbUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete && onDeleteUser) {
      onDeleteUser(userToDelete.user_id);
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <div className="space-y-4">
        {/* Mobile: Stacked layout */}
        <div className="block md:hidden space-y-3">
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
            <SelectTrigger className="dropdown-login-style w-full">
              <SelectValue placeholder="Alle rollen" />
            </SelectTrigger>
            <SelectContent className="dropdown-content-login-style">
              <SelectItem value="all" className="dropdown-item-login-style">Alle rollen</SelectItem>
              <SelectItem value="admin" className="dropdown-item-login-style">Administrator</SelectItem>
              <SelectItem value="player_manager" className="dropdown-item-login-style">Teamverantwoordelijke</SelectItem>
              <SelectItem value="referee" className="dropdown-item-login-style">Scheidsrechter</SelectItem>
            </SelectContent>
          </Select>

          {/* Team filter removed as requested */}

          {/* Add User Button - Mobile */}
          {addUserButton && (
            <div className="pt-2">
              {addUserButton}
            </div>
          )}
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:flex md:items-end md:gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
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

            {/* Team filter removed as requested */}
          </div>
          
          {/* Add User Button - Desktop */}
          {addUserButton && (
            <div className="flex-shrink-0">
              {addUserButton}
            </div>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-0 lg:min-w-[1100px] table-no-inner-scroll-mobile">
          <Table className="table w-full">
            <TableHeader>
              <TableRow className="table-header-row">
                <TableHead className="min-w-[200px] text-center">Naam</TableHead>
                <TableHead className="min-w-[250px] hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell min-w-[150px]">Rol</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[300px] text-center">Teams</TableHead>
                {editMode && <TableHead className="text-center min-w-[120px]">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="table-skeleton-cell">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="table-skeleton-cell">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden lg:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    {editMode && (
                      <TableCell className="text-center table-skeleton-cell">
                        <div className="flex justify-center gap-1">
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
                    <TableCell className="font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      <div className="truncate max-w-[200px]" title={user.email || ""}>
                        {user.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.role === "admin" && "Administrator"}
                      {user.role === "player_manager" && "Teamverantwoordelijke"}
                      {user.role === "referee" && "Scheidsrechter"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      {user.teams && user.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
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
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            onClick={() => onEditUser?.(user)}
                            className="btn btn--icon btn--edit"
                            disabled={isUpdating || isDeleting}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(user)}
                            className="btn btn--icon btn--danger"
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

      {/* Delete Confirmation Dialog */}
      <AppAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Gebruiker verwijderen"
        description={
          <>
            Weet je zeker dat je <strong>{userToDelete?.username || userToDelete?.email}</strong> wilt verwijderen?
            <br />
            Deze actie kan niet ongedaan worden gemaakt.
          </>
        }
        confirmAction={{
          label: isDeleting ? "Verwijderen..." : "Verwijderen",
          onClick: handleConfirmDelete,
          variant: "destructive",
          disabled: isDeleting,
          loading: isDeleting,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: handleCancelDelete,
          variant: "secondary",
          disabled: isDeleting,
        }}
      />
    </div>
  );
};

export default UserListTable;
