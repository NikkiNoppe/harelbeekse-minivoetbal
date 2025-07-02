import React from "react";
import { Calendar, Trophy } from "lucide-react";
import { getCurrentDate } from "@/lib/dateUtils";
import SearchInput from "@/components/ui/search-input";
import FilterInput from "@/components/ui/filter-input";

interface MatchFormFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  matchdayFilter: string;
  onMatchdayChange: (value: string) => void;
}

const MatchFormFilter: React.FC<MatchFormFilterProps> = ({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateChange,
  matchdayFilter,
  onMatchdayChange
}) => {
  const today = getCurrentDate();

  return (
    <div className="mb-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
        <SearchInput
          placeholder="Zoek op speeldag of team..."
          value={searchTerm}
          onChange={onSearchChange}
        />

        <FilterInput
          type="date"
          placeholder="Filter op datum"
          value={dateFilter || today}
          onChange={onDateChange}
          icon={Calendar}
        />
      </div>
    </div>
  );
};

export default MatchFormFilter;
