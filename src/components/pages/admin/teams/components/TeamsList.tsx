import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, User, Phone, Mail, Users } from "lucide-react";
import { TeamTrophyAvatar, getClubColorName } from "@/components/common/TeamTrophyAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";

interface Team {
  team_id: number;
  team_name: string;
  player_manager_id?: number | null;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  club_colors?: string;
  preferred_play_moments?: {
    days?: string[];
    timeslots?: string[];
    venues?: string[];
    notes?: string;
  };
}

interface TeamsListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  loading?: boolean;
  addTeamButton?: React.ReactNode;
}

const EmptyState = () => (
  <div className="text-center py-12 px-4">
    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
    <h3 className="text-lg font-semibold mb-2 text-foreground">Geen teams</h3>
    <p className="text-muted-foreground">
      Er zijn nog geen teams toegevoegd aan deze competitie.
    </p>
  </div>
);

const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  onEdit,
  onDelete,
  loading = false,
  addTeamButton,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const teamsWithContact = teams.filter(
    (t) => t.contact_person || t.contact_phone || t.contact_email,
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Teams
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">{teams.length}</p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Met contact
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">{teamsWithContact}</p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Zonder contact
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">
              {teams.length - teamsWithContact}
            </p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && addTeamButton && (
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {addTeamButton}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="w-full overflow-x-auto">
        <div className="w-full min-w-0">
          <Table className="table w-full">
            <TableHeader>
              <TableRow className="table-header-row">
                <TableHead className="min-w-[220px]">Team</TableHead>
                <TableHead className="hidden min-w-[240px] lg:table-cell">Contact</TableHead>
                <TableHead className="hidden min-w-[140px] md:table-cell">Kleuren</TableHead>
                {isAdmin && <TableHead className="text-center min-w-[104px]">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="table-skeleton-cell">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden lg:table-cell">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="table-skeleton-cell hidden md:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center table-skeleton-cell">
                        <div className="flex justify-center gap-1">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="py-12">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => {
                  const colorName = getClubColorName(team.club_colors);
                  const hasContactInfo =
                    team.contact_person || team.contact_phone || team.contact_email;

                  return (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <TeamTrophyAvatar clubColors={team.club_colors} />
                          <div className="min-w-0">
                            <span className="block truncate max-w-[140px] sm:max-w-[220px] text-brand-dark">
                              {team.team_name}
                            </span>
                            {colorName && (
                              <span className="block truncate text-xs text-muted-foreground md:hidden">
                                {colorName}
                              </span>
                            )}
                            {hasContactInfo && (
                              <div className="mt-1 space-y-0.5 lg:hidden">
                                {team.contact_person && (
                                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                                    <User className="h-3 w-3 shrink-0" />
                                    {team.contact_person}
                                  </span>
                                )}
                                {team.contact_phone && (
                                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {team.contact_phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {hasContactInfo ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {team.contact_person && (
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{team.contact_person}</span>
                              </div>
                            )}
                            {team.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{team.contact_phone}</span>
                              </div>
                            )}
                            {team.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{team.contact_email}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {colorName ? (
                          <Badge variant="outline" className="bg-brand-50">
                            {colorName}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Button
                              type="button"
                              onClick={() => onEdit(team)}
                              className="btn btn--icon btn--edit"
                              aria-label={`Bewerk ${team.team_name}`}
                            >
                              <Edit className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => onDelete(team)}
                              className="btn btn--icon btn--danger"
                              aria-label={`Verwijder ${team.team_name}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TeamsList;
