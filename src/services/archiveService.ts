import { supabase } from '@/integrations/supabase/client';
import { getRpcSessionArgs } from '@/lib/authSession';
import { DEFAULT_ORGANIZATION_ID } from '@/config/organization';
import { fetchPublicApplicationSettings } from '@/services/public/publicApplicationSettingsFetch';
import { fetchPublicMatches, type PublicMatchRow } from '@/services/public/publicScheduleFetch';
import { deleteApplicationSettingForSession } from '@/services/core/applicationSettingsSessionFetch';

const ARCHIVE_CATEGORY = 'season_archives';

async function upsertArchiveField(
  seasonLabel: string,
  field: 'competition_standings' | 'cup_winner' | 'playoff',
  value: unknown,
): Promise<void> {
  const { data, error } = await supabase.rpc('upsert_season_archive_for_session', {
    ...getRpcSessionArgs(),
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
  /** Optioneel: reeksnaam (Eerste klasse, …). Null = één gezamenlijk klassement. */
  division?: string | null;
}

export interface ArchivedCupRound {
  label: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  winner?: string | null;
}

export interface ArchivedCupWinner {
  winner: string;
  runner_up: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
  /** Wedstrijdgegevens finale — optioneel voor oudere archieven */
  final?: ArchivedCupRound;
  /** Halve finales — optioneel voor oudere archieven */
  semi_finals?: ArchivedCupRound[];
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

function shapeArchivedCupRound(
  match: PublicMatchRow,
  label: string,
): ArchivedCupRound {
  const home = match.home_team_name || 'Thuisploeg';
  const away = match.away_team_name || 'Bezoekers';
  const hs = match.home_score;
  const as = match.away_score;
  let winner: string | null = null;
  if (typeof hs === 'number' && typeof as === 'number') {
    if (hs > as) winner = home;
    else if (as > hs) winner = away;
  }
  return {
    label,
    home_team: home,
    away_team: away,
    home_score: typeof hs === 'number' ? hs : null,
    away_score: typeof as === 'number' ? as : null,
    winner,
  };
}

function enrichCupRoundScores(
  round: ArchivedCupRound,
  cup: ArchivedCupWinner,
  isFinal = false,
): ArchivedCupRound {
  if (round.home_score !== null && round.away_score !== null) {
    return round;
  }

  if (!isFinal) {
    return round;
  }

  const winnerScore = cup.home_score;
  const runnerScore = cup.away_score;
  if (winnerScore === null || runnerScore === null || !cup.winner) {
    return round;
  }

  if (round.home_team === cup.winner) {
    return {
      ...round,
      home_score: winnerScore,
      away_score: runnerScore,
      winner: cup.winner,
    };
  }

  if (round.away_team === cup.winner) {
    return {
      ...round,
      home_score: runnerScore,
      away_score: winnerScore,
      winner: cup.winner,
    };
  }

  return round;
}

function normalizeRoundLabel(label: string): string {
  return label.replace(/^[\s🏆🥇]+/u, "").trim();
}

/** Halve finales + finale voor archiefweergave; vult legacy cup_winner aan waar nodig. */
export function resolveCupArchiveRounds(cup: ArchivedCupWinner | null): {
  semiFinals: ArchivedCupRound[];
  final: ArchivedCupRound | null;
} {
  if (!cup) {
    return { semiFinals: [], final: null };
  }

  const semiFinals = (cup.semi_finals ?? []).map((round) => ({
    ...round,
    label: normalizeRoundLabel(round.label),
  }));

  if (cup.final) {
    return {
      semiFinals,
      final: enrichCupRoundScores(
        {
          ...cup.final,
          label: normalizeRoundLabel(cup.final.label || "Bekerfinale"),
        },
        cup,
        true,
      ),
    };
  }

  if (cup.winner && cup.runner_up) {
    return {
      semiFinals,
      final: enrichCupRoundScores(
        {
          label: "Bekerfinale",
          home_team: cup.winner,
          away_team: cup.runner_up,
          home_score: cup.home_score,
          away_score: cup.away_score,
          winner: cup.winner,
        },
        cup,
        true,
      ),
    };
  }

  return { semiFinals, final: null };
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
  async listArchives(organizationId?: number): Promise<SeasonArchive[]> {
    const rows = await fetchPublicApplicationSettings([ARCHIVE_CATEGORY], organizationId);
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

  /** Verwijder een volledig seizoenarchief (application_settings-rij). */
  async deleteArchive(archiveId: number): Promise<void> {
    await deleteApplicationSettingForSession(archiveId, ARCHIVE_CATEGORY);
  },

  /** Pull the current live standings and shape them for archiving. */
  async snapshotCurrentStandings(organizationId?: number): Promise<ArchivedStanding[]> {
    const { fetchRegularStandings } = await import('@/services/standings/standingsService');
    const standings = await fetchRegularStandings(organizationId);
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

  /** Auto-detect the cup final (and halve finales) and shape them for archiving. */
  async snapshotCurrentCupFinal(organizationId?: number): Promise<ArchivedCupWinner | null> {
    const matches = await fetchPublicMatches(organizationId);
    const cupMatches = matches.filter((m) => m.is_cup_match);
    const data = cupMatches.find((m) => m.unique_number === 'FINAL');
    if (!data) return null;

    const home = data.home_team_name || 'Thuisploeg';
    const away = data.away_team_name || 'Bezoekers';
    const hs = data.home_score;
    const as = data.away_score;
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

    const semiFinals = cupMatches
      .filter((m) => m.unique_number?.startsWith('SF-'))
      .sort((a, b) =>
        (a.unique_number ?? '').localeCompare(b.unique_number ?? '', undefined, {
          numeric: true,
        }),
      )
      .map((m, idx) =>
        shapeArchivedCupRound(m, m.speeldag || `Halve finale ${idx + 1}`),
      );

    const finalRound = shapeArchivedCupRound(data, 'Bekerfinale');
    finalRound.winner = winner;

    return {
      winner,
      runner_up,
      home_score: typeof winnerScore === 'number' ? winnerScore : null,
      away_score: typeof runnerScore === 'number' ? runnerScore : null,
      match_date: data.match_date ?? null,
      final: finalRound,
      semi_finals: semiFinals.length > 0 ? semiFinals : undefined,
    };
  },

  /** Snapshot playoff rankings using the same logic as the public /playoff page. */
  async snapshotCurrentPlayoff(organizationId?: number): Promise<ArchivedPlayoff> {
    const { fetchPublicPlayoffData } = await import('@/hooks/usePublicPlayoffData');
    const data = await fetchPublicPlayoffData(organizationId ?? DEFAULT_ORGANIZATION_ID);

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
