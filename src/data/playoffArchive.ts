/**
 * Hardcoded archief van playoff-eindstanden per seizoen.
 *
 * Bewust NIET in Supabase: playoff-uitslagen zijn klein, statisch en
 * blijven historisch bewaard in de code-base. Een beheerder kan in de
 * Admin > Playoffs pagina een snapshot genereren en het resultaat
 * hieronder onder `PLAYOFF_ARCHIVE` plakken.
 *
 * Voorbeeld:
 *   {
 *     season_label: '2024-2025',
 *     top_ranking: [
 *       { position: 1, team_name: 'Garage Verbeke' },
 *       { position: 2, team_name: 'Cafe De Gilde' },
 *     ],
 *     bottom_ranking: [
 *       { position: 9, team_name: 'De Florre' },
 *     ],
 *     final: {
 *       home_team: 'Garage Verbeke',
 *       away_team: 'Cafe De Gilde',
 *       home_score: 4,
 *       away_score: 1,
 *       match_date: '2025-06-15',
 *     },
 *   }
 */

export interface PlayoffArchiveRanking {
  position: number;
  team_name: string;
  /** Optioneel: totaal aantal punten na playoffs */
  total_points?: number;
}

export interface PlayoffArchiveFinal {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date?: string | null;
}

export interface PlayoffArchiveEntry {
  season_label: string;
  top_ranking: PlayoffArchiveRanking[];
  bottom_ranking: PlayoffArchiveRanking[];
  final?: PlayoffArchiveFinal | null;
  notes?: string;
}

export const PLAYOFF_ARCHIVE: PlayoffArchiveEntry[] = [
  // Voeg hier seizoenen toe via de snapshot-knop in Admin > Playoffs.
];

export const getPlayoffArchiveFor = (
  seasonLabel: string | null | undefined,
): PlayoffArchiveEntry | null => {
  if (!seasonLabel) return null;
  return PLAYOFF_ARCHIVE.find((e) => e.season_label === seasonLabel) ?? null;
};

export const getAllPlayoffArchiveSeasons = (): string[] =>
  PLAYOFF_ARCHIVE.map((e) => e.season_label);
