import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Trophy } from "lucide-react";
import { getCurrentDate } from "@/lib/dateUtils";

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Zoek op wedstrijdnummer of team..."
            className="pl-8 bg-gray-50 focus:bg-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            placeholder="Filter op datum"
            className="pl-8 bg-gray-50 focus:bg-white"
            value={dateFilter || today}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <Trophy className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter op speeldag..."
            className="pl-8 bg-gray-50 focus:bg-white"
            value={matchdayFilter}
            onChange={(e) => onMatchdayChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchFormFilter;
