import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { archiveService, deriveSeasonLabel } from "@/services/archiveService";
import { seasonService } from "@/services/seasonService";

export const DEFAULT_CLOSE_SEASON_LABEL = "2025-2026";
export const DEFAULT_CLOSE_CUTOFF_DATE = "2026-07-01";
export const DEFAULT_TARGET_CAPITAL = 600;

export const CLOSE_SEASON_HINT =
  "Sluit eerst het seizoen af via SuperAdmin → Platform → Seizoen afsluiten.";

export type CloseSeasonPreview = {
  success: boolean;
  error?: string;
  matches_to_tag?: number;
  costs_to_tag?: number;
  matches_remaining_after_cutoff?: number;
  costs_remaining_after_cutoff?: number;
  sample_balances?: Array<{ team_name: string; balance: number }>;
};

export type CloseSeasonResult = {
  success: boolean;
  error?: string;
  season_label?: string;
  cutoff_date?: string;
  matches_tagged?: number;
  costs_tagged?: number;
  yellow_reset?: number;
  red_reset?: number;
  red_kept?: number;
  full_export?: unknown;
  download_filename?: string;
};

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type SaveSeasonArchiveResult = {
  /** Browserdownload altijd gestart */
  downloaded: true;
  /** Geschreven naar projectmap archief/ via Vite-dev endpoint */
  savedToDisk: boolean;
  relativePath?: string;
};

/**
 * Download JSON én (bij lokale `npm run dev`) schrijf naar `/archief/`.
 * Op productie werkt alleen de download.
 */
export async function saveSeasonArchiveJson(
  filename: string,
  data: unknown,
): Promise<SaveSeasonArchiveResult> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  downloadJsonFile(safeName, data);

  try {
    const res = await fetch("/__dev/save-season-archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: safeName, data }),
    });
    if (!res.ok) {
      return { downloaded: true, savedToDisk: false };
    }
    const json = (await res.json()) as {
      success?: boolean;
      path?: string;
    };
    if (json.success && json.path) {
      return {
        downloaded: true,
        savedToDisk: true,
        relativePath: json.path,
      };
    }
  } catch {
    // Geen lokale Vite-server (bv. productie) — alleen download
  }

  return { downloaded: true, savedToDisk: false };
}

/** Defaults uit seizoensconfig; valt terug op vaste Harelbeke-waarden. */
export async function resolveCloseSeasonDefaults(organizationId?: number): Promise<{
  seasonLabel: string;
  cutoffDate: string;
}> {
  try {
    const season = await seasonService.getSeasonData(organizationId);
    const label = deriveSeasonLabel(season.season_start_date, season.season_end_date);
    let cutoffDate = DEFAULT_CLOSE_CUTOFF_DATE;
    const end = season.season_end_date?.slice(0, 10);
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
      // Soft-close gebruikt match_date < cutoff → dag ná seizoenseinde
      const d = new Date(`${end}T12:00:00`);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      cutoffDate = `${y}-${m}-${day}`;
    }
    return {
      seasonLabel: label || DEFAULT_CLOSE_SEASON_LABEL,
      cutoffDate,
    };
  } catch {
    return {
      seasonLabel: DEFAULT_CLOSE_SEASON_LABEL,
      cutoffDate: DEFAULT_CLOSE_CUTOFF_DATE,
    };
  }
}

/**
 * Snapshot klassement/beker/playoff naar season_archives vóór soft-close,
 * zodat close kan mergen en de JSON-export die velden bevat.
 */
export async function snapshotPublicArchivesBeforeClose(
  seasonLabel: string,
  organizationId?: number,
): Promise<{ standings: number; cup: boolean; playoff: boolean }> {
  let standings = 0;
  let cup = false;
  let playoff = false;

  try {
    const snap = await archiveService.snapshotCurrentStandings(organizationId);
    if (snap.length > 0) {
      await archiveService.upsertCompetition(seasonLabel, snap);
      standings = snap.length;
    }
  } catch {
    // Klassement optioneel — close mag doorgaan
  }

  try {
    const cupSnap = await archiveService.snapshotCurrentCupFinal(organizationId);
    if (cupSnap) {
      await archiveService.upsertCup(seasonLabel, cupSnap);
      cup = true;
    }
  } catch {
    // Beker optioneel
  }

  try {
    const poSnap = await archiveService.snapshotCurrentPlayoff(organizationId);
    if (
      (poSnap.top_ranking?.length ?? 0) > 0 ||
      (poSnap.bottom_ranking?.length ?? 0) > 0
    ) {
      await archiveService.upsertPlayoff(seasonLabel, poSnap);
      playoff = true;
    }
  } catch {
    // Playoff optioneel
  }

  return { standings, cup, playoff };
}

export async function previewCloseSeason(
  cutoffDate: string = DEFAULT_CLOSE_CUTOFF_DATE,
): Promise<CloseSeasonPreview> {
  const { data, error } = await supabase.rpc("preview_close_season_for_session", {
    ...getRpcSessionArgs(),
    p_cutoff_date: cutoffDate,
  });
  if (error) throw error;
  return (data ?? { success: false, error: "Geen antwoord" }) as CloseSeasonPreview;
}

export async function closeSeason(options?: {
  seasonLabel?: string;
  cutoffDate?: string;
  targetCapital?: number;
}): Promise<CloseSeasonResult> {
  const { data, error } = await supabase.rpc("close_season_for_session", {
    ...getRpcSessionArgs(),
    p_season_label: options?.seasonLabel ?? DEFAULT_CLOSE_SEASON_LABEL,
    p_cutoff_date: options?.cutoffDate ?? DEFAULT_CLOSE_CUTOFF_DATE,
    p_target_capital: options?.targetCapital ?? DEFAULT_TARGET_CAPITAL,
  });
  if (error) throw error;
  return (data ?? { success: false, error: "Geen antwoord" }) as CloseSeasonResult;
}

export type SeasonBackupResult = {
  success: boolean;
  error?: string;
  season_label?: string;
  backup_name?: string;
  match_count?: number;
  cost_count?: number;
  full_export?: unknown;
  download_filename?: string;
  exported_at?: string;
};

/** Tussentijdse JSON-backup: bewaart snapshot, sluit seizoen niet af. */
export async function exportSeasonBackup(options?: {
  seasonLabel?: string;
  targetCapital?: number;
}): Promise<SeasonBackupResult> {
  const { data, error } = await supabase.rpc("export_season_backup_for_session", {
    ...getRpcSessionArgs(),
    p_season_label: options?.seasonLabel ?? DEFAULT_CLOSE_SEASON_LABEL,
    p_target_capital: options?.targetCapital ?? DEFAULT_TARGET_CAPITAL,
  });
  if (error) throw error;
  return (data ?? { success: false, error: "Geen antwoord" }) as SeasonBackupResult;
}

/** Laatste opgeslagen interim-backup opnieuw downloaden. */
export async function getLatestSeasonBackup(
  seasonLabel: string = DEFAULT_CLOSE_SEASON_LABEL,
): Promise<SeasonBackupResult> {
  const { data, error } = await supabase.rpc("get_latest_season_backup_for_session", {
    ...getRpcSessionArgs(),
    p_season_label: seasonLabel,
  });
  if (error) throw error;
  return (data ?? { success: false, error: "Geen antwoord" }) as SeasonBackupResult;
}
