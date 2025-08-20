
import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
      <div
        className="max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-y-auto"
        role="region"
        aria-label="Spelerselectie tabel"
      >
      <Table className="table w-full text-sm md:text-base">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 sticky top-0 bg-inherit z-10">Selectie</TableHead>
            <TableHead className="min-w-[140px] sticky top-0 bg-inherit z-10">Speler</TableHead>
            <TableHead className="w-24 text-center sticky top-0 bg-inherit z-10">Rugnr.</TableHead>
            <TableHead className="w-24 text-center sticky top-0 bg-inherit z-10">Kapitein</TableHead>
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
    </div>
  );
};

export default PlayerSelectionTable;
