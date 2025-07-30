import React, { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (teamToDelete) {
      onDelete(teamToDelete);
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
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
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table className="table w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Team</TableHead>
                <TableHead className="min-w-[120px]">Contactpersoon</TableHead>
                <TableHead className="min-w-[120px]">Telefoon</TableHead>
                <TableHead className="min-w-[150px]">Email</TableHead>
                <TableHead className="min-w-[100px]">Clubkleuren</TableHead>
                <TableHead className="min-w-[200px]">Speelmoment voorkeuren</TableHead>
                <TableHead className="min-w-[150px]">Extra wensen</TableHead>
                <TableHead className="text-center min-w-[120px]">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                    Geen teams gevonden
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
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
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={formatPreferences(team.preferred_play_moments)}>
                        {formatPreferences(team.preferred_play_moments)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      {team.preferred_play_moments?.notes ? (
                        <div className="truncate" title={team.preferred_play_moments.notes}>
                          {team.preferred_play_moments.notes}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          onClick={() => onEdit(team)}
                          className="btn btn--icon"
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="modal__title">
              Team verwijderen
            </AlertDialogTitle>
            <div className="text-center">
              Weet je zeker dat je <strong>{teamToDelete?.team_name}</strong> wilt verwijderen?
              <br />
              Deze actie kan niet ongedaan worden gemaakt.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="modal__actions">
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="btn btn--danger flex-1"
            >
              Verwijderen
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={handleCancelDelete}
              className="btn btn--secondary flex-1"
            >
              Annuleren
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamsList;
