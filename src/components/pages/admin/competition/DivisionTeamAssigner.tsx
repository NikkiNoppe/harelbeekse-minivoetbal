import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { GripVertical, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetitionDivision } from "@/services/competitionDataService";

const UNASSIGNED_ID = "unassigned";

export type DivisionTeamAssignment = Record<number, number>;

interface TeamOption {
  team_id: number;
  team_name: string;
}

interface DivisionTeamAssignerProps {
  divisions: CompetitionDivision[];
  teams: TeamOption[];
  selectedTeamIds: number[];
  assignment: DivisionTeamAssignment;
  onChange: (next: DivisionTeamAssignment) => void;
  className?: string;
}

function DraggableTeamChip({
  team,
  disabled,
}: {
  team: TeamOption;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${team.team_id}`,
    data: { teamId: team.team_id },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-primary/15 bg-card px-2 py-2 min-h-[44px] touch-none",
        isDragging && "opacity-40",
        disabled && "opacity-50",
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate text-sm font-medium text-brand-dark">{team.team_name}</span>
    </div>
  );
}

function DropColumn({
  id,
  title,
  count,
  children,
  accent,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  accent?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[160px] flex-col rounded-xl border p-3 transition-colors",
        accent ? "border-primary/20 bg-brand-50/30" : "border-border/70 bg-muted/20",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-dark">{title}</p>
        <Badge variant="secondary" className="rounded-full tabular-nums">
          {count}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

/**
 * Sleep teams naar reeksen (desktop + touch). Op mobiel ook knoppen om te verplaatsen.
 */
export function DivisionTeamAssigner({
  divisions,
  teams,
  selectedTeamIds,
  assignment,
  onChange,
  className,
}: DivisionTeamAssignerProps) {
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  );

  const sortedDivisions = useMemo(
    () => [...divisions].sort((a, b) => a.sort_order - b.sort_order),
    [divisions],
  );

  const teamById = useMemo(() => {
    const map = new Map<number, TeamOption>();
    teams.forEach((t) => map.set(t.team_id, t));
    return map;
  }, [teams]);

  const selectedSet = useMemo(() => new Set(selectedTeamIds), [selectedTeamIds]);

  const columns = useMemo(() => {
    const unassigned: number[] = [];
    const byDivision = new Map<number, number[]>();
    sortedDivisions.forEach((d) => byDivision.set(d.id, []));

    for (const teamId of selectedTeamIds) {
      const divisionId = assignment[teamId];
      if (divisionId != null && byDivision.has(divisionId)) {
        byDivision.get(divisionId)!.push(teamId);
      } else {
        unassigned.push(teamId);
      }
    }

    return { unassigned, byDivision };
  }, [assignment, selectedTeamIds, sortedDivisions]);

  const moveTeam = (teamId: number, targetDivisionId: number | null) => {
    if (!selectedSet.has(teamId)) return;
    const next = { ...assignment };
    if (targetDivisionId == null) {
      delete next[teamId];
    } else {
      next[teamId] = targetDivisionId;
    }
    onChange(next);
  };

  const distributeEvenly = () => {
    if (sortedDivisions.length === 0 || selectedTeamIds.length === 0) return;
    const next: DivisionTeamAssignment = {};
    selectedTeamIds.forEach((teamId, index) => {
      const division = sortedDivisions[index % sortedDivisions.length];
      next[teamId] = division.id;
    });
    onChange(next);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const teamId = event.active.data.current?.teamId as number | undefined;
    setActiveTeamId(teamId ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTeamId(null);
    const teamId = event.active.data.current?.teamId as number | undefined;
    const overId = event.over?.id;
    if (teamId == null || overId == null) return;

    const over = String(overId);
    if (over === UNASSIGNED_ID) {
      moveTeam(teamId, null);
      return;
    }
    if (over.startsWith("division-")) {
      const divisionId = Number(over.replace("division-", ""));
      if (!Number.isNaN(divisionId)) moveTeam(teamId, divisionId);
    }
  };

  const activeTeam = activeTeamId != null ? teamById.get(activeTeamId) : null;

  if (selectedTeamIds.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Selecteer eerst teams om ze over de reeksen te verdelen.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold text-brand-dark">Verdeel over reeksen</Label>
          <p className="text-xs text-muted-foreground">
            Sleep teams naar een reeks, of gebruik de knoppen. Elk team in precies één reeks.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-1 w-full sm:w-auto"
          onClick={distributeEvenly}
        >
          <Shuffle className="h-4 w-4" aria-hidden />
          Verdeel gelijkmatig
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            "grid gap-3",
            sortedDivisions.length <= 2
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          <DropColumn id={UNASSIGNED_ID} title="Nog niet toegewezen" count={columns.unassigned.length}>
            {columns.unassigned.map((teamId) => {
              const team = teamById.get(teamId);
              if (!team) return null;
              return (
                <div key={teamId} className="space-y-1">
                  <DraggableTeamChip team={team} />
                  <div className="flex flex-wrap gap-1">
                    {sortedDivisions.map((division, index) => (
                      <Button
                        key={division.id}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 min-h-8 px-2 text-xs"
                        onClick={() => moveTeam(teamId, division.id)}
                      >
                        → {index + 1}e
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
            {columns.unassigned.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Alle teams zijn toegewezen.</p>
            ) : null}
          </DropColumn>

          {sortedDivisions.map((division, index) => {
            const teamIds = columns.byDivision.get(division.id) ?? [];
            return (
              <DropColumn
                key={division.id}
                id={`division-${division.id}`}
                title={division.name || `${index + 1}e reeks`}
                count={teamIds.length}
                accent
              >
                {teamIds.map((teamId) => {
                  const team = teamById.get(teamId);
                  if (!team) return null;
                  return (
                    <div key={teamId} className="space-y-1">
                      <DraggableTeamChip team={team} />
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 min-h-8 px-2 text-xs"
                          onClick={() => moveTeam(teamId, null)}
                        >
                          Weg
                        </Button>
                        {sortedDivisions
                          .filter((d) => d.id !== division.id)
                          .map((other) => (
                            <Button
                              key={other.id}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 min-h-8 px-2 text-xs"
                              onClick={() => moveTeam(teamId, other.id)}
                            >
                              → {sortedDivisions.findIndex((d) => d.id === other.id) + 1}e
                            </Button>
                          ))}
                      </div>
                    </div>
                  );
                })}
                {teamIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Sleep teams hierheen.</p>
                ) : null}
              </DropColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTeam ? (
            <div className="flex items-center gap-2 rounded-md border border-primary bg-card px-3 py-2 shadow-lg min-h-[44px]">
              <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">{activeTeam.team_name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default DivisionTeamAssigner;
