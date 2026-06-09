import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveStandingsTable from "@/components/tables/ResponsiveStandingsTable";
import { useCompetitionData, MatchData } from "@/hooks/useCompetitionData";
import { PageHeader } from "@/components/layout";
import { FilterSelect, FilterGroup } from "@/components/ui/filter-select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DownloadScheduleButton from "@/components/common/DownloadScheduleButton";
import {
  SCHEDULE_ACCORDION_ITEM,
  SCHEDULE_CONTROL,
  SCHEDULE_MATCH_META,
  SCHEDULE_MATCH_ROW,
  SCHEDULE_MATCH_SCORE,
  SCHEDULE_MATCH_TEAM,
  SCHEDULE_TRIGGER,
  SCHEDULE_TRIGGER_ACTIVE,
} from "@/components/common/scheduleControlStyles";
import { seasonService } from "@/services/seasonService";
import { deriveSeasonLabel } from "@/services/archiveService";
import { useTabVisibility } from "@/context/TabVisibilityContext";
import { cn } from "@/lib/utils";

const DataErrorState = memo(({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="text-center p-6">
    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-destructive" aria-hidden="true" />
    <p className="text-sm text-muted-foreground mb-4">{message}</p>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-[44px]"
      onClick={() => onRetry()}
    >
      Opnieuw proberen
    </Button>
  </div>
));
DataErrorState.displayName = "DataErrorState";

const ScheduleAccordionSkeleton = memo(() => (
  <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
    {[...Array(3)].map((_, i) => (
      <Skeleton key={i} className="h-11 w-full rounded-lg" />
    ))}
  </div>
));
ScheduleAccordionSkeleton.displayName = "ScheduleAccordionSkeleton";

const MatchListItem = memo(({ match }: { match: MatchData }) => {
  const isCompleted =
    match.homeScore !== undefined && match.awayScore !== undefined;

  return (
    <div className={SCHEDULE_MATCH_ROW}>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-1">
        <div className={cn("text-sm font-medium leading-tight text-left truncate", SCHEDULE_MATCH_TEAM)}>
          {match.homeTeamName}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isCompleted ? (
            <>
              <span className={cn("text-sm font-bold min-w-[20px] text-center tabular-nums", SCHEDULE_MATCH_SCORE)}>
                {match.homeScore}
              </span>
              <span className={cn("text-sm", SCHEDULE_MATCH_META)}>-</span>
              <span className={cn("text-sm font-bold min-w-[20px] text-center tabular-nums", SCHEDULE_MATCH_SCORE)}>
                {match.awayScore}
              </span>
            </>
          ) : (
            <span className={cn("text-sm font-medium", SCHEDULE_MATCH_META)}>vs</span>
          )}
        </div>
        <div className={cn("text-sm font-medium leading-tight text-right truncate", SCHEDULE_MATCH_TEAM)}>
          {match.awayTeamName}
        </div>
      </div>
      <div className={cn("grid grid-cols-3 gap-2 text-xs font-medium", SCHEDULE_MATCH_META)}>
        <span className="text-left truncate">{match.date}</span>
        <span className="text-center tabular-nums">{match.time || ""}</span>
        <span className="text-right truncate">{match.location || ""}</span>
      </div>
    </div>
  );
});
MatchListItem.displayName = "MatchListItem";

const MatchGroup = memo(({
  speeldag,
  matches,
}: {
  speeldag: string;
  matches: MatchData[];
}) => (
  <AccordionItem value={speeldag} className={SCHEDULE_ACCORDION_ITEM}>
    <AccordionTrigger
      variant="plain"
      className={cn(SCHEDULE_TRIGGER, SCHEDULE_TRIGGER_ACTIVE, "px-4 gap-3")}
    >
      <span className="text-left flex-1">{speeldag}</span>
    </AccordionTrigger>
    <AccordionContent className="!p-0 border-t border-purple-light bg-card">
      {matches.map((match) => (
        <MatchListItem key={match.matchId} match={match} />
      ))}
    </AccordionContent>
  </AccordionItem>
));
MatchGroup.displayName = "MatchGroup";

