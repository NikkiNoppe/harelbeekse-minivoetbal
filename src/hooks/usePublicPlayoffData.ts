import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayoffTeam {
  team_id: number;
  team_name: string;
  regular_points: number;
  playoff_points: number;
  total_points: number;
  playoff_played: number;
  playoff_wins: number;
  playoff_draws: number;
  playoff_losses: number;
  playoff_goal_diff: number;
  playoff_goals_scored: number;
  playoff_goals_against: number;
  /** Totale wins (regulier + playoff), gebruikt voor tiebreakers. */
  total_wins: number;
  /** Totaal doelsaldo (regulier + playoff). */
  total_goal_diff: number;
  /** Totaal gemaakte doelpunten (regulier + playoff). */
  total_goals_scored: number;
  original_position: number;
  playoff_type: 'top' | 'bottom';
}

export interface PlayoffMatchData {
  match_id: number;
  speeldag: string;
  match_date: string;
  time: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_name: string;
  away_team_name: string;
  home_position: number | null;
  away_position: number | null;
  home_score: number | null;
  away_score: number | null;
  location: string;
  playoff_type: 'top' | 'bottom';
  is_completed: boolean;
  is_finalized: boolean;
}

interface MatchRow {
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  is_submitted: boolean | null;
  match_date?: string | null;
  is_playoff?: boolean;
}

/** Eén onderlinge wedstrijd, zoals aan de UI doorgegeven. */
export interface HeadToHeadMatch {
  match_date: string | null;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  is_playoff: boolean;
}

interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsAgainst: number;
  points: number;
}

const emptyStats = (): TeamStats => ({
  played: 0, wins: 0, draws: 0, losses: 0,
  goalsScored: 0, goalsAgainst: 0, points: 0,
});

/** Tel statistieken op uit een set wedstrijden, alleen voor de meegegeven team-ids. */
const computeStats = (matches: MatchRow[], teamIds: Set<number>): Map<number, TeamStats> => {
  const stats = new Map<number, TeamStats>();
  teamIds.forEach(id => stats.set(id, emptyStats()));

  matches
    .filter(m =>
      m.is_submitted &&
      m.home_score !== null && m.away_score !== null &&
      m.home_team_id !== null && m.away_team_id !== null &&
      teamIds.has(m.home_team_id) && teamIds.has(m.away_team_id)
    )
    .forEach(m => {
      const home = stats.get(m.home_team_id!)!;
      const away = stats.get(m.away_team_id!)!;
      const hs = m.home_score as number;
      const as = m.away_score as number;

      home.played++; away.played++;
      home.goalsScored += hs; home.goalsAgainst += as;
      away.goalsScored += as; away.goalsAgainst += hs;

      if (hs > as) { home.wins++; home.points += 3; away.losses++; }
      else if (hs < as) { away.wins++; away.points += 3; home.losses++; }
      else { home.draws++; away.draws++; home.points++; away.points++; }
    });

  return stats;
};

/**
 * Sorteer teams volgens officieel reglement.
 * Bij gelijke punten:
 *   1. aantal gewonnen wedstrijden
 *   2. punten in onderlinge wedstrijden (mini-stand binnen tied groep)
 *   3. doelsaldo in onderlinge wedstrijden
 *   4. algemeen doelsaldo
 *   5. totaal gemaakte doelpunten
 *   6. fallback alfabetisch (testmatch/loting blijft handmatig)
 */
interface SortableTeam {
  team_id: number;
  team_name: string;
  points: number;
  wins: number;
  goal_diff: number;
  goals_scored: number;
}

const sortWithTiebreakers = <T extends SortableTeam>(
  teams: T[],
  allMatchesForHeadToHead: MatchRow[],
): T[] => {
  // Groepeer op punten → wins
  const sorted = [...teams].sort((a, b) =>
    b.points - a.points || b.wins - a.wins
  );

  // Identificeer groepen met gelijke (points, wins) en breek met head-to-head + rest
  const result: T[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j + 1 < sorted.length &&
      sorted[j + 1].points === sorted[i].points &&
      sorted[j + 1].wins === sorted[i].wins
    ) {
      j++;
    }
    if (j === i) {
      result.push(sorted[i]);
    } else {
      const group = sorted.slice(i, j + 1);
      const groupIds = new Set(group.map(t => t.team_id));
      const h2h = computeStats(allMatchesForHeadToHead, groupIds);

      const broken = group.sort((a, b) => {
        const ah = h2h.get(a.team_id)!;
        const bh = h2h.get(b.team_id)!;
        const ahDiff = ah.goalsScored - ah.goalsAgainst;
        const bhDiff = bh.goalsScored - bh.goalsAgainst;
        return (
          bh.points - ah.points ||
          bhDiff - ahDiff ||
          b.goal_diff - a.goal_diff ||
          b.goals_scored - a.goals_scored ||
          a.team_name.localeCompare(b.team_name)
        );
      });
      result.push(...broken);
    }
    i = j + 1;
  }
  return result;
};

