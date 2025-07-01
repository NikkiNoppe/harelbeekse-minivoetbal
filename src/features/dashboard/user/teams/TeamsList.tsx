
import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";

interface Team {
  team_id: number;
  team_name: string;
}

interface TeamsListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

const TeamsList: React.FC<TeamsListProps> = ({ teams, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Naam</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow key={team.team_id}>
            <TableCell>{team.team_name}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(team)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(team)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TeamsList;
