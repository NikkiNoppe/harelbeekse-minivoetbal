
import React from "react";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Checkbox } from "../../../MINIVOETBAL.UI/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../../MINIVOETBAL.UI/components/ui/table";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./types";

interface PlayerSelectionTableProps {
  form: UseFormReturn<FormData>;
  onTogglePlayerSelection: (index: number, selected: boolean) => void;
  onToggleCaptain: (index: number) => void;
}

const PlayerSelectionTable: React.FC<PlayerSelectionTableProps> = ({
  form,
  onTogglePlayerSelection,
  onToggleCaptain
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Selectie</TableHead>
            <TableHead>Speler</TableHead>
            <TableHead className="w-24 text-center">Rugnr.</TableHead>
            <TableHead className="w-24 text-center">Kapitein</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {form.watch('players').map((player, index) => (
            <TableRow key={player.playerId} className={player.selected ? "bg-muted/40" : ""}>
              <TableCell>
                <Checkbox
                  checked={player.selected}
                  onCheckedChange={(checked) => {
                    onTogglePlayerSelection(index, checked === true);
                  }}
                />
              </TableCell>
              <TableCell>{player.playerName}</TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Input 
                    type="number"
                    min={1}
                    max={99}
                    disabled={!player.selected}
                    {...form.register(`players.${index}.jerseyNumber`)}
                    className="w-16 text-center"
                  />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={player.isCaptain}
                    disabled={!player.selected}
                    onCheckedChange={() => onToggleCaptain(index)}
                    className={player.isCaptain ? "border-primary" : ""}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {form.watch('players').length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                Geen spelers gevonden voor dit team.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlayerSelectionTable;
