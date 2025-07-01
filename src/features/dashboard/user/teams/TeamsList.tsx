
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
import { Edit, Trash2 } from "lucide-react";
import { Team } from "@/components/team/types";

interface TeamsListProps {
  teams: Team[];
  loading: boolean;
  onEdit: (team: Team) => void;
  onDelete: (teamId: number) => void;
}

const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Teams laden...</div>;
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Balans</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
              Geen teams gevonden
            </TableCell>
          </TableRow>
        ) : (
          teams.map(team => (
            <TableRow key={team.team_id}>
              <TableCell className="font-medium">{team.team_name}</TableCell>
              <TableCell>€ {team.balance.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(team)}
                    className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/10"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(team.team_id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default TeamsList;
