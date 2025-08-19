import React, { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AdminTeamSelectorProps<T extends { team_id: number; team_name: string }> {
  label?: string;
  teams: T[];
  selectedIds: number[];
  onToggle: (teamId: number) => void;
  disabled?: boolean;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  className?: string;
  placeholder?: string;
}

function AdminTeamSelector<T extends { team_id: number; team_name: string }>(
  {
    label = "Teams",
    teams,
    selectedIds,
    onToggle,
    disabled = false,
    onSelectAll,
    onClearAll,
    className,
    placeholder = "Selecteer teams"
  }: AdminTeamSelectorProps<T>
) {
  const [open, setOpen] = useState(false);

  const selectedNames = useMemo(() => (
    selectedIds
      .map(id => teams.find(t => t.team_id === id)?.team_name || "")
      .filter(Boolean)
  ), [selectedIds, teams]);

  const totalCount = teams.length;
  const selectedCount = selectedIds.length;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between w-auto max-w-full bg-white"
              disabled={disabled}
            >
              {selectedCount > 0
                ? `${selectedCount} van ${totalCount} team${selectedCount !== 1 ? 's' : ''} geselecteerd`
                : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full min-w-[var(--radix-popover-trigger-width)]">
            <div className="p-2 flex items-center gap-2 border-b">
              {onSelectAll && (
                <Button size="sm" variant="outline" onClick={onSelectAll} disabled={selectedCount === totalCount}>
                  Alles
                </Button>
              )}
              {onClearAll && (
                <Button size="sm" variant="outline" onClick={onClearAll} disabled={selectedCount === 0}>
                  Leegmaken
                </Button>
              )}
              <div className="ml-auto text-xs text-muted-foreground">
                {selectedCount}/{totalCount}
              </div>
            </div>
            <Command>
              <CommandInput placeholder="Zoek team..." />
              <CommandEmpty>Geen teams gevonden.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <ScrollArea className="h-72">
                    {teams.map(team => {
                      const isSelected = selectedIds.includes(team.team_id);
                      return (
                        <CommandItem
                          key={team.team_id}
                          onSelect={() => onToggle(team.team_id)}
                          onClick={() => onToggle(team.team_id)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            isSelected && "bg-purple-50 hover:bg-purple-100"
                          )}
                          aria-selected={isSelected}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggle(team.team_id)}
                            id={`admin-team-${team.team_id}`}
                            className="mr-2 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white focus:ring-purple-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Label 
                            htmlFor={`admin-team-${team.team_id}`} 
                            className="flex-grow cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {team.team_name}
                          </Label>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      );
                    })}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedNames.map((name, i) => (
              <Badge key={i} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTeamSelector;
