
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Trophy } from "lucide-react";

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
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek op wedstrijdnummer of team..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Filter op datum"
              className="pl-8"
              value={dateFilter || today}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Trophy className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter op speeldag..."
              className="pl-8"
              value={matchdayFilter}
              onChange={(e) => onMatchdayChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFormFilter;
