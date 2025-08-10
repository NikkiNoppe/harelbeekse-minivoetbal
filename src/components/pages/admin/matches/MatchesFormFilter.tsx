import React from "react";
import { Calendar, SortAsc, SortDesc, X } from "lucide-react";
import { getCurrentDate } from "@/lib/dateUtils";
import FilterInput from "@/components/ui/filter-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
}

const MatchFormFilter: React.FC<MatchFormFilterProps> = ({
  dateFilter,
  onDateChange,
  teamFilter,
  onTeamChange,
  teamOptions,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters
}) => {
  const today = getCurrentDate();
  const hasActiveFilters = dateFilter || teamFilter || sortBy !== 'date';

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string): string => {
    try {
      if (dateString.includes('T')) {
        // ISO format
        return new Date(dateString).toLocaleDateString('nl-NL');
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
      } else {
        // Try to parse as local date
        return new Date(dateString).toLocaleDateString('nl-NL');
      }
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <FilterInput
          type="date"
          placeholder="Filter op datum"
          value={dateFilter}
          onChange={onDateChange}
          icon={Calendar}
        />

        <div className="flex gap-2">
          <Select value={teamFilter} onValueChange={onTeamChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter op team" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              <SelectItem value="">Alle teams</SelectItem>
              {teamOptions.map((team) => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sorteer op..." />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              <SelectItem value="date">Datum</SelectItem>
              <SelectItem value="matchday">Speeldag</SelectItem>
              <SelectItem value="week">Speelweek</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="shrink-0"
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Actieve filters:</span>
          
          {dateFilter && (
            <Badge variant="secondary" className="gap-1">
              Datum: {formatDateForDisplay(dateFilter)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onDateChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {teamFilter && (
            <Badge variant="secondary" className="gap-1">
              Team: {teamFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onTeamChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {sortBy !== 'date' && (
            <Badge variant="secondary" className="gap-1">
              Sorteer: {sortBy === 'matchday' ? 'Speeldag' : 
                        sortBy === 'week' ? 'Speelweek' : 
                        sortBy === 'team' ? 'Team' : 'Status'} ({sortOrder === 'asc' ? 'Oplopend' : 'Aflopend'})
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Wis alle filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchFormFilter;
