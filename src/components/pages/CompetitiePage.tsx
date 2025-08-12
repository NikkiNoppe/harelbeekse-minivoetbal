import React, { memo, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import MatchesCard from "./admin/matches/components/MatchesCard";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "../tables/ResponsiveScheduleTable";
import { useCompetitionData, Team, MatchData } from "@/hooks/useCompetitionData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MatchFilterPanel, { MatchFilterState } from "@/components/common/MatchFilterPanel";
import { format } from "date-fns";

// Uniform skeleton for standings table
const StandingsTableSkeleton = memo(() => (
  <Table className="table">
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead className="num">Pos</TableHead>
        <TableHead className="left">Team</TableHead>
        <TableHead>Wed</TableHead>
        <TableHead>W</TableHead>
        <TableHead>G</TableHead>
        <TableHead>V</TableHead>
        <TableHead>+/-</TableHead>
        <TableHead>Ptn</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(6)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

// Uniform skeleton for schedule table (voorbeeld, pas kolommen aan indien nodig)
const ScheduleTableSkeleton = memo(() => (
  <Table className="table">
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speeldag</TableHead>
        <TableHead>Wedstrijd</TableHead>
        <TableHead>Datum</TableHead>
        <TableHead>Tijd</TableHead>
        <TableHead>Locatie</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(6)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

// Memoized standings section
const StandingsSection = memo(({ 
  teams, 
  isLoading, 
  error, 
  onRetry 
}: { 
  teams?: Team[]; 
  isLoading: boolean; 
  error: Error | null; 
  onRetry: () => void; 
}) => (
  <section>
    <Card>
      <CardContent className="bg-transparent">
        {isLoading ? (
          <StandingsTableSkeleton />
        ) : error ? (
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
            <p className="text-red-500 mb-4">
              Er is een fout opgetreden bij het laden van de competitiestand.
            </p>

          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p className="mb-2">Nog geen competitiestand beschikbaar.</p>
            <p className="text-sm">Standings worden automatisch bijgewerkt wanneer wedstrijden worden ingediend.</p>
          </div>
        ) : (
          <ResponsiveStandingsTable teams={teams} />
        )}
      </CardContent>
    </Card>
  </section>
));

// Memoized matches section
const MatchesSection = memo(({ 
  title, 
  description, 
  matches, 
  isLoading 
}: { 
  title: string; 
  description: string; 
  matches: MatchData[]; 
  isLoading: boolean; 
}) => (
  <Card>
    <CardHeader className="bg-transparent">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="bg-transparent">
      {isLoading ? (
        <ScheduleTableSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {matches.map(match => (
            <MatchesCard
              key={match.matchId}
              id={match.uniqueNumber || `M${match.matchId}`}
              home={match.homeTeamName}
              away={match.awayTeamName}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              date={match.date}
              time={match.time}
              location={match.location}
              status={undefined}
              badgeSlot={<div></div>}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
));

// Memoized filter controls
const FilterControls = memo(({ 
  searchTerm, 
  setSearchTerm, 
  selectedMatchday, 
  setSelectedMatchday, 
  selectedTeam, 
  setSelectedTeam, 
  matchdays, 
  teamNames, 
  onClearFilters 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMatchday: string;
  setSelectedMatchday: (day: string) => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  matchdays: string[];
  teamNames: string[];
  onClearFilters: () => void;
}) => (
  <div className="mb-4 space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
      <div>
        <Label htmlFor="matchday-filter" className="text-sm font-medium mb-2 block">
          Filter op speeldag
        </Label>
        <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
          <SelectTrigger id="matchday-filter" className="btn-white h-10">
            <SelectValue placeholder="Alle speeldagen" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style">
            <SelectItem value="all-matchdays" className="dropdown-item-login-style">
              Alle speeldagen
            </SelectItem>
            {matchdays.map((day, idx) => (
              <SelectItem key={idx} value={day} className="dropdown-item-login-style">
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="team-filter" className="text-sm font-medium mb-2 block">
          Filter op team
        </Label>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger id="team-filter" className="btn-white h-10">
            <SelectValue placeholder="Alle teams" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style">
            <SelectItem value="all-teams" className="dropdown-item-login-style">
              Alle teams
            </SelectItem>
            {teamNames.map((team, idx) => (
              <SelectItem key={idx} value={team} className="dropdown-item-login-style">
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="search" className="text-sm font-medium mb-2 block">
          Zoeken
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-purple-400 transform -translate-y-1/2 z-10" />
          <Input
            id="search"
            placeholder="Zoek op team, locatie, etc."
            className="pl-10 input-login-style"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>

    <Button className="btn-white w-full md:w-auto" onClick={onClearFilters}>
      Filters wissen
    </Button>
  </div>
));

// Main component
const CompetitiePage: React.FC = () => {
  const [filterState, setFilterState] = useState<MatchFilterState>({
    search: "",
    selectedTeams: [],
    selectedDate: null,
    selectedMatchday: null,
  });

  const {
    teams,
    matches,
    matchdays,
    teamNames,
    standingsLoading,
    matchesLoading,
    standingsError,
    refetchStandings
  } = useCompetitionData();

  // Memoized filtered matches
  const filteredMatches = useMemo(() => {
    return matches.all.filter(match => {
      if (selectedMatchday && selectedMatchday !== "all-matchdays" && match.matchday !== selectedMatchday) {
        return false;
      }
      if (selectedTeam && selectedTeam !== "all-teams" && 
          match.homeTeamName !== selectedTeam && match.awayTeamName !== selectedTeam) {
        return false;
      }
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          match.homeTeamName.toLowerCase().includes(lowerSearchTerm) ||
          match.awayTeamName.toLowerCase().includes(lowerSearchTerm) ||
          match.matchday.toLowerCase().includes(lowerSearchTerm) ||
          (match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(lowerSearchTerm))
        );
      }
      return true;
    });
  }, [matches.all, selectedMatchday, selectedTeam, searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedMatchday("");
    setSelectedTeam("");
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Competitiestand</h2>
        <Badge className="badge-purple">Seizoen 2025-2026</Badge>
      </div>

      <section>
        <Card>
          <CardContent className="bg-transparent">
            <ResponsiveStandingsTable teams={teams} isLoading={standingsLoading} />
          </CardContent>
        </Card>
      </section>

      <MatchesSection
        title="Aankomende Wedstrijden"
        description="Wedstrijden van de komende speeldag"
        matches={matches.upcoming}
        isLoading={matchesLoading}
      />

      <MatchesSection
        title="Afgelopen Wedstrijden"
        description="Resultaten van de laatst gespeelde speeldag"
        matches={matches.past}
        isLoading={matchesLoading}
      />

      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Speelschema</CardTitle>
          <CardDescription>Volledig overzicht van alle wedstrijden</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          <FilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedMatchday={selectedMatchday}
            setSelectedMatchday={setSelectedMatchday}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            matchdays={matchdays}
            teamNames={teamNames}
            onClearFilters={handleClearFilters}
          />
          <ResponsiveScheduleTable matches={filteredMatches} />
        </CardContent>
      </Card>
    </div>
  );
};

// Set display names for better debugging
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
ScheduleTableSkeleton.displayName = 'ScheduleTableSkeleton';
MatchesSection.displayName = 'MatchesSection';
FilterControls.displayName = 'FilterControls';

export default CompetitiePage; 