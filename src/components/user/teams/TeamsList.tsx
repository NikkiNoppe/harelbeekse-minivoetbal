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
    venues?: number[];
    notes?: string;
  };
}

interface TeamsListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

const TeamsList: React.FC<TeamsListProps> = ({ teams, onEdit, onDelete }) => {
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
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Contactpersoon</TableHead>
            <TableHead>Telefoon</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Clubkleuren</TableHead>
            <TableHead>Speelmoment voorkeuren</TableHead>
            <TableHead>Extra wensen</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.team_id}>
              <TableCell className="font-medium">{team.team_name}</TableCell>
              <TableCell>{team.contact_person || <span className="text-gray-400">-</span>}</TableCell>
              <TableCell>{team.contact_phone || <span className="text-gray-400">-</span>}</TableCell>
              <TableCell>{team.contact_email || <span className="text-gray-400">-</span>}</TableCell>
              <TableCell>
                {team.club_colors ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Palette size={12} />
                    {team.club_colors}
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>{formatPreferences(team.preferred_play_moments)}</TableCell>
              <TableCell>
                {team.preferred_play_moments?.notes ? (
                  <span className="text-xs text-gray-600 max-w-xs truncate" title={team.preferred_play_moments.notes}>
                    {team.preferred_play_moments.notes}
                  </span>
                ) : <span className="text-gray-400">-</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(team)}
                    className="btn-light"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(team)}
                    className="btn-light text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {teams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Geen teams gevonden</p>
        </div>
      )}
    </div>
  );
};

export default TeamsList;
