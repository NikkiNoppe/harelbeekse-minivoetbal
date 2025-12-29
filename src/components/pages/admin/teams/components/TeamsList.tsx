import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, Phone, Mail, Users } from "lucide-react";
import { ColorPreview } from "@/components/common/ColorPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
}

// Loading skeleton - matches actual card layout
const TeamCardSkeleton = () => (
  <Card className="border border-[var(--color-200)]">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state
const EmptyState = () => (
  <Card>
    <CardContent className="py-12 px-6 sm:px-8">
      <div className="text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">Geen teams</h3>
        <p className="text-muted-foreground">
          Er zijn nog geen teams toegevoegd aan de competitie.
        </p>
      </div>
    </CardContent>
  </Card>
);

const TeamsList: React.FC<TeamsListProps> = ({ teams, onEdit, onDelete, loading = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleDeleteClick = (team: Team) => {
    // Delegate opening of the delete confirmation to the parent
    onDelete(team);
  };

  const getColorName = (clubColors?: string) => {
    if (!clubColors) return null;
    const name = clubColors.split('-').find(part => !part.startsWith('#'));
    return name || null;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2" role="region" aria-label="Teams lijst">
      {teams.map((team) => {
        const colorName = getColorName(team.club_colors);
        const hasContactInfo = team.contact_person || team.contact_phone || team.contact_email;
        
        return (
          <Card 
            key={team.team_id}
            className="hover:shadow-md transition-shadow duration-200 border border-[var(--color-200)]"
          >
            <CardContent className="!p-4 !sm:p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Team info */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Team name with colors */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground truncate">
                        {team.team_name}
                      </h3>
                      {(colorName || team.club_colors) && (
                        <div className="flex items-center gap-2 mt-1">
                          {colorName && (
                            <p className="text-xs text-muted-foreground">
                              {colorName}
                            </p>
                          )}
                          {team.club_colors && (
                            <ColorPreview 
                              clubColors={team.club_colors} 
                              size="sm" 
                              className="flex-shrink-0" 
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact information */}
                  {hasContactInfo && (
                    <div className="space-y-1.5 text-sm">
                      {team.contact_person && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{team.contact_person}</span>
                        </div>
                      )}
                      {team.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{team.contact_phone}</span>
                        </div>
                      )}
                      {team.contact_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate break-all">{team.contact_email}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right side - Action buttons (only visible for admins) */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      onClick={() => onEdit(team)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8 border-[var(--color-300)]",
                        "bg-white hover:bg-purple-50 hover:border-[var(--color-400)]",
                        "text-[var(--color-700)] hover:text-[var(--color-900)]",
                        "transition-colors duration-150"
                      )}
                      style={{ 
                        height: '32px',
                        width: '32px',
                        minHeight: '32px',
                        maxHeight: '32px',
                        minWidth: '32px',
                        maxWidth: '32px'
                      }}
                      aria-label={`Bewerk ${team.team_name}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(team)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "!h-8 !w-8 !min-h-0 !max-h-8 !max-w-8 rounded-md border-red-300",
                        "hover:bg-red-50 hover:border-red-400",
                        "text-red-600 hover:text-red-700",
                        "transition-colors duration-150"
                      )}
                      style={{ 
                        height: '32px',
                        width: '32px',
                        minHeight: '32px',
                        maxHeight: '32px',
                        minWidth: '32px',
                        maxWidth: '32px'
                      }}
                      aria-label={`Verwijder ${team.team_name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamsList;
