import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface MatchFilterState {
  search: string;
  selectedTeams: string[];
  selectedDate: Date | null;
  selectedWeek: Date | null;
  selectedMatchday?: string | null;
}

interface MatchFilterPanelProps {
  teamNames: string[];
  onChange: (state: MatchFilterState) => void;
  showMatchday?: boolean;
  matchdays?: string[];
  title?: string;
  description?: string;
}

const MatchFilterPanel: React.FC<MatchFilterPanelProps> = ({
  teamNames,
  onChange,
  showMatchday = false,
  matchdays = [],
  title = "Filters",
  description = "Filter resultaten met kalender, teams en zoeken",
}) => {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<string | null>(null);

  useEffect(() => {
    onChange({ search, selectedTeams, selectedDate, selectedWeek, selectedMatchday });
  }, [search, selectedTeams, selectedDate, selectedWeek, selectedMatchday, onChange]);

  const allSelected = selectedTeams.length === teamNames.length && teamNames.length > 0;
  const noneSelected = selectedTeams.length === 0;

  const visibleTeams = useMemo(() => teamNames.sort((a, b) => a.localeCompare(b, "nl")), [teamNames]);

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  const selectAll = () => setSelectedTeams([...teamNames]);
  const deselectAll = () => setSelectedTeams([]);
  const clearFilters = () => {
    setSearch("");
    setSelectedDate(null);
    setSelectedWeek(null);
    setSelectedTeams([]);
    setSelectedMatchday(null);
  };

  return (
    <Card>
      <CardHeader className="bg-transparent">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kalender en Week Filter */}
          <div>
            <Label className="mb-2 block">Datum & Week Filters</Label>
            
            {/* Specifieke Datum */}
            <div className="mb-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Specifieke Datum</Label>
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={selectedDate ?? undefined}
                  onSelect={(d) => setSelectedDate(d ?? null)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setSelectedDate(null)}>
                Datum wissen
              </Button>
            </div>

            {/* Week Filter */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Week Filter</Label>
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={selectedWeek ?? undefined}
                  onSelect={(d) => setSelectedWeek(d ?? null)}
                  className="p-3 pointer-events-auto"
                  weekStartsOn={1}
                />
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setSelectedWeek(null)}>
                Week wissen
              </Button>
            </div>
          </div>

          {/* Teams multiselect */}
          <div className="lg:col-span-1">
            <div className="flex items-end justify-between mb-2">
              <Label>Teams</Label>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={selectAll} disabled={allSelected}>
                  Selecteer alle teams
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll} disabled={noneSelected}>
                  Deselecteer alle teams
                </Button>
              </div>
            </div>
            <div className="rounded-md border h-64">
              <ScrollArea className="h-64 p-3">
                <div className="space-y-3">
                  {visibleTeams.map((team) => (
                    <label key={team} className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTeams.includes(team)}
                        onCheckedChange={() => toggleTeam(team)}
                        aria-label={`Selecteer ${team}`}
                      />
                      <span className="text-sm">{team}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Zoek + (optioneel) speeldag */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="search" className="mb-2 block">
                Zoeken
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  id="search"
                  placeholder="Zoek op team, locatie, speeldag, ..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {showMatchday && (
              <div>
                <Label className="mb-2 block">Speeldag</Label>
                <Select
                  value={selectedMatchday ?? "all"}
                  onValueChange={(v) => setSelectedMatchday(v === "all" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle speeldagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle speeldagen</SelectItem>
                    {matchdays.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-1">
              <Button className="w-full md:w-auto" variant="outline" onClick={clearFilters}>
                Filters wissen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFilterPanel;