const fetchRegularMatches = async (): Promise<MatchRow[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score, is_submitted, match_date')
    .eq('is_cup_match', false)
    .eq('is_playoff_match', false);
  if (error) throw error;
  return ((data || []) as MatchRow[]).map(m => ({ ...m, is_playoff: false }));
};

const fetchPlayoffMatches = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      match_id,
      speeldag,
      match_date,
      home_team_id,
      away_team_id,
      home_position,
      away_position,
      home_score,
      away_score,
      location,
      playoff_type,
      is_submitted,
      is_playoff_finalized
    `)
    .eq('is_playoff_match', true)
    .order('match_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

const fetchTeams = async (): Promise<Map<number, string>> => {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, team_name');

  if (error) throw error;
  const map = new Map<number, string>();
  (data || []).forEach(t => map.set(t.team_id, t.team_name));
  return map;
};

export const usePublicPlayoffData = () => {
  return useQuery({
    queryKey: ['publicPlayoffData'],
    queryFn: async () => {
      const [regularMatches, playoffMatchesRaw, teamMap] = await Promise.all([
        fetchRegularMatches(),
        fetchPlayoffMatches(),
        fetchTeams(),
      ]);

      const allTeamIds = new Set(teamMap.keys());

      // 1) Reguliere stand opnieuw berekenen uit wedstrijden, met tiebreakers
      const regularStats = computeStats(regularMatches, allTeamIds);
      const regularSortable: (SortableTeam & { team_name: string })[] =
        Array.from(allTeamIds).map(id => {
          const s = regularStats.get(id)!;
          return {
            team_id: id,
            team_name: teamMap.get(id) || 'Onbekend',
            points: s.points,
            wins: s.wins,
            goal_diff: s.goalsScored - s.goalsAgainst,
            goals_scored: s.goalsScored,
          };
        });
      const regularSorted = sortWithTiebreakers(regularSortable, regularMatches);
      const regularStandings = regularSorted.map((t, idx) => ({
        team_id: t.team_id,
        team_name: t.team_name,
        points: t.points,
        position: idx + 1,
      }));

      // Split teams into PO1 (top 8) en PO2 (rest)
      const po1RegularTeams = regularStandings.slice(0, 8);
      const po2RegularTeams = regularStandings.slice(8, 15);

      // 2) Playoff-stats (alleen playoff-wedstrijden) voor weergave-kolommen
      const playoffStats = computeStats(
        playoffMatchesRaw as MatchRow[],
        allTeamIds,
      );

      // 3) Gecombineerde stats (regulier + playoff) voor sortering
      const combinedStats = new Map<number, TeamStats>();
      allTeamIds.forEach(id => {
        const r = regularStats.get(id)!;
        const p = playoffStats.get(id)!;
        combinedStats.set(id, {
          played: r.played + p.played,
          wins: r.wins + p.wins,
          draws: r.draws + p.draws,
          losses: r.losses + p.losses,
          goalsScored: r.goalsScored + p.goalsScored,
          goalsAgainst: r.goalsAgainst + p.goalsAgainst,
          points: r.points + p.points,
        });
      });

      // Alle wedstrijden samen voor head-to-head berekening
      const allMatchesForH2H: MatchRow[] = [
        ...regularMatches,
        ...(playoffMatchesRaw as MatchRow[]),
      ];

      const buildPlayoffTeams = (
        regularTeams: typeof regularStandings,
        type: 'top' | 'bottom',
      ): PlayoffTeam[] => {
        const teams: PlayoffTeam[] = regularTeams.map(team => {
          const p = playoffStats.get(team.team_id)!;
          const c = combinedStats.get(team.team_id)!;
          return {
            team_id: team.team_id,
            team_name: team.team_name,
            regular_points: team.points,
            playoff_points: p.points,
            total_points: team.points + p.points,
            playoff_played: p.played,
            playoff_wins: p.wins,
            playoff_draws: p.draws,
            playoff_losses: p.losses,
            playoff_goal_diff: p.goalsScored - p.goalsAgainst,
            playoff_goals_scored: p.goalsScored,
            playoff_goals_against: p.goalsAgainst,
            total_wins: c.wins,
            total_goal_diff: c.goalsScored - c.goalsAgainst,
            total_goals_scored: c.goalsScored,
            original_position: team.position,
            playoff_type: type,
          };
        });

        // Sorteer met volledige tiebreaker-hiërarchie op gecombineerde stats
        const sortable: SortableTeam[] = teams.map(t => ({
          team_id: t.team_id,
          team_name: t.team_name,
          points: t.total_points,
          wins: t.total_wins,
          goal_diff: t.total_goal_diff,
          goals_scored: t.total_goals_scored,
        }));
        const sorted = sortWithTiebreakers(sortable, allMatchesForH2H);
        const orderMap = new Map(sorted.map((t, i) => [t.team_id, i]));
        return teams.sort(
          (a, b) => (orderMap.get(a.team_id)! - orderMap.get(b.team_id)!),
        );
      };

      const po1Teams = buildPlayoffTeams(po1RegularTeams, 'top');
      const po2Teams = buildPlayoffTeams(po2RegularTeams, 'bottom');

      // Helper to get team name with fallback to position
      const getTeamName = (teamId: number | null, position: number | null): string => {
        if (teamId && teamMap.has(teamId)) {
          return teamMap.get(teamId)!;
        }
        if (position) {
          return `Team pos. ${position}`;
        }
        return 'Onbekend';
      };

      const isFinalized = playoffMatchesRaw.some(m => m.is_playoff_finalized === true);

      const playoffMatches: PlayoffMatchData[] = playoffMatchesRaw.map(match => {
        const matchDate = new Date(match.match_date);
        // Gebruik UTC om vaste tijden te behouden (19:00 = altijd 19:00, geen winter/zomeruur verschuiving)
        const time = `${String(matchDate.getUTCHours()).padStart(2, '0')}:${String(matchDate.getUTCMinutes()).padStart(2, '0')}`;

        return {
          match_id: match.match_id,
          speeldag: match.speeldag || '',
          match_date: match.match_date,
          time,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          home_team_name: getTeamName(match.home_team_id, match.home_position),
          away_team_name: getTeamName(match.away_team_id, match.away_position),
          home_position: match.home_position,
          away_position: match.away_position,
          home_score: match.home_score,
          away_score: match.away_score,
          location: match.location || '',
          playoff_type: match.playoff_type === 'top' ? 'top' : 'bottom',
          is_completed: match.is_submitted && match.home_score !== null && match.away_score !== null,
          is_finalized: match.is_playoff_finalized ?? false,
        };
      });

      const now = new Date();
      const upcomingMatches = playoffMatches.filter(m => !m.is_completed && new Date(m.match_date) >= now);
      const pastMatches = playoffMatches.filter(m => m.is_completed);

      // Bouw lijst van alle submitted onderlinge wedstrijden (regulier + playoff)
      // voor weergave in de tiebreaker-notice
      const headToHeadMatches: HeadToHeadMatch[] = allMatchesForH2H
        .filter(m =>
          m.is_submitted &&
          m.home_team_id !== null && m.away_team_id !== null &&
          m.home_score !== null && m.away_score !== null
        )
        .map(m => ({
          match_date: m.match_date ?? null,
          home_team_id: m.home_team_id as number,
          away_team_id: m.away_team_id as number,
          home_team_name: teamMap.get(m.home_team_id as number) || 'Onbekend',
          away_team_name: teamMap.get(m.away_team_id as number) || 'Onbekend',
          home_score: m.home_score as number,
          away_score: m.away_score as number,
          is_playoff: !!m.is_playoff,
        }));

      return {
        po1Teams,
        po2Teams,
        allMatches: playoffMatches,
        upcomingMatches,
        pastMatches,
        headToHeadMatches,
        hasData: regularStandings.length > 0,
        isFinalized,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
