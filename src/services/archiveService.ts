import { supabase } from '@/integrations/supabase/client';

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

export interface SeasonArchive {
  id: string;
  season_label: string;
  competition_standings: ArchivedStanding[] | null;
  cup_winner: ArchivedCupWinner | null;
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
    // Read existing to preserve cup_winner if any
    const { data: existing } = await supabase
      .from('season_archives')
      .select('cup_winner')
      .eq('season_label', seasonLabel)
      .maybeSingle();
    const cupWinner = (existing as any)?.cup_winner ?? null;

    const { error } = await supabase
      .from('season_archives')
      .upsert(
        {
          season_label: seasonLabel,
          competition_standings: standings as any,
          cup_winner: cupWinner,
        },
        { onConflict: 'season_label' }
      );
    if (error) throw error;
  },

  async upsertCup(seasonLabel: string, cupWinner: ArchivedCupWinner): Promise<void> {
    const { data: existing } = await supabase
      .from('season_archives')
      .select('competition_standings')
      .eq('season_label', seasonLabel)
      .maybeSingle();
    const standings = (existing as any)?.competition_standings ?? null;

    const { error } = await supabase
      .from('season_archives')
      .upsert(
        {
          season_label: seasonLabel,
          competition_standings: standings,
          cup_winner: cupWinner as any,
        },
        { onConflict: 'season_label' }
      );
    if (error) throw error;
  },

  async deleteArchive(seasonLabel: string): Promise<void> {
    const { error } = await supabase
      .from('season_archives')
      .delete()
      .eq('season_label', seasonLabel);
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
};
