import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, Phone, Mail, Palette, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// Removed local AlertDialog in favor of centralized ConfirmDeleteDialog in parent

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
}

const TeamsList: React.FC<TeamsListProps> = ({ teams, onEdit, onDelete }) => {
  const handleDeleteClick = (team: Team) => {
    // Delegate opening of the delete confirmation to the parent
    onDelete(team);
  };

  const formatPreferences = (preferences?: Team['preferred_play_moments']) => {
    if (!preferences) return "-";
    const parts = [];
    if (preferences.days?.length) {
      parts.push(preferences.days.join(', '));
    }
    if (preferences.timeslots?.length) {
      parts.push(preferences.timeslots.join(', '));
    }
    if (preferences.venues?.length) {
      parts.push('Locatie ID(s): ' + preferences.venues.join(', '));
    }
    return parts.length > 0 ? parts.join(" | ") : "-";
  };

  return (
    <>
      <div className="w-full">
        <div>
          <div
            className="max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-y-auto"
            role="region"
            aria-label="Teams lijst"
          >
          <Table className="table w-full text-sm md:text-base">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] sticky top-0 bg-inherit z-10">Team</TableHead>
                <TableHead className="min-w-[120px] sticky top-0 bg-inherit z-10 hidden sm:table-cell">Contactpersoon</TableHead>
                <TableHead className="min-w-[120px] sticky top-0 bg-inherit z-10 hidden md:table-cell">Telefoon</TableHead>
                <TableHead className="min-w-[150px] sticky top-0 bg-inherit z-10 hidden md:table-cell">Email</TableHead>
                <TableHead className="min-w-[100px] sticky top-0 bg-inherit z-10 hidden lg:table-cell">Clubkleuren</TableHead>
                <TableHead className="min-w-[200px] sticky top-0 bg-inherit z-10 hidden lg:table-cell">Speelmoment voorkeuren</TableHead>
                <TableHead className="text-center min-w-[100px] sticky top-0 bg-inherit z-10">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    Geen teams gevonden
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.team_id}>
                    <TableCell className="font-medium whitespace-normal break-words">{team.team_name}</TableCell>
                    <TableCell className="whitespace-normal break-words hidden sm:table-cell">{team.contact_person || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell className="whitespace-normal break-words hidden md:table-cell">{team.contact_phone || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell className="whitespace-normal break-words hidden md:table-cell">{team.contact_email || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {team.club_colors ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Palette size={12} />
                          {team.club_colors}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] hidden lg:table-cell">
                      <div className="truncate" title={formatPreferences(team.preferred_play_moments)}>
                        {formatPreferences(team.preferred_play_moments)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          onClick={() => onEdit(team)}
                          className="btn btn--icon btn--edit"
                        >
                          <Edit size={15} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(team)}
                          className="btn btn--icon btn--danger"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {/* Delete confirmation is handled by parent via ConfirmDeleteDialog */}
    </>
  );
};

export default TeamsList;
