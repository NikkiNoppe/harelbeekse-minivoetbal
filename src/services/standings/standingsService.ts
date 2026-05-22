import { supabase } from '@/integrations/supabase/client';

export interface MatchRow {
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  is_submitted: boolean | null;
  match_date?: string | null;
  is_playoff?: boolean;
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsAgainst: number;
  points: number;
}

export interface SortableTeam {
  team_id: number;
  team_name: string;
  points: number;
  wins: number;
  goal_diff: number;
  goals_scored: number;
}

export interface RegularStanding {
  team_id: number;
  team_name: string;
  position: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

const emptyStats = (): TeamStats => ({
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsScored: 0,
  goalsAgainst: 0,
  points: 0,
});

/** Tel statistieken op uit een set wedstrijden, alleen voor de meegegeven team-ids. */
export const computeStats = (
  matches: MatchRow[],
  teamIds: Set<number>,
): Map<number, TeamStats> => {
  const stats = new Map<number, TeamStats>();
  teamIds.forEach((id) => stats.set(id, emptyStats()));

  matches
    .filter(
      (m) =>
        m.is_submitted &&
        m.home_score !== null &&
        m.away_score !== null &&
        m.home_team_id !== null &&
        m.away_team_id !== null &&
        teamIds.has(m.home_team_id) &&
        teamIds.has(m.away_team_id),
    )
    .forEach((m) => {
      const home = stats.get(m.home_team_id!)!;
      const away = stats.get(m.away_team_id!)!;
      const hs = m.home_score as number;
      const as = m.away_score as number;

      home.played++;
      away.played++;
      home.goalsScored += hs;
      home.goalsAgainst += as;
      away.goalsScored += as;
      away.goalsAgainst += hs;

      if (hs > as) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (hs < as) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    });

  return stats;
};

/**
 * Sorteer teams volgens officieel reglement.
 * Bij gelijke punten: wins → onderlinge mini-stand → onderling saldo → algemeen saldo → goals → alfabetisch.
 */
export const sortWithTiebreakers = <T extends SortableTeam>(
  teams: T[],
  allMatchesForHeadToHead: MatchRow[],
): T[] => {
  const sorted = [...teams].sort(
    (a, b) => b.points - a.points || b.wins - a.wins,
  );

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
      const groupIds = new Set(group.map((t) => t.team_id));
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

export async function fetchRegularMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score, is_submitted, match_date')
    .eq('is_cup_match', false)
    .eq('is_playoff_match', false);
  if (error) throw error;
  return ((data || []) as MatchRow[]).map((m) => ({ ...m, is_playoff: false }));
}

export async function fetchTeams(): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, team_name');
  if (error) throw error;
  const map = new Map<number, string>();
  (data || []).forEach((t) => map.set(t.team_id, t.team_name));
  return map;
}

function hasSubmittedRegularMatches(matches: MatchRow[]): boolean {
  return matches.some(
    (m) =>
      m.is_submitted &&
      m.home_score !== null &&
      m.away_score !== null &&
      m.home_team_id !== null &&
      m.away_team_id !== null,
  );
}

/** Bereken reguliere competitiestand live uit matches (bron van waarheid). */
export async function fetchRegularStandings(): Promise<RegularStanding[]> {
  const [regularMatches, teamMap] = await Promise.all([
    fetchRegularMatches(),
    fetchTeams(),
  ]);

  if (!hasSubmittedRegularMatches(regularMatches)) {
    return [];
  }

  const allTeamIds = new Set(teamMap.keys());
  const regularStats = computeStats(regularMatches, allTeamIds);
  const sortable: SortableTeam[] = Array.from(allTeamIds).map((id) => {
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

  const sorted = sortWithTiebreakers(sortable, regularMatches);
  return sorted.map((t, idx) => {
    const s = regularStats.get(t.team_id)!;
    return {
      team_id: t.team_id,
      team_name: t.team_name,
      position: idx + 1,
      played: s.played,
      won: s.wins,
      draw: s.draws,
      lost: s.losses,
      goals_for: s.goalsScored,
      goals_against: s.goalsAgainst,
      goal_diff: s.goalsScored - s.goalsAgainst,
      points: s.points,
    };
  });
}
