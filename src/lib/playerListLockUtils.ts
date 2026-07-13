/** Spelerslijst vergrendeling — instellingen (lock_from_date / lock_until_date) + lopend seizoen. */

export type PlayerListLockReason = "settings" | "season" | "both" | null;

export type PlayerListLockScheduleStatus = "inactive" | "scheduled" | "active" | "expired";

export interface PlayerListLockSettingValue {
  lock_enabled?: boolean;
  lock_from_date?: string | null;
  lock_until_date?: string | null;
}

export function isSettingsPlayerListLocked(
  settingValue: PlayerListLockSettingValue | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  return getPlayerListLockScheduleStatus(settingValue, referenceDate) === "active";
}

export function getPlayerListLockScheduleStatus(
  settingValue: PlayerListLockSettingValue | null | undefined,
  referenceDate: Date = new Date(),
): PlayerListLockScheduleStatus {
  if (!settingValue || settingValue.lock_enabled === false) return "inactive";

  const today = startOfLocalDay(referenceDate);
  const lockFrom = parseDateOnly(settingValue.lock_from_date);
  const lockUntil = parseDateOnly(settingValue.lock_until_date);

  if (!lockFrom && !lockUntil) return "inactive";

  if (lockFrom && today < lockFrom) return "scheduled";
  if (lockUntil && today > lockUntil) return "expired";

  return "active";
}

export function isWithinActiveSeason(
  seasonStart: string | null | undefined,
  seasonEnd: string | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!seasonStart || !seasonEnd) return false;

  const today = startOfLocalDay(referenceDate);
  const start = startOfLocalDay(new Date(`${seasonStart}T00:00:00`));
  const end = startOfLocalDay(new Date(`${seasonEnd}T00:00:00`));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  return today >= start && today <= end;
}

export function resolvePlayerListLockReason(
  settingsLocked: boolean,
  seasonLocked: boolean,
): PlayerListLockReason {
  if (settingsLocked && seasonLocked) return "both";
  if (settingsLocked) return "settings";
  if (seasonLocked) return "season";
  return null;
}

export function buildPlayerListLockMessage(
  reason: PlayerListLockReason,
  lockDate: string | null,
  seasonEndDate: string | null,
  formatDate: (iso: string) => string,
  lockUntilDate: string | null = null,
): string | null {
  const settingsRange = formatLockDateRange(lockDate, lockUntilDate, formatDate);

  switch (reason) {
    case "both":
      return settingsRange
        ? `Tijdens het lopende seizoen en ${settingsRange} zijn wijzigingen aan de spelerslijst niet toegestaan.`
        : "Tijdens het lopende seizoen zijn wijzigingen aan de spelerslijst niet toegestaan.";
    case "season":
      return seasonEndDate
        ? `Tijdens het lopende seizoen (tot ${formatDate(seasonEndDate)}) zijn wijzigingen aan de spelerslijst niet toegestaan.`
        : "Tijdens het lopende seizoen zijn wijzigingen aan de spelerslijst niet toegestaan.";
    case "settings":
      return settingsRange
        ? `Wijzigingen zijn niet toegestaan ${settingsRange}.`
        : "Wijzigingen aan de spelerslijst zijn momenteel niet toegestaan.";
    default:
      return null;
  }
}

export function formatLockDateRange(
  lockFrom: string | null | undefined,
  lockUntil: string | null | undefined,
  formatDate: (iso: string) => string,
): string | null {
  const from = lockFrom?.trim();
  const until = lockUntil?.trim();

  if (from && until) {
    return `van ${formatDate(from)} tot ${formatDate(until)}`;
  }
  if (from) return `vanaf ${formatDate(from)}`;
  if (until) return `tot ${formatDate(until)}`;
  return null;
}

export function validatePlayerListLockRange(
  lockFrom: string,
  lockUntil: string,
): string | null {
  if (!lockFrom || !lockUntil) return null;

  const from = parseDateOnly(lockFrom);
  const until = parseDateOnly(lockUntil);
  if (!from || !until) return null;

  if (startOfLocalDay(until) < startOfLocalDay(from)) {
    return "Einddatum moet op of na de startdatum liggen.";
  }

  return null;
}

export const PLAYER_LIST_LOCK_STATUS_LABELS: Record<PlayerListLockScheduleStatus, string> = {
  inactive: "Uitgeschakeld",
  scheduled: "Gepland",
  active: "Actief",
  expired: "Verlopen",
};

function parseDateOnly(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const normalized = value.trim();
  const date = new Date(normalized.length === 10 ? `${normalized}T00:00:00` : normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
