import { supabase } from '@/integrations/supabase/client';
import { fetchPublicApplicationSettings } from '@/services/public/publicApplicationSettingsFetch';

const ARCHIVE_CATEGORY = 'season_archives';

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

async function upsertArchiveField(
  seasonLabel: string,
  field: 'competition_standings' | 'cup_winner' | 'playoff',
  value: unknown,
): Promise<void> {
  const { data, error } = await supabase.rpc('upsert_season_archive', {
    p_user_id: getAdminUserId(),
    p_season_label: seasonLabel,
    p_field: field,
    p_value: value as any,
  });
  if (error) throw error;
  const result = data as { success?: boolean; error?: string } | null;
  if (result && result.success === false) {
    throw new Error(result.error || 'Archiveren mislukt');
  }
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

export interface ArchivedPlayoff {
  top_ranking: ArchivedPlayoffRanking[];
  bottom_ranking: ArchivedPlayoffRanking[];
  notes?: string;
}

export interface SeasonArchive {
  id: number;
  season_label: string;
  competition_standings: ArchivedStanding[] | null;
  cup_winner: ArchivedCupWinner | null;
  playoff: ArchivedPlayoff | null;
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

function mapArchiveRow(row: {
  id: number;
  setting_name: string;
  setting_value: unknown;
}): SeasonArchive {
  const value = (typeof row.setting_value === 'object' && row.setting_value !== null
    ? row.setting_value
    : {}) as Record<string, unknown>;

  return {
    id: row.id,
    season_label: row.setting_name,
    competition_standings: (value.competition_standings as ArchivedStanding[] | undefined) ?? null,
    cup_winner: (value.cup_winner as ArchivedCupWinner | undefined) ?? null,
    playoff: (value.playoff as ArchivedPlayoff | undefined) ?? null,
  };
}

export const archiveService = {
  async listArchives(): Promise<SeasonArchive[]> {
    const rows = await fetchPublicApplicationSettings([ARCHIVE_CATEGORY]);
    return rows
      .map((row) =>
        mapArchiveRow({
          id: row.id,
          setting_name: row.setting_name,
          setting_value: row.setting_value,
        }),
      )
      .sort((a, b) => a.season_label.localeCompare(b.season_label));
  },

  async upsertCompetition(seasonLabel: string, standings: ArchivedStanding[]): Promise<void> {
    await upsertArchiveField(seasonLabel, 'competition_standings', standings);
  },

  async upsertCup(seasonLabel: string, cupWinner: ArchivedCupWinner): Promise<void> {
    await upsertArchiveField(seasonLabel, 'cup_winner', cupWinner);
  },

  async upsertPlayoff(seasonLabel: string, playoff: ArchivedPlayoff): Promise<void> {
    await upsertArchiveField(seasonLabel, 'playoff', playoff);
  },

  /** Pull the current live standings and shape them for archiving. */
  async snapshotCurrentStandings(): Promise<ArchivedStanding[]> {
    const { fetchRegularStandings } = await import('@/services/standings/standingsService');
    const standings = await fetchRegularStandings();
    return standings.map((s) => ({
      position: s.position,
      team_name: s.team_name,
      played: s.played,
      won: s.won,
      draw: s.draw,
      lost: s.lost,
      goals_for: s.goals_for,
      goals_against: s.goals_against,
      goal_diff: s.goal_diff,
      points: s.points,
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

    return {
      top_ranking: data.po1Teams.map((team, idx) => ({
        position: idx + 1,
        team_name: team.team_name,
        total_points: team.total_points,
      })),
      bottom_ranking: data.po2Teams.map((team, idx) => ({
        position: idx + 1,
        team_name: team.team_name,
        total_points: team.total_points,
      })),
    };
  },
};
