import React from "react";
import { Calendar, Trophy, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { getCurrentDate } from "@/lib/dateUtils";
import SearchInput from "@/components/ui/search-input";
import FilterInput from "@/components/ui/filter-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MatchFormFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  matchdayFilter: string;
  onMatchdayChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

const MatchFormFilter: React.FC<MatchFormFilterProps> = ({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateChange,
  matchdayFilter,
  onMatchdayChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters
}) => {
  const today = getCurrentDate();
  const hasActiveFilters = searchTerm || dateFilter || matchdayFilter || sortBy !== 'date';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput
          placeholder="Zoek op speeldag of team..."
          value={searchTerm}
          onChange={onSearchChange}
        />

        <FilterInput
          type="date"
          placeholder="Filter op datum"
          value={dateFilter}
          onChange={onDateChange}
          icon={Calendar}
        />

        <FilterInput
          type="text"
          placeholder="Filter op speeldag"
          value={matchdayFilter}
          onChange={onMatchdayChange}
          icon={Trophy}
        />

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sorteer op..." />
            </SelectTrigger>
            <SelectContent>
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
          
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Zoek: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
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
          
          {matchdayFilter && (
            <Badge variant="secondary" className="gap-1">
              Speeldag: "{matchdayFilter}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onMatchdayChange("")}
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
