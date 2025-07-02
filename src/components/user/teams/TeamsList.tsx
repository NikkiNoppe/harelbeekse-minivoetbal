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

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
  player_manager_id?: number | null;
}

interface TeamsListProps {
  teams: Team[];
  loading: boolean;
  editMode?: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  loading,
  editMode = false,
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
          {editMode && <TableHead className="text-right">Acties</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.length === 0 ? (
          <TableRow>
            <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground py-6">
              Geen teams gevonden
            </TableCell>
          </TableRow>
        ) : (
          teams.map(team => (
            <TableRow key={team.team_id}>
              <TableCell className="font-medium">{team.team_name}</TableCell>
              <TableCell>€ {team.balance.toFixed(2)}</TableCell>
              {editMode && (
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
                      onClick={() => onDelete(team)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default TeamsList;