const CompetitiePage: React.FC = () => {
  const {
    teams,
    matches,
    teamNames,
    standingsLoading,
    standingsError,
    refetchStandings,
    matchesLoading,
    matchesFetched,
    matchesError,
    refetchMatches,
  } = useCompetitionData();

  const { isTabVisible } = useTabVisibility();

  const { data: seasonData } = useQuery({
    queryKey: ["seasonData"],
    queryFn: () => seasonService.getSeasonData(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const seasonSubtitle = seasonData
    ? `Seizoen ${deriveSeasonLabel(
        seasonData.season_start_date,
        seasonData.season_end_date,
      )}`
    : undefined;

  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [openSpeeldagen, setOpenSpeeldagen] = useState<string[]>([]);

  const filteredMatches = useMemo(() => {
    const filtered = matches.all.filter((m) => {
      if (
        selectedTeam !== "all" &&
        m.homeTeamName !== selectedTeam &&
        m.awayTeamName !== selectedTeam
      ) {
        return false;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return aKey.localeCompare(bKey);
    });
  }, [matches.all, selectedTeam]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, MatchData[]>();
    filteredMatches.forEach((match) => {
      const speeldag = match.matchday || "Overige";
      if (!groups.has(speeldag)) {
        groups.set(speeldag, []);
      }
      groups.get(speeldag)!.push(match);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "999", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || "999", 10);
      return numA - numB;
    });
  }, [filteredMatches]);

  const defaultOpenSpeeldag = useMemo(() => {
    for (const [speeldag, dayMatches] of groupedMatches) {
      const isCompleted = dayMatches.every(
        (match) =>
          match.homeScore !== undefined &&
          match.homeScore !== null &&
          match.awayScore !== undefined &&
          match.awayScore !== null,
      );
      if (!isCompleted && dayMatches.length > 0) {
        return speeldag;
      }
    }
    return groupedMatches.length > 0
      ? groupedMatches[groupedMatches.length - 1][0]
      : undefined;
  }, [groupedMatches]);

  const allRegularMatchesComplete = useMemo(() => {
    if (matches.all.length === 0) return false;
    return matches.all.every(
      (m) =>
        m.homeScore !== undefined &&
        m.homeScore !== null &&
        m.awayScore !== undefined &&
        m.awayScore !== null,
    );
  }, [matches.all]);

  const showPlayoffBanner =
    allRegularMatchesComplete && isTabVisible("playoff");

  const isManualChangeRef = useRef(false);
  const prevSelectedTeamRef = useRef(selectedTeam);

  useEffect(() => {
    const selectedTeamChanged = prevSelectedTeamRef.current !== selectedTeam;

    if (isManualChangeRef.current && !selectedTeamChanged) {
      isManualChangeRef.current = false;
      return;
    }

    if (selectedTeamChanged) {
      prevSelectedTeamRef.current = selectedTeam;
    }

    if (selectedTeam === "all") {
      setOpenSpeeldagen(defaultOpenSpeeldag ? [defaultOpenSpeeldag] : []);
    } else {
      setOpenSpeeldagen(groupedMatches.map(([speeldag]) => speeldag));
    }

    isManualChangeRef.current = false;
  }, [selectedTeam, defaultOpenSpeeldag, groupedMatches]);

  const handleAccordionChange = useCallback((value: string[]) => {
    isManualChangeRef.current = true;
    setOpenSpeeldagen(value);
  }, []);

  const formatDutchDayShort = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(Date.UTC(y, m - 1, d));
      const days = ["ZO", "MA", "DI", "WO", "DO", "VR", "ZA"];
      const dayAbbr = days[date.getUTCDay()];
      const yy = String(y).slice(-2);
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${dayAbbr} ${dd}-${mm}-${yy}`;
    } catch {
      return dateStr;
    }
  };

  const scheduleMatchesForExport = filteredMatches.map((m) => ({
    matchId: m.matchId,
    homeTeamName: m.homeTeamName,
    awayTeamName: m.awayTeamName,
    date: m.date,
    time: m.time,
    location: m.location,
    matchday: m.matchday,
    uniqueNumber: m.uniqueNumber,
  }));

  return (
    <div className="space-y-6 motion-safe:animate-slide-up">
      <PageHeader title="Competitie" subtitle={seasonSubtitle} />

      {showPlayoffBanner && (
        <Alert className="border-primary/30 bg-primary/5">
          <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
          <AlertDescription>
            <strong>Reguliere competitie afgelopen!</strong>{" "}
            <Link
              to="/playoff"
              className="text-primary font-medium hover:underline"
            >
              Bekijk de play-offs →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <section role="region" aria-labelledby="standings-heading">
        <h2
          id="standings-heading"
          className="text-lg font-semibold text-foreground mb-3"
        >
          Competitiestand
        </h2>
        {standingsError ? (
          <Card>
            <CardContent className="p-4">
              <DataErrorState
                message="Er is een fout opgetreden bij het laden van de competitiestand."
                onRetry={() => refetchStandings()}
              />
            </CardContent>
          </Card>
        ) : (
          <ResponsiveStandingsTable
            teams={teams}
            isLoading={standingsLoading}
            embeddedInCard
          />
        )}
      </section>

      <section role="region" aria-labelledby="schedule-heading">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle id="schedule-heading" className="text-lg">
              Speelschema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <FilterGroup columns={1} className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <FilterSelect
                    label="Team"
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                    placeholder="Alle teams"
                    variant="schedule"
                    options={[
                      { value: "all", label: "Alle teams" },
                      ...teamNames.map((t) => ({ value: t, label: t })),
                    ]}
                  />
                </div>
                <DownloadScheduleButton
                  className={cn(SCHEDULE_CONTROL, "shrink-0 px-3 shadow-none")}
                  matches={scheduleMatchesForExport}
                  filename={
                    selectedTeam !== "all"
                      ? `competitie-${selectedTeam.toLowerCase().replace(/\s+/g, "-")}`
                      : "competitie-schema"
                  }
                  calendarName={
                    selectedTeam !== "all"
                      ? `Competitie - ${selectedTeam}`
                      : "Competitie Speelschema"
                  }
                  competitionType="competitie"
                />
              </div>
            </FilterGroup>

            {matchesError ? (
              <DataErrorState
                message="Er is een fout opgetreden bij het laden van het speelschema."
                onRetry={() => refetchMatches()}
              />
            ) : matchesLoading && !matchesFetched ? (
              <ScheduleAccordionSkeleton />
            ) : groupedMatches.length > 0 ? (
              <Accordion
                type="multiple"
                value={openSpeeldagen}
                onValueChange={handleAccordionChange}
                className="space-y-3"
              >
                {groupedMatches.map(([speeldag, dayMatches]) => (
                  <MatchGroup
                    key={speeldag}
                    speeldag={speeldag}
                    matches={dayMatches.map((m) => ({
                      ...m,
                      date: formatDutchDayShort(m.date),
                    }))}
                  />
                ))}
              </Accordion>
            ) : matchesFetched ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Geen wedstrijden gevonden met de huidige filters
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CompetitiePage;
