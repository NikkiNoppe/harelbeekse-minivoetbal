
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@shared/components/ui/input";

interface MatchFormFilterProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
}

const MatchFormFilter: React.FC<MatchFormFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  dateFilter,
  onDateFilterChange
}) => {
  return (
    <div className="flex gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek op wedstrijdnummer of locatie..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      <Input
        type="date"
        value={dateFilter}
        onChange={(e) => onDateFilterChange(e.target.value)}
        className="w-auto"
      />
    </div>
  );
};

export default MatchFormFilter;
