
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
import { User, Edit, Trash2, Loader2, ShieldCheck, Users2, UserCog } from "lucide-react";
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
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { DbUser } from "../userTypes";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";

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

  const roleLabel = (role: string) => {
    if (role === "admin") return "Administrator";
    if (role === "player_manager") return "Teamverantwoordelijke";
    if (role === "referee") return "Scheidsrechter";
    return role;
  };

  const roleIcon = (role: string) => {
    if (role === "admin") return UserCog;
    if (role === "player_manager") return Users2;
    return ShieldCheck;
  };

  const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "admin") return "default";
    if (role === "player_manager") return "outline";
    return "secondary";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gebruikers
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">{users.length}</p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Administrators
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">
              {users.filter((user) => user.role === "admin").length}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Teamrollen
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">
              {users.filter((user) => user.role !== "admin").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
        <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Mobile: Stacked layout */}
        <div className="block md:hidden space-y-3">
          {/* Search by name */}
          <SearchInput
            placeholder="Zoeken op naam..."
            value={searchTerm}
            onChange={onSearchTermChange}
            className="min-h-[44px]"
          />

          {/* Filter by role */}
          <Select
            value={roleFilter}
            onValueChange={onRoleFilterChange}
          >
            <SelectTrigger className="w-full min-h-[44px]">
              <SelectValue placeholder="Alle rollen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle rollen</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
              <SelectItem value="referee">Scheidsrechter</SelectItem>
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
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Alle rollen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rollen</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
                <SelectItem value="referee">Scheidsrechter</SelectItem>
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
        </CardContent>
      </Card>

      {/* User Table */}
      <div className="w-full overflow-x-auto">
        <div className="w-full min-w-0">
          <Table className="table w-full">
            <TableHeader>
              <TableRow className="table-header-row">
                <TableHead className="left min-w-[220px]">Naam</TableHead>
                <TableHead className="hidden min-w-[240px] lg:table-cell">Email</TableHead>
                <TableHead className="min-w-[150px]">Rol</TableHead>
                <TableHead className="hidden min-w-[280px] xl:table-cell">Teams</TableHead>
                {editMode && <TableHead className="right min-w-[104px]">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="left table-skeleton-cell">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden lg:table-cell">
                      <div className="flex justify-center">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </TableCell>
                    <TableCell className="table-skeleton-cell">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-28 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden xl:table-cell">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-28 rounded-full" />
                      </div>
                    </TableCell>
                    {editMode && (
                      <TableCell className="right table-skeleton-cell">
                        <div className="flex justify-end gap-1.5">
                          <Skeleton className="h-11 w-11 rounded-md" />
                          <Skeleton className="h-11 w-11 rounded-md" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : !users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editMode ? 5 : 4} className="py-6 text-center text-muted-foreground">
                    {loading ? 'Laden...' : 'Geen gebruikers gevonden'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell className="left font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-sm">
                          <User className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 text-left">
                          <span className="block truncate max-w-[140px] sm:max-w-[220px] text-brand-dark">
                            {user.username}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground lg:hidden">
                            {user.email || "—"}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1 xl:hidden">
                            {user.teams && user.teams.length > 0 ? (
                              user.teams.slice(0, 2).map((team) => (
                                <Badge
                                  key={team.team_id}
                                  variant="outline"
                                  className="border-primary/20 bg-brand-50 text-[10px] sm:text-xs"
                                >
                                  {team.team_name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground sm:text-xs">Geen teams</span>
                            )}
                            {user.teams && user.teams.length > 2 ? (
                              <Badge variant="secondary" className="border border-border/70 text-[10px] sm:text-xs">
                                +{user.teams.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      <div className="truncate max-w-[200px] mx-auto" title={user.email || undefined}>
                        {user.email || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge
                          variant={roleBadgeVariant(user.role)}
                          className="inline-flex items-center gap-1.5 border border-primary/20"
                        >
                          {React.createElement(roleIcon(user.role), {
                            className: "h-3.5 w-3.5 shrink-0",
                            "aria-hidden": true,
                          })}
                          {roleLabel(user.role)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {user.teams && user.teams.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {user.teams.length <= 2 ? (
                            user.teams.map(team => (
                              <Badge
                                key={team.team_id}
                                variant="outline"
                                className="border-primary/20 bg-brand-50"
                              >
                                {team.team_name}
                              </Badge>
                            ))
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Badge variant="outline" className="border-primary/20 bg-brand-50">
                                      {user.teams[0].team_name}
                                    </Badge>
                                    <Badge variant="secondary" className="border border-border/70">
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {editMode && (
                      <TableCell className="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            onClick={() => onEditUser?.(user)}
                            variant="unstyled"
                            className="btn btn--icon btn--edit"
                            disabled={isUpdating || isDeleting}
                            aria-label={`Bewerk ${user.username}`}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Edit className="h-4 w-4" aria-hidden />
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDeleteClick(user)}
                            variant="unstyled"
                            className="btn btn--icon btn--danger"
                            disabled={isUpdating || isDeleting}
                            aria-label={`Verwijder ${user.username}`}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden />
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
        size="sm"
        description={
          <DestructiveConfirmDescription
            message={
              <>
                Weet je zeker dat je{" "}
                <span className="font-semibold text-destructive">
                  {userToDelete?.username || userToDelete?.email}
                </span>{" "}
                wilt verwijderen?
              </>
            }
          />
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
