import { supabase } from '@/integrations/supabase/client';

function getAdminUserId(): number {
  const authDataString = localStorage.getItem('auth_data');
  if (authDataString) {
    try {
      const authData = JSON.parse(authDataString);
      if (authData?.user?.isSuperAdmin) return -1;
      if (authData?.user?.id != null) return authData.user.id;
    } catch {
      // ignore
    }
  }

  const legacyUserString = localStorage.getItem('user');
  if (legacyUserString) {
    try {
      const user = JSON.parse(legacyUserString);
      if (user?.id != null) return user.id;
    } catch {
      // ignore
    }
  }

  throw new Error('Gebruiker niet gevonden');
}

export interface ArchivedStanding {
  position: number;
  team_name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface ArchivedCupWinner {
  winner: string;
  runner_up: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
}

export interface ArchivedPlayoffRanking {
  position: number;
  team_name: string;
  total_points?: number;
}

export interface ArchivedPlayoffFinal {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date?: string | null;
}

export interface ArchivedPlayoff {
  top_ranking: ArchivedPlayoffRanking[];
  bottom_ranking: ArchivedPlayoffRanking[];
  final?: ArchivedPlayoffFinal | null;
  notes?: string;
}

export interface SeasonArchive {
  id: string;
  season_label: string;
  competition_standings: ArchivedStanding[] | null;
  cup_winner: ArchivedCupWinner | null;
  playoff: ArchivedPlayoff | null;
  archived_at: string;
  updated_at: string;
}

/** Derive a season label like "2025-2026" from the current season config. */
export function deriveSeasonLabel(startDate?: string, endDate?: string): string {
  const start = startDate ? new Date(startDate) : new Date();
  const startY = start.getUTCFullYear();
  let endY = startY + 1;
  if (endDate) {
    const e = new Date(endDate);
    if (!isNaN(e.getTime())) endY = e.getUTCFullYear();
  }
  return `${startY}-${endY}`;
}

export const archiveService = {
  async listArchives(): Promise<SeasonArchive[]> {
    const { data, error } = await supabase
      .from('season_archives')
      .select('*')
      .order('season_label', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as SeasonArchive[];
  },

  async upsertCompetition(seasonLabel: string, standings: ArchivedStanding[]): Promise<void> {
    const { error } = await supabase.rpc('admin_upsert_season_competition', {
      p_admin_user_id: getAdminUserId(),
      p_season_label: seasonLabel,
      p_competition_standings: standings,
    });
    if (error) throw error;
  },

  async upsertCup(seasonLabel: string, cupWinner: ArchivedCupWinner): Promise<void> {
    const { error } = await supabase.rpc('admin_upsert_season_cup', {
      p_admin_user_id: getAdminUserId(),
      p_season_label: seasonLabel,
      p_cup_winner: cupWinner,
    });
    if (error) throw error;
  },

  async upsertPlayoff(seasonLabel: string, playoff: ArchivedPlayoff): Promise<void> {
    const { error } = await supabase.rpc('admin_upsert_season_playoff', {
      p_admin_user_id: getAdminUserId(),
      p_season_label: seasonLabel,
      p_playoff: playoff,
    });
    if (error) throw error;
  },

  /** Pull the current live standings and shape them for archiving. */
  async snapshotCurrentStandings(): Promise<ArchivedStanding[]> {
    const { data, error } = await supabase
      .from('competition_standings')
      .select(`
        team_id,
        matches_played,
        wins,
        draws,
        losses,
        goals_scored,
        goals_against,
        goal_difference,
        points,
        teams(team_name)
      `)
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any, idx: number) => ({
      position: idx + 1,
      team_name: row.teams?.team_name || 'Onbekend team',
      played: row.matches_played ?? 0,
      won: row.wins ?? 0,
      draw: row.draws ?? 0,
      lost: row.losses ?? 0,
      goals_for: row.goals_scored ?? 0,
      goals_against: row.goals_against ?? 0,
      goal_diff: row.goal_difference ?? 0,
      points: row.points ?? 0,
    }));
  },

  /** Auto-detect the cup final and shape it for archiving. */
  async snapshotCurrentCupFinal(): Promise<ArchivedCupWinner | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        home_score,
        away_score,
        match_date,
        teams_home:teams!home_team_id(team_name),
        teams_away:teams!away_team_id(team_name)
      `)
      .eq('is_cup_match', true)
      .eq('unique_number', 'FINAL')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const home = (data as any).teams_home?.team_name || 'Thuisploeg';
    const away = (data as any).teams_away?.team_name || 'Bezoekers';
    const hs = (data as any).home_score;
    const as = (data as any).away_score;
    let winner = home;
    let runner_up = away;
    let winnerScore = hs;
    let runnerScore = as;
    if (typeof hs === 'number' && typeof as === 'number' && as > hs) {
      winner = away;
      runner_up = home;
      winnerScore = as;
      runnerScore = hs;
    }
    return {
      winner,
      runner_up,
      home_score: typeof winnerScore === 'number' ? winnerScore : null,
      away_score: typeof runnerScore === 'number' ? runnerScore : null,
      match_date: (data as any).match_date ?? null,
    };
  },

  /** Snapshot playoff rankings using the same logic as the public /playoff page. */
  async snapshotCurrentPlayoff(): Promise<ArchivedPlayoff> {
    const { fetchPublicPlayoffData } = await import('@/hooks/usePublicPlayoffData');
    const data = await fetchPublicPlayoffData();

    const top_ranking = data.po1Teams.map((team, idx) => ({
      position: idx + 1,
      team_name: team.team_name,
      total_points: team.total_points,
    }));

    const bottom_ranking = data.po2Teams.map((team, idx) => ({
      position: idx + 1,
      team_name: team.team_name,
      total_points: team.total_points,
    }));

    let final: ArchivedPlayoffFinal | null = null;
    const leader = data.po1Teams[0];
    const runnerUp = data.po1Teams[1];

    if (leader && runnerUp) {
      const headToHead = data.allMatches.find(
        (m) =>
          m.is_completed &&
          m.playoff_type === 'top' &&
          ((m.home_team_id === leader.team_id && m.away_team_id === runnerUp.team_id) ||
            (m.home_team_id === runnerUp.team_id && m.away_team_id === leader.team_id)),
      );

      final = {
        home_team: headToHead?.home_team_name ?? leader.team_name,
        away_team: headToHead?.away_team_name ?? runnerUp.team_name,
        home_score: headToHead?.home_score ?? null,
        away_score: headToHead?.away_score ?? null,
        match_date: headToHead?.match_date ?? null,
      };
    }

    return { top_ranking, bottom_ranking, final };
  },
};
