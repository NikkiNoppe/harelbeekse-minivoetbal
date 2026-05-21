import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trophy, Info } from "lucide-react";
import { usePublicPlayoffData, PlayoffTeam, PlayoffMatchData, HeadToHeadMatch } from "@/hooks/usePublicPlayoffData";
import { FilterSelect, FilterGroup } from "@/components/ui/filter-select";
import { PageHeader } from "@/components/layout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import DownloadScheduleButton from "@/components/common/DownloadScheduleButton";

// Detect groups of teams with equal total points (potential tiebreaker cases)
const findTiedGroups = (teams: PlayoffTeam[]): PlayoffTeam[][] => {
  const groups: PlayoffTeam[][] = [];
  let current: PlayoffTeam[] = [];
  teams.forEach((t, i) => {
    if (i === 0 || t.total_points !== teams[i - 1].total_points) {
      if (current.length > 1) groups.push(current);
      current = [t];
    } else {
      current.push(t);
    }
  });
  if (current.length > 1) groups.push(current);
  return groups;
};

// Bepaal welk criterium de doorslag gaf binnen een tied groep
type DecidingCriterion =
  | { type: 'wins' }
  | { type: 'h2h' }
  | { type: 'goal_diff' }
  | { type: 'goals_scored' }
  | { type: 'alphabetical' };

const getDecidingCriterion = (group: PlayoffTeam[]): DecidingCriterion => {
  const allEqual = <K extends keyof PlayoffTeam>(k: K) =>
    group.every(t => t[k] === group[0][k]);
  if (!allEqual('total_wins')) return { type: 'wins' };
  // Wins gelijk → head-to-head (punten + doelsaldo in onderlinge wedstrijden)
  // We tonen dit als de eerstvolgende toegepaste tiebreaker. Als ook algemeen
  // saldo & gemaakte goals identiek zijn, was het effectief alfabetisch.
  if (!allEqual('total_goal_diff') || !allEqual('total_goals_scored')) {
    return { type: 'h2h' };
  }
  return { type: 'alphabetical' };
};

// Format match date as "do 14 mei" (UTC, mobile-first compact)
const formatMatchDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('nl-BE', { weekday: 'short', timeZone: 'UTC' });
  const day = d.toLocaleDateString('nl-BE', { day: 'numeric', timeZone: 'UTC' });
  const month = d.toLocaleDateString('nl-BE', { month: 'short', timeZone: 'UTC' });
  return `${weekday} ${day} ${month}`;
};

// Tabel met onderlinge wedstrijden + mini-stand (punten / saldo) per team
const H2HBlock = memo(({
  group,
  matches,
}: {
  group: PlayoffTeam[];
  matches: HeadToHeadMatch[];
}) => {
  const groupIds = new Set(group.map(t => t.team_id));
  const between = matches
    .filter(m => groupIds.has(m.home_team_id) && groupIds.has(m.away_team_id))
    .sort((a, b) => (a.match_date || '').localeCompare(b.match_date || ''));

  if (between.length === 0) {
    return (
      <div className="mt-1 italic">
        Geen onderlinge wedstrijden gespeeld tussen deze teams.
      </div>
    );
  }

  // Mini-stand opbouwen
  const mini = new Map<number, { pts: number; gf: number; ga: number }>();
  group.forEach(t => mini.set(t.team_id, { pts: 0, gf: 0, ga: 0 }));
  between.forEach(m => {
    const h = mini.get(m.home_team_id)!;
    const a = mini.get(m.away_team_id)!;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) h.pts += 3;
    else if (m.home_score < m.away_score) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  });

  return (
    <div className="mt-2 space-y-2">
      <div className="rounded border" style={{ borderColor: 'var(--accent)' }}>
        {between.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 px-2 py-1 border-b last:border-b-0"
            style={{ borderColor: 'var(--accent)' }}
          >
            <span className="tabular-nums opacity-75 text-[11px]">
              {formatMatchDate(m.match_date)}
            </span>
            <span className="text-right truncate">{m.home_team_name}</span>
            <span className="font-semibold tabular-nums">
              {m.home_score} – {m.away_score}
            </span>
            <span className="truncate">{m.away_team_name}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {m.is_playoff ? 'PO' : 'comp.'}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[11px]">
        <span className="font-medium" style={{ color: 'var(--accent-foreground)' }}>
          Onderlinge stand:
        </span>{' '}
        {group.map((t, i) => {
          const s = mini.get(t.team_id)!;
          const diff = s.gf - s.ga;
          return (
            <span key={t.team_id}>
              {t.team_name} <strong>{s.pts}</strong> pt (saldo {diff > 0 ? '+' : ''}{diff})
              {i < group.length - 1 ? ' · ' : ''}
            </span>
          );
        })}
        .
      </div>
    </div>
  );
});
H2HBlock.displayName = 'H2HBlock';

