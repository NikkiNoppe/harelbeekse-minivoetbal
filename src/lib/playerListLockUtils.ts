/** Spelerslijst vergrendeling — instellingen (lock_from_date) + lopend seizoen. */

export type PlayerListLockReason = "settings" | "season" | "both" | null;

export function isSettingsPlayerListLocked(
  settingValue:
    | { lock_enabled?: boolean; lock_from_date?: string | null }
    | null
    | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!settingValue || settingValue.lock_enabled === false) return false;
  const lockFrom = settingValue.lock_from_date;
  if (!lockFrom) return false;

  const today = startOfLocalDay(referenceDate);
  const lockDate = startOfLocalDay(new Date(`${lockFrom}T00:00:00`));
  if (Number.isNaN(lockDate.getTime())) return false;

  return today >= lockDate;
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
): string | null {
  switch (reason) {
    case "both":
      return lockDate
        ? `Tijdens het lopende seizoen en vanaf ${formatDate(lockDate)} zijn wijzigingen aan de spelerslijst niet toegestaan.`
        : "Tijdens het lopende seizoen zijn wijzigingen aan de spelerslijst niet toegestaan.";
    case "season":
      return seasonEndDate
        ? `Tijdens het lopende seizoen (tot ${formatDate(seasonEndDate)}) zijn wijzigingen aan de spelerslijst niet toegestaan.`
        : "Tijdens het lopende seizoen zijn wijzigingen aan de spelerslijst niet toegestaan.";
    case "settings":
      return lockDate
        ? `Wijzigingen zijn niet toegestaan vanaf ${formatDate(lockDate)}.`
        : "Wijzigingen aan de spelerslijst zijn momenteel niet toegestaan.";
    default:
      return null;
  }
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
