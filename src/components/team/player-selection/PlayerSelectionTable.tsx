
import React from "react";
import { Checkbox, Table, TextInput } from "@mantine/core";
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
    <div style={{ borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 48 }}>Selectie</Table.Th>
            <Table.Th>Speler</Table.Th>
            <Table.Th style={{ width: 96, textAlign: 'center' }}>Rugnr.</Table.Th>
            <Table.Th style={{ width: 96, textAlign: 'center' }}>Kapitein</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {form.watch('players').map((player, index) => (
            <Table.Tr key={player.playerId} style={player.selected ? { background: '#f3f0ff' } : {}}>
              <Table.Td>
                <Checkbox
                  checked={player.selected}
                  onChange={(e) => onTogglePlayerSelection(index, e.currentTarget.checked)}
                />
              </Table.Td>
              <Table.Td>{player.playerName}</Table.Td>
              <Table.Td>
                <TextInput
                  type="number"
                  min={1}
                  max={99}
                  disabled={!player.selected}
                  {...form.register(`players.${index}.jerseyNumber`)}
                  style={{ width: 64, textAlign: 'center', margin: '0 auto' }}
                />
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Checkbox
                  checked={player.isCaptain}
                  disabled={!player.selected}
                  onChange={() => onToggleCaptain(index)}
                  color={player.isCaptain ? "grape" : undefined}
                />
              </Table.Td>
            </Table.Tr>
          ))}
          {form.watch('players').length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4} style={{ textAlign: 'center', padding: 16, color: '#888' }}>
                Geen spelers gevonden voor dit team.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default PlayerSelectionTable;