// Subtle notice about applied tiebreaker rules for tied teams
const TiebreakerNotice = memo(({
  teams,
  headToHeadMatches,
}: {
  teams: PlayoffTeam[];
  headToHeadMatches: HeadToHeadMatch[];
}) => {
  const tied = findTiedGroups(teams);
  if (tied.length === 0) return null;

  return (
    <div
      className="mt-3 space-y-3 rounded-md border border-dashed px-3 py-2 text-xs"
      style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
      role="note"
    >
      {tied.map((g, idx) => {
        const crit = getDecidingCriterion(g);
        const points = g[0].total_points;
        return (
          <div key={idx} className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div>
                <span className="font-medium" style={{ color: 'var(--accent-foreground)' }}>
                  Gelijke stand op {points} punten:
                </span>{' '}
                {g.map((t, i) => (
                  <span key={t.team_id}>
                    {t.team_name}
                    {i < g.length - 1 ? ' & ' : ''}
                  </span>
                ))}
                .
              </div>

              {crit.type === 'wins' && (
                <>
                  <div className="mt-1">
                    Volgorde bepaald op <strong>aantal gewonnen wedstrijden</strong> (competitie + play-offs samengeteld):{' '}
                    {g.map((t, i) => (
                      <span key={t.team_id}>
                        {t.team_name} <strong>{t.total_wins}</strong> wins
                        {i < g.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    . Daardoor komen onderlinge wedstrijden hier niet aan te pas.
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer select-none underline-offset-2 hover:underline">
                      Toon onderlinge wedstrijden ter info
                    </summary>
                    <H2HBlock group={g} matches={headToHeadMatches} />
                  </details>
                </>
              )}

              {crit.type === 'h2h' && (
                <>
                  <div className="mt-1">
                    Wins zijn gelijk ({g[0].total_wins} elk, competitie + play-offs). De volgorde wordt
                    dan bepaald door de <strong>onderlinge wedstrijden</strong> — eerst punten, dan
                    doelsaldo in de duels tussen deze teams (regulier + play-off samen). Daarna
                    volgen algemeen doelsaldo en totaal gemaakte doelpunten — zie reglement onderaan.
                  </div>
                  <H2HBlock group={g} matches={headToHeadMatches} />
                </>
              )}

              {crit.type === 'alphabetical' && (
                <div className="mt-1">
                  Alle sportieve criteria zijn gelijk — volgens reglement zou hier een{' '}
                  <strong>testmatch of loting</strong> volgen. Voorlopig alfabetisch weergegeven.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
TiebreakerNotice.displayName = 'TiebreakerNotice';

// Compact rules summary
const PlayoffRules = memo(() => (
  <section role="region" aria-labelledby="rules-heading">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle id="rules-heading" className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          Reglement &amp; tiebreakers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>
        <p className="mb-2">
          Top 8 uit de reguliere competitie speelt <strong>Play-Off 1</strong>, de overige teams
          <strong> Play-Off 2</strong>. De eindstand combineert alle wedstrijden (regulier + play-off).
        </p>
        <p className="mb-1 font-medium" style={{ color: 'var(--accent-foreground)' }}>
          Bij gelijke punten:
        </p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>Aantal gewonnen wedstrijden</li>
          <li>Punten in onderlinge wedstrijden</li>
          <li>Doelsaldo in onderlinge wedstrijden</li>
          <li>Algemeen doelsaldo</li>
          <li>Totaal gemaakte doelpunten</li>
          <li>Testmatch of loting, indien nodig</li>
        </ol>
      </CardContent>
    </Card>
  </section>
));
PlayoffRules.displayName = 'PlayoffRules';

// Skeleton components
const StandingsTableSkeleton = memo(() => (
  <div className="space-y-3">
    {[...Array(8)].map((_, index) => (
      <div key={index} className="p-3 bg-muted/20 rounded">
        <div className="flex justify-between items-center mb-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-8" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
));
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';

const ScheduleSkeleton = memo(() => (
  <div className="space-y-3">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="p-3 border border-border rounded-lg">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-5 w-full" />
      </div>
    ))}
  </div>
));
ScheduleSkeleton.displayName = 'ScheduleSkeleton';

const PlayoffLoading = memo(() => (
  <div className="space-y-6 animate-slide-up">
    <PageHeader 
      title="Play-Off Klassement" 
      subtitle="Seizoen 2025-2026"
    />
    <Card>
      <CardContent className="p-4">
        <StandingsTableSkeleton />
      </CardContent>
    </Card>
  </div>
));
PlayoffLoading.displayName = 'PlayoffLoading';

const PlayoffError = memo(({ onRetry }: { onRetry: () => void }) => (
  <div className="space-y-6 animate-slide-up">
    <PageHeader 
      title="Play-Off Klassement" 
      subtitle="Seizoen 2025-2026"
    />
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
          <p className="mb-4" style={{ color: 'var(--accent)' }}>
            Kon playoff gegevens niet laden
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
));
PlayoffError.displayName = 'PlayoffError';

const PlayoffEmptyState = memo(() => (
  <div className="space-y-6 animate-slide-up">
    <PageHeader 
      title="Play-Off Klassement" 
      subtitle="Seizoen 2025-2026"
    />
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Trophy className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h3 className="text-lg font-semibold mb-2">Geen Play-Off Data</h3>
          <p style={{ color: 'var(--accent)' }}>
            Er zijn momenteel geen play-off gegevens beschikbaar.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
));
PlayoffEmptyState.displayName = 'PlayoffEmptyState';

// Enhanced compact standings - Table with header and vertical lines
const CompactStandings = memo(({ teams, title }: { teams: PlayoffTeam[]; title: string }) => {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--accent)' }}>
        Geen teams beschikbaar
      </div>
    );
  }

  return (
    <div>
      {/* Table structure with header */}
      <div className="rounded-lg overflow-hidden">
        {/* Header Row - Light purple background with white text */}
        <div className="bg-primary/80">
          <div className="flex items-center px-3 py-2 gap-3" style={{ backgroundColor: 'var(--accent)' }}>
            {/* Pos column */}
            <div className="flex-shrink-0 w-7 text-center">
              <span className="text-xs font-semibold text-white">Pos</span>
            </div>

            {/* Team column */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white">Team</span>
            </div>

            {/* Stats columns */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">W</span>
              </div>
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">G</span>
              </div>
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">V</span>
              </div>
              <div className="text-center w-9">
                <span className="text-xs font-semibold text-white">Ptn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Rows */}
        {teams.map((team, index) => (
          <div 
            key={team.team_id}
            className="hover:bg-primary/5 transition-colors border-b last:border-b-0"
            style={{ borderColor: 'var(--accent)' }}
          >
            <div className="flex items-center p-3 gap-3" style={{ color: 'var(--accent)', borderColor: 'transparent', borderImage: 'none', boxSizing: 'content-box', borderStyle: 'none' }}>
              {/* Position Badge */}
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent-foreground)' }}>{index + 1}</span>
              </div>

              {/* Team Name & Stats */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight mb-1.5" style={{ color: 'var(--accent-foreground)' }}>
                  {team.team_name}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--accent)' }}>
                  {/* Wedstrijden - Fixed width for alignment */}
                  <div className="flex items-center gap-1 min-w-[48px]">
                    <span className="tabular-nums font-medium" style={{ color: 'var(--accent)' }}>{team.playoff_played}</span>
                    <span style={{ color: 'var(--accent)' }}>wed</span>
                  </div>
                  {/* Goal Difference - Fixed width for alignment */}
                  <div className="flex items-center gap-1 min-w-[56px]">
                    <span 
                      className="tabular-nums font-medium"
                      style={{ 
                        color: team.playoff_goal_diff > 0 ? 'rgb(22, 163, 74)' : 
                               team.playoff_goal_diff < 0 ? 'rgb(220, 38, 38)' : 
                               'var(--accent)'
                      }}
                    >
                      {team.playoff_goal_diff > 0 ? "+" : ""}{team.playoff_goal_diff}
                    </span>
                    <span style={{ color: 'var(--accent)' }}>saldo</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-semibold tabular-nums" 
                    style={{ color: team.playoff_wins > 0 ? 'rgb(22, 163, 74)' : 'var(--accent-foreground)' }}
                  >
                    {team.playoff_wins}
                  </div>
                </div>
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-medium tabular-nums" 
                    style={{ color: team.playoff_draws > 0 ? 'rgb(202, 138, 4)' : 'var(--accent-foreground)' }}
                  >
                    {team.playoff_draws}
                  </div>
                </div>
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-semibold tabular-nums" 
                    style={{ color: team.playoff_losses > 0 ? 'rgb(220, 38, 38)' : 'var(--accent-foreground)' }}
                  >
                    {team.playoff_losses}
                  </div>
                </div>
                <div className="text-center w-9">
                  <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-foreground)' }}>{team.total_points}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 px-2 text-xs" style={{ color: 'var(--accent)', textAlign: 'center' }}>
        W = Winst • G = Gelijk • V = Verlies • Ptn = Totaal punten
      </div>
    </div>
  );
});
CompactStandings.displayName = 'CompactStandings';

// Compact match list item - 2 lines max with perfect time centering
const MatchListItem = memo(({ match }: { match: any }) => {
  const isCompleted = match.isCompleted;
  
  return (
    <div className="py-2.5 px-3 border-b last:border-0 hover:bg-muted/20 transition-colors" style={{ borderColor: 'var(--accent)' }}>
      {/* Line 1: Teams with scores - Grid layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-1">
        {/* Home Team - Left aligned */}
        <div className="text-sm font-medium leading-tight text-left truncate">
          {match.homeTeamName}
        </div>
        
        {/* Center: VS + Scores */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
            <>
              <span className="text-base font-bold min-w-[20px] text-center">{match.homeScore}</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>-</span>
              <span className="text-base font-bold min-w-[20px] text-center">{match.awayScore}</span>
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>vs</span>
          )}
        </div>
        
        {/* Away Team - Right aligned */}
        <div className="text-sm font-medium leading-tight text-right truncate">
          {match.awayTeamName}
        </div>
      </div>

      {/* Line 2: Date, time (perfect center), location (right) - Grid layout */}
      <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: 'var(--accent)', fontSize: '11px' }}>
        <span className="text-left">{match.date}</span>
        <span className="text-center font-medium">{match.time || ''}</span>
        <span className="text-right">{match.location || ''}</span>
      </div>
    </div>
  );
});
MatchListItem.displayName = 'MatchListItem';

// Group matches by speeldag
const MatchGroup = memo(({ speeldag, matches, playoffType }: { 
  speeldag: string; 
  matches: any[];
  playoffType: 'PO1' | 'PO2' | 'mixed';
}) => {
  return (
    <AccordionItem 
      value={speeldag} 
      className="border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white mb-4"
    >
      <AccordionTrigger 
        className="text-base font-semibold px-5 py-4 hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4"
        style={{ color: 'var(--color-700)' }}
      >
        <div className="flex items-center justify-between flex-1">
          <span className="text-left">{speeldag}</span>
          {playoffType !== 'mixed' && (
            <Badge variant="outline" className="text-xs mr-2">
              {playoffType}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 py-0 text-card-foreground border-t border-[var(--color-200)]" style={{ backgroundColor: 'white' }}>
        {/* Matches */}
        <div className="rounded-lg overflow-hidden bg-card" style={{ backgroundColor: 'white' }}>
          {matches.map((match) => (
            <MatchListItem key={match.matchId} match={match} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});
MatchGroup.displayName = 'MatchGroup';

// Main component - Mobile-first
const PlayOffPage: React.FC = () => {
  const { data, isLoading, error, refetch } = usePublicPlayoffData();
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [openSpeeldagen, setOpenSpeeldagen] = useState<string[]>([]);

  // Convert matches to schedule format
  const scheduleMatches = useMemo(() => {
    if (!data?.allMatches) return [];
    return data.allMatches.map(match => {
      const matchDate = new Date(match.match_date);
      
      // Format date with weekday: "ma 19 jan"
      const weekday = matchDate.toLocaleDateString('nl-BE', { weekday: 'short' });
      const day = matchDate.toLocaleDateString('nl-BE', { day: 'numeric' });
      const month = matchDate.toLocaleDateString('nl-BE', { month: 'short' });
      const dateStr = `${weekday} ${day} ${month}`;
      
      const poLabel = match.playoff_type === 'top' ? 'PO1' : 'PO2';
      const speeldagNum = match.speeldag ? match.speeldag.match(/(\d+)/) : null;
      const speeldagClean = speeldagNum ? speeldagNum[1] : null;
      
      return {
        matchId: match.match_id,
        matchday: speeldagClean || poLabel,
        playoffType: poLabel,
        speeldagNumber: speeldagClean,
        date: dateStr,
        rawDate: match.match_date.split('T')[0], // YYYY-MM-DD for downloads
        time: match.time,
        homeTeamName: match.home_team_name,
        awayTeamName: match.away_team_name,
        homeScore: match.home_score ?? undefined,
        awayScore: match.away_score ?? undefined,
        location: match.location,
        isCompleted: match.is_completed
      };
    });
  }, [data?.allMatches]);

  // Get unique team names for filter
  const teamNames = useMemo(() => {
    const names = new Set<string>();
    scheduleMatches.forEach(m => {
      if (m.homeTeamName) names.add(m.homeTeamName);
      if (m.awayTeamName) names.add(m.awayTeamName);
    });
    return Array.from(names).sort((a, b) => {
      const posA = a.match(/Team pos\. (\d+)/);
      const posB = b.match(/Team pos\. (\d+)/);
      if (posA && posB) return parseInt(posA[1]) - parseInt(posB[1]);
      if (posA) return -1;
      if (posB) return 1;
      return a.localeCompare(b, 'nl');
    });
  }, [scheduleMatches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return scheduleMatches.filter(m => {
      if (selectedDivision !== "all" && m.playoffType !== selectedDivision) return false;
      if (selectedTeam !== "all" && m.homeTeamName !== selectedTeam && m.awayTeamName !== selectedTeam) return false;
      return true;
    });
  }, [scheduleMatches, selectedDivision, selectedTeam]);

  // Group matches by speeldag
  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: { matches: any[]; playoffType: 'PO1' | 'PO2' | 'mixed' } } = {};
    
    filteredMatches.forEach(match => {
      const key = match.matchday;
      if (!groups[key]) {
        groups[key] = { matches: [], playoffType: match.playoffType as 'PO1' | 'PO2' };
      } else if (groups[key].playoffType !== match.playoffType) {
        groups[key].playoffType = 'mixed';
      }
      groups[key].matches.push(match);
    });

    // Sort groups by speeldag number
    return Object.entries(groups).sort(([a], [b]) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  }, [filteredMatches]);

  // Find the first speeldag that is not fully completed (like beker and competitie)
  const defaultOpenSpeeldag = useMemo(() => {
    for (const [speeldag, { matches }] of groupedMatches) {
      const isCompleted = matches.every(match => 
        match.homeScore !== undefined && 
        match.homeScore !== null && 
        match.awayScore !== undefined && 
        match.awayScore !== null
      );
      if (!isCompleted && matches.length > 0) {
        return speeldag;
      }
    }
    // If all are completed, return the last one
    return groupedMatches.length > 0 ? groupedMatches[groupedMatches.length - 1][0] : undefined;
  }, [groupedMatches]);

  // Update open speeldagen based on team selection
  // Use a ref to track if we should allow manual changes
  const isManualChangeRef = React.useRef(false);
  const prevSelectedTeamRef = React.useRef(selectedTeam);
  
  React.useEffect(() => {
    // Only update if selectedTeam actually changed
    const selectedTeamChanged = prevSelectedTeamRef.current !== selectedTeam;
    
    // Don't override manual changes unless filter actually changed
    if (isManualChangeRef.current && !selectedTeamChanged) {
      isManualChangeRef.current = false;
      return;
    }
    
    // Update ref
    if (selectedTeamChanged) {
      prevSelectedTeamRef.current = selectedTeam;
    }
    
    if (selectedTeam === "all") {
      // Default: only first incomplete speeldag
      if (defaultOpenSpeeldag) {
        setOpenSpeeldagen([defaultOpenSpeeldag]);
      } else {
        setOpenSpeeldagen([]);
      }
    } else {
      // When a team is selected: open all speeldagen
      const allSpeeldagen = groupedMatches.map(([speeldag]) => speeldag);
      setOpenSpeeldagen(allSpeeldagen);
    }
    
    isManualChangeRef.current = false;
  }, [selectedTeam, defaultOpenSpeeldag]);

  // Handle manual accordion changes
  const handleAccordionChange = React.useCallback((value: string[]) => {
    isManualChangeRef.current = true;
    setOpenSpeeldagen(value);
  }, []);

  if (isLoading) {
    return <PlayoffLoading />;
  }

  if (error) {
    return <PlayoffError onRetry={() => refetch()} />;
  }

  if (!data?.hasData) {
    return <PlayoffEmptyState />;
  }

  const { po1Teams, po2Teams, headToHeadMatches = [] } = data;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader 
        title="Play-Off" 
        subtitle="Seizoen 2025-2026"
      />


      {/* Play-Off 1 Standings */}
      <section role="region" aria-labelledby="po1-heading">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle id="po1-heading" className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              Play-Off 1
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CompactStandings teams={po1Teams} title="Play-Off 1" />
            <TiebreakerNotice teams={po1Teams} headToHeadMatches={headToHeadMatches} />
          </CardContent>
        </Card>
      </section>

      {/* Play-Off 2 Standings */}
      <section role="region" aria-labelledby="po2-heading">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle id="po2-heading" className="text-lg">Play-Off 2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CompactStandings teams={po2Teams} title="Play-Off 2" />
            <TiebreakerNotice teams={po2Teams} headToHeadMatches={headToHeadMatches} />
          </CardContent>
        </Card>
      </section>

      {/* Schedule */}
      <section role="region" aria-labelledby="schedule-heading">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle id="schedule-heading" className="text-lg">Speelschema</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Filters - Mobile-first with automatic responsive layout */}
            <FilterGroup columns={1} className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <FilterSelect
                    label="Divisie"
                    value={selectedDivision}
                    onValueChange={setSelectedDivision}
                    placeholder="Alle divisies"
                    options={[
                      { value: "all", label: "Alle divisies" },
                      { value: "PO1", label: "Play-Off 1" },
                      { value: "PO2", label: "Play-Off 2" }
                    ]}
                  />
                  <FilterSelect
                    label="Team"
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                    placeholder="Alle teams"
                    options={[
                      { value: "all", label: "Alle teams" },
                      ...teamNames.map(t => ({ value: t, label: t }))
                    ]}
                  />
                </div>
                <DownloadScheduleButton 
                  matches={filteredMatches.map(m => ({
                    matchId: m.matchId,
                    homeTeamName: m.homeTeamName,
                    awayTeamName: m.awayTeamName,
                    date: m.rawDate, // Use rawDate (YYYY-MM-DD) for downloads
                    time: m.time,
                    location: m.location,
                    matchday: m.matchday,
                  }))}
                  filename={
                    selectedTeam !== "all" 
                      ? `playoff-${selectedTeam.toLowerCase().replace(/\s+/g, '-')}`
                      : selectedDivision !== "all"
                        ? `playoff-${selectedDivision.toLowerCase()}`
                        : "playoff-schema"
                  }
                  calendarName={
                    selectedTeam !== "all"
                      ? `Play-Off - ${selectedTeam}`
                      : selectedDivision !== "all"
                        ? `Play-Off ${selectedDivision}`
                        : "Play-Off Speelschema"
                  }
                  competitionType="playoff"
                />
              </div>
            </FilterGroup>

            {/* Grouped Matches */}
            {groupedMatches.length > 0 ? (
              <Accordion 
                type="multiple" 
                value={openSpeeldagen}
                onValueChange={handleAccordionChange}
                className="space-y-3"
              >
                {groupedMatches.map(([speeldag, { matches, playoffType }]) => (
                  <MatchGroup 
                    key={speeldag}
                    speeldag={speeldag}
                    matches={matches}
                    playoffType={playoffType}
                  />
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--accent)' }}>
                Geen wedstrijden gevonden met de huidige filters
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <PlayoffRules />
    </div>
  );
};

export default PlayOffPage;
