import React from "react";
import { EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface MatchFormFilterProps {
  dateFilter: string;
  onDateChange: (value: string) => void;
  teamFilter: string;
  onTeamChange: (value: string) => void;
  teamOptions: string[];
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  selfTeamToggle?: boolean;
  selfTeamName?: string;
  hideCompletedMatches: boolean;
  onHideCompletedChange: (value: boolean) => void;
  isTeamManager?: boolean;
}

const MatchFormFilter: React.FC<MatchFormFilterProps> = ({
  teamFilter,
  onTeamChange,
  teamOptions,
  hideCompletedMatches,
  onHideCompletedChange
}) => {
  // Build options array similar to /competitie page
  const options = [
    { value: "all", label: "Alle teams" },
    ...teamOptions.map(team => ({ value: team, label: team }))
  ];

  // Handle value conversion: empty string or "all" means "all"
  const currentValue = !teamFilter || teamFilter === "all" ? "all" : teamFilter;

  // Handle value change: convert "all" back to empty string
  const handleValueChange = (value: string) => {
    onTeamChange(value === "all" ? "" : value);
  };

  return (
    <div className="space-y-3">
      {/* Hide Completed Matches Toggle */}
      <div className="flex items-center gap-2 p-2 bg-card/50 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
        <Switch
          id="hide-completed"
          checked={hideCompletedMatches}
          onCheckedChange={(checked) => {
            onHideCompletedChange(checked);
          }}
        />
        <label 
          htmlFor="hide-completed" 
          className="text-sm cursor-pointer select-none flex items-center gap-1.5"
          onClick={(e) => {
            e.preventDefault();
            onHideCompletedChange(!hideCompletedMatches);
          }}
        >
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">Verberg gespeelde speeldagen</span>
        </label>
      </div>

      {/* Team Filter */}
      <div className="w-full block">
        <Select value={currentValue} onValueChange={handleValueChange}>
          <SelectTrigger className="h-9 text-sm w-full">
            <SelectValue placeholder="Alle teams" />
          </SelectTrigger>
          <SelectContent className="z-[1100] bg-popover">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default React.memo(MatchFormFilter);
