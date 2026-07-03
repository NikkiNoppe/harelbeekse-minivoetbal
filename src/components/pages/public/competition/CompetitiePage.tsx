import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveStandingsTable from "@/components/tables/ResponsiveStandingsTable";
import { useCompetitionData, MatchData } from "@/hooks/useCompetitionData";
import { useMinLoadingGate } from "@/hooks/useMinLoadingGate";
import { PageHeader, PublicPage, PublicSectionHeading, PUBLIC_CARD_CLASS } from "@/components/layout";
import { FilterSelect, FilterGroup } from "@/components/ui/filter-select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DownloadScheduleButton from "@/components/common/DownloadScheduleButton";
import {
  SCHEDULE_ACCORDION_ITEM,
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
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
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
      <div key={i} className={SCHEDULE_ACCORDION_ITEM}>
        <Skeleton className="h-11 w-full rounded-none bg-muted/60" />
      </div>
    ))}
  </div>
));
ScheduleAccordionSkeleton.displayName = "ScheduleAccordionSkeleton";

const ScheduleEmptyState = memo(({
  hasTeamFilter,
  onResetFilter,
}: {
  hasTeamFilter: boolean;
  onResetFilter: () => void;
}) => (
  <div className="text-center py-8 space-y-4">
    <p className="text-sm text-muted-foreground">
      Geen wedstrijden gevonden met de huidige filters
    </p>
    {hasTeamFilter && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px]"
        onClick={onResetFilter}
      >
        Toon alle teams
      </Button>
    )}
  </div>
));
ScheduleEmptyState.displayName = "ScheduleEmptyState";

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
    <AccordionContent className="!p-0 border-t border-brand-light bg-card">
      {matches.map((match) => (
        <MatchListItem key={match.matchId} match={match} />
      ))}
    </AccordionContent>
  </AccordionItem>
));
MatchGroup.displayName = "MatchGroup";

const CompetitiePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    teams,
    hasStandingsData,
    hasMatchesData,
    matches,
    teamNames,
    standingsFetching,
    standingsError,
    refetchStandings,
    matchesFetching,
    matchesFetched,
    matchesError,
    refetchMatches,
    isRefreshing,
  } = useCompetitionData();

  const waitingForStandings =
    !hasStandingsData && standingsFetching && !standingsError;
  const waitingForMatches =
    !hasMatchesData && matchesFetching && !matchesError;

  const standingsGate = useMinLoadingGate(waitingForStandings);
  const matchesGate = useMinLoadingGate(waitingForMatches);

  const showStandingsSkeleton =
    (waitingForStandings || !standingsGate.minReady) &&
    !standingsGate.timedOut &&
    !standingsError;
  const showStandingsTimeout = standingsGate.timedOut && !hasStandingsData;

  const showMatchesSkeleton =
    (waitingForMatches || !matchesGate.minReady) &&
    !matchesGate.timedOut &&
    !matchesError;
  const showMatchesTimeout = matchesGate.timedOut && !hasMatchesData;

  const { isTabVisible } = useTabVisibility();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  const { data: seasonData } = useQuery({
    queryKey: withOrgQueryKey(["seasonData"], organizationId),
    queryFn: () => seasonService.getSeasonData(organizationId!),
    enabled: orgQueryEnabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const seasonSubtitle = seasonData
    ? `Seizoen ${deriveSeasonLabel(
        seasonData.season_start_date,
        seasonData.season_end_date,
      )}`
    : undefined;

  const [selectedTeam, setSelectedTeam] = useState(
    () => searchParams.get("team") ?? "all",
  );
  const [openSpeeldagen, setOpenSpeeldagen] = useState<string[]>([]);

  const handleTeamChange = useCallback(
    (value: string) => {
      setSelectedTeam(value);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "all") {
            next.delete("team");
          } else {
            next.set("team", value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const urlTeam = searchParams.get("team") ?? "all";
    setSelectedTeam((prev) => (prev === urlTeam ? prev : urlTeam));
  }, [searchParams]);

  useEffect(() => {
    if (!matchesFetched) return;
    if (selectedTeam === "all") return;
    if (teamNames.includes(selectedTeam)) return;
    handleTeamChange("all");
  }, [matchesFetched, teamNames, selectedTeam, handleTeamChange]);

  const allMatches = matches?.all ?? [];

  const filteredMatches = useMemo(() => {
    const filtered = allMatches.filter((m) => {
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
  }, [allMatches, selectedTeam]);

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
    if (allMatches.length === 0) return false;
    return allMatches.every(
      (m) =>
        m.homeScore !== undefined &&
        m.homeScore !== null &&
        m.awayScore !== undefined &&
        m.awayScore !== null,
    );
  }, [allMatches]);

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

  const teamFilterValue =
    selectedTeam === "all" || teamNames.includes(selectedTeam)
      ? selectedTeam
      : "all";

  return (
    <PublicPage>
      <PageHeader
        title="Competitie"
        subtitle={seasonSubtitle}
        className="mb-0"
        rightAction={
          isRefreshing ? (
            <span
              className="flex items-center justify-end gap-1 text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Vernieuwen…
            </span>
          ) : undefined
        }
      />

      {showPlayoffBanner && (
        <Alert
          className="border-primary/30 bg-primary/5 flex items-center justify-center py-4 text-center"
        >
          <AlertDescription className="text-center">
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
        <PublicSectionHeading id="standings-heading">
          Competitiestand
        </PublicSectionHeading>
        {standingsError || showStandingsTimeout ? (
          <Card className={PUBLIC_CARD_CLASS}>
            <CardContent className="p-4">
              <DataErrorState
                message={
                  showStandingsTimeout
                    ? "Het laden van de competitiestand duurt te lang. Controleer je verbinding."
                    : "Er is een fout opgetreden bij het laden van de competitiestand."
                }
                onRetry={() => refetchStandings()}
              />
            </CardContent>
          </Card>
        ) : (
          <ResponsiveStandingsTable
            teams={teams}
            isLoading={showStandingsSkeleton}
            embeddedInCard
          />
        )}
      </section>

      <section role="region" aria-labelledby="schedule-heading">
        <PublicSectionHeading id="schedule-heading">
          Speelschema
        </PublicSectionHeading>

        <FilterGroup columns={1} className="mb-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 w-full">
            <div className="flex-1 min-w-0 w-full">
              <FilterSelect
                label="Team"
                value={teamFilterValue}
                onValueChange={handleTeamChange}
                placeholder="Selecteer team"
                variant="schedule"
                options={[
                  { value: "all", label: "Alle teams" },
                  ...teamNames.map((t) => ({ value: t, label: t })),
                ]}
              />
            </div>
            <div className="w-full sm:w-1/4 sm:shrink-0">
              <DownloadScheduleButton
                matches={scheduleMatchesForExport}
                requiresTeamSelection
                hasTeamSelected={selectedTeam !== "all"}
                selectedTeamLabel={
                  selectedTeam !== "all" ? selectedTeam : undefined
                }
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
          </div>
        </FilterGroup>

        {matchesError || showMatchesTimeout ? (
          <DataErrorState
            message={
              showMatchesTimeout
                ? "Het laden van het speelschema duurt te lang. Controleer je verbinding."
                : "Er is een fout opgetreden bij het laden van het speelschema."
            }
            onRetry={() => refetchMatches()}
          />
        ) : showMatchesSkeleton ? (
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
          <ScheduleEmptyState
            hasTeamFilter={selectedTeam !== "all"}
            onResetFilter={() => handleTeamChange("all")}
          />
        ) : null}
      </section>
    </PublicPage>
  );
};

export default CompetitiePage;
