import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import { SuspensionBadge } from "./SuspensionBadge";
import type { Suspension } from "@/domains/cards-suspensions";

interface SuspensionsTableProps {
  suspensions: Suspension[];
  showTeam?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  onEdit?: (suspension: Suspension) => void;
  onDelete?: (suspension: Suspension) => void;
}

const TableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speler</TableHead>
        <TableHead>Team</TableHead>
        <TableHead>Reden</TableHead>
        <TableHead className="text-center">Wedstrijden</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

TableSkeleton.displayName = 'SuspensionsTableSkeleton';

export const SuspensionsTable: React.FC<SuspensionsTableProps> = memo(({ 
  suspensions, 
  showTeam = true,
  showActions = false,
  isLoading = false,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (suspensions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen actieve schorsingen.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="table-header-row">
            <TableHead>Speler</TableHead>
            {showTeam && <TableHead>Team</TableHead>}
            <TableHead>Reden</TableHead>
            <TableHead className="text-center">Wedstrijden</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Acties</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suspensions.map((suspension) => (
            <TableRow key={`${suspension.playerId}-${suspension.reason}`}>
              <TableCell className="font-medium">{suspension.playerName}</TableCell>
              {showTeam && <TableCell className="text-muted-foreground">{suspension.teamName}</TableCell>}
              <TableCell>{suspension.reason}</TableCell>
              <TableCell className="text-center font-semibold">{suspension.matches}</TableCell>
              <TableCell>
                <SuspensionBadge type={suspension.status} />
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(suspension)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(suspension)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

SuspensionsTable.displayName = 'SuspensionsTable';
