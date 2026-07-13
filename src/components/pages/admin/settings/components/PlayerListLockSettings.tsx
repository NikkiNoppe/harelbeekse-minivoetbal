import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Lock,
  LockOpen,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { formatDateShort } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";
import {
  formatLockDateRange,
  getPlayerListLockScheduleStatus,
  PLAYER_LIST_LOCK_STATUS_LABELS,
  validatePlayerListLockRange,
  type PlayerListLockScheduleStatus,
} from "@/lib/playerListLockUtils";
import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from "@/services/core/applicationSettingsSessionFetch";

interface LockSettings {
  id: number;
  lock_from_date: string | null;
  lock_until_date: string | null;
  lock_enabled: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const STATUS_BADGE_CLASS: Record<PlayerListLockScheduleStatus, string> = {
  inactive: "bg-muted text-muted-foreground",
  scheduled: "border-primary/30 bg-primary/5 text-primary",
  active: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground",
};

function formatLockDate(dateString?: string | null): string {
  if (!dateString?.trim()) return "Niet ingesteld";
  return formatDateShort(dateString);
}

function toFingerprint(
  lockEnabled: boolean,
  lockFromDate: string,
  lockUntilDate: string,
): string {
  return JSON.stringify({
    lock_enabled: lockEnabled,
    lock_from_date: lockFromDate || "",
    lock_until_date: lockUntilDate || "",
  });
}

const PlayerListLockSettings: React.FC = () => {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lockFromDate, setLockFromDate] = useState("");
  const [lockUntilDate, setLockUntilDate] = useState("");
  const [lockEnabled, setLockEnabled] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState({
    lock_enabled: false,
    lock_from_date: "",
    lock_until_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedFingerprint = useRef("");
  const { toast } = useToast();
  const { orgQueryEnabled } = useOrgQueryScope();

  const scheduleStatus = useMemo(
    () =>
      getPlayerListLockScheduleStatus({
        lock_enabled: lockEnabled,
        lock_from_date: lockFromDate || null,
        lock_until_date: lockUntilDate || null,
      }),
    [lockEnabled, lockFromDate, lockUntilDate],
  );

  const rangeError = useMemo(
    () => validatePlayerListLockRange(lockFromDate, lockUntilDate),
    [lockFromDate, lockUntilDate],
  );

  const missingPeriodError =
    lockEnabled && !lockFromDate && !lockUntilDate
      ? "Stel minstens een start- of einddatum in."
      : null;

  const validationError = rangeError ?? missingPeriodError;
  const isValid = !validationError;

  const currentFingerprint = useMemo(
    () => toFingerprint(lockEnabled, lockFromDate, lockUntilDate),
    [lockEnabled, lockFromDate, lockUntilDate],
  );

  const periodLabel = formatLockDateRange(lockFromDate, lockUntilDate, formatDateShort);

  useEffect(() => {
    if (!orgQueryEnabled) return;
    void fetchSettings();
  }, [orgQueryEnabled]);

  const fetchSettings = async () => {
    try {
      const rows = await listApplicationSettingsForSession("player_list_lock");
      const data = rows.find((row) => row.setting_name === "global_lock");

      if (data) {
        const settingValue = data.setting_value as {
          lock_from_date?: string | null;
          lock_until_date?: string | null;
          lock_enabled?: boolean;
        };
        const enabled = settingValue?.lock_enabled ?? false;
        const from = settingValue?.lock_from_date || "";
        const until = settingValue?.lock_until_date || "";

        setSettings({
          id: data.id,
          lock_from_date: settingValue?.lock_from_date || null,
          lock_until_date: settingValue?.lock_until_date || null,
          lock_enabled: enabled,
        });
        setLockFromDate(from);
        setLockUntilDate(until);
        setLockEnabled(enabled);
        setSavedSnapshot({
          lock_enabled: enabled,
          lock_from_date: from,
          lock_until_date: until,
        });
        lastSavedFingerprint.current = toFingerprint(enabled, from, until);
      } else {
        const defaultSettingValue = {
          lock_from_date: null,
          lock_until_date: null,
          lock_enabled: false,
        };

        const newId = await insertApplicationSettingForSession({
          setting_category: "player_list_lock",
          setting_name: "global_lock",
          setting_value: defaultSettingValue,
        });

        setSettings({
          id: newId,
          lock_from_date: null,
          lock_until_date: null,
          lock_enabled: false,
        });
        lastSavedFingerprint.current = toFingerprint(false, "", "");
      }

      setHasChanges(false);
      setSaveState("idle");
    } catch (error) {
      console.error("Error fetching player list lock settings:", error);
      toast({
        title: "Fout bij ophalen instellingen",
        description: "Kon vergrendelingsinstellingen niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const persistSettings = async (
    nextEnabled: boolean,
    nextFrom: string,
    nextUntil: string,
  ) => {
    if (!settings) return;

    setSaveState("saving");
    try {
      const settingValue = {
        lock_from_date: nextFrom || null,
        lock_until_date: nextUntil || null,
        lock_enabled: nextEnabled,
      };

      await updateApplicationSettingForSession(settings.id, {
        setting_value: settingValue,
        setting_category: "player_list_lock",
      });

      setSettings({
        ...settings,
        lock_from_date: nextFrom || null,
        lock_until_date: nextUntil || null,
        lock_enabled: nextEnabled,
      });
      setSavedSnapshot({
        lock_enabled: nextEnabled,
        lock_from_date: nextFrom,
        lock_until_date: nextUntil,
      });
      lastSavedFingerprint.current = toFingerprint(nextEnabled, nextFrom, nextUntil);
      setHasChanges(false);
      setSaveState("saved");
    } catch (error) {
      console.error("Error saving player list lock settings:", error);
      setSaveState("error");
      toast({
        title: "Fout bij opslaan",
        description: "Kon vergrendelingsinstellingen niet opslaan",
        variant: "destructive",
      });
    }
  };

  const updateField = (patch: {
    lockEnabled?: boolean;
    lockFromDate?: string;
    lockUntilDate?: string;
  }) => {
    if (patch.lockEnabled !== undefined) setLockEnabled(patch.lockEnabled);
    if (patch.lockFromDate !== undefined) setLockFromDate(patch.lockFromDate);
    if (patch.lockUntilDate !== undefined) setLockUntilDate(patch.lockUntilDate);
    setHasChanges(true);
    setSaveState("idle");
  };

  useEffect(() => {
    if (!settings || !hasChanges || !isValid) return;
    if (currentFingerprint === lastSavedFingerprint.current) return;

    const timeoutId = window.setTimeout(() => {
      void persistSettings(lockEnabled, lockFromDate, lockUntilDate);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentFingerprint,
    hasChanges,
    isValid,
    lockEnabled,
    lockFromDate,
    lockUntilDate,
    settings,
  ]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  const saveStatusBadge =
    saveState === "saving" ? (
      <Badge variant="secondary" className="gap-1 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Opslaan…
      </Badge>
    ) : saveState === "saved" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-green-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Opgeslagen
      </Badge>
    ) : saveState === "error" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-destructive">
        <AlertCircle className="h-3 w-3" aria-hidden />
        Opslaan mislukt
      </Badge>
    ) : hasChanges ? (
      <Badge variant="secondary" className="rounded-full">
        Wijzigingen bezig
      </Badge>
    ) : (
      <Badge variant="secondary" className="rounded-full">
        Automatisch bewaren
      </Badge>
    );

  if (loading) {
    return (
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const savedScheduleStatus = getPlayerListLockScheduleStatus({
    lock_enabled: savedSnapshot.lock_enabled,
    lock_from_date: savedSnapshot.lock_from_date || null,
    lock_until_date: savedSnapshot.lock_until_date || null,
  });

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-brand-dark">
              <Lock className="h-5 w-5 text-primary" aria-hidden />
              Spelerslijst vergrendeling
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Plan wanneer teammanagers geen wijzigingen meer mogen doorvoeren. Geldige
              wijzigingen worden automatisch bewaard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn("rounded-full", STATUS_BADGE_CLASS[savedScheduleStatus])}
            >
              {PLAYER_LIST_LOCK_STATUS_LABELS[savedScheduleStatus]}
            </Badge>
            {saveStatusBadge}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className={cn(
                "rounded-xl border p-4",
                savedScheduleStatus === "active"
                  ? "border-destructive/25 bg-destructive/5"
                  : "border-primary/15 bg-brand-50/30",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vergrendeld nu
              </p>
              <div className="mt-2 flex items-center gap-2">
                {savedScheduleStatus === "active" ? (
                  <Lock className="h-4 w-4 text-destructive" aria-hidden />
                ) : (
                  <LockOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
                <p
                  className={cn(
                    "text-base font-semibold",
                    savedScheduleStatus === "active"
                      ? "text-destructive"
                      : "text-brand-dark",
                  )}
                >
                  {savedScheduleStatus === "active" ? "Ja" : "Nee"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Geplande periode
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-brand-dark">
                {savedSnapshot.lock_enabled
                  ? formatLockDateRange(
                      savedSnapshot.lock_from_date,
                      savedSnapshot.lock_until_date,
                      formatDateShort,
                    ) ?? "Datums nog invullen"
                  : "Uitgeschakeld"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/10 bg-card px-4 py-3 min-h-[44px]">
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="lock-enabled" className="text-sm font-medium text-brand-dark">
                  Vergrendeling inschakelen
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pauzeer de planning zonder datums te wissen.
                </p>
              </div>
              <Switch
                id="lock-enabled"
                checked={lockEnabled}
                onCheckedChange={(checked) => updateField({ lockEnabled: checked })}
                className="shrink-0"
              />
            </div>

            {lockEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden />
                  Vergrendelingsperiode
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lock-from-date">Vanaf</Label>
                    <Input
                      id="lock-from-date"
                      type="date"
                      value={lockFromDate}
                      onChange={(e) => updateField({ lockFromDate: e.target.value })}
                      className="min-h-[44px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatLockDate(lockFromDate)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lock-until-date">Tot (optioneel)</Label>
                    <Input
                      id="lock-until-date"
                      type="date"
                      value={lockUntilDate}
                      onChange={(e) => updateField({ lockUntilDate: e.target.value })}
                      className="min-h-[44px]"
                      min={lockFromDate || undefined}
                    />
                    <p className="text-xs text-muted-foreground">
                      {lockUntilDate ? formatLockDate(lockUntilDate) : "Onbeperkt na start"}
                    </p>
                  </div>
                </div>

                {validationError && hasChanges ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                ) : scheduleStatus === "scheduled" && lockFromDate ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Start automatisch op{" "}
                    <span className="font-medium text-brand-dark">
                      {formatDateShort(lockFromDate)}
                    </span>
                    {periodLabel ? ` (${periodLabel})` : "."}
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Laat &quot;tot&quot; leeg om na de startdatum onbeperkt vergrendeld te blijven.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground rounded-lg border border-dashed border-primary/15 px-4 py-3">
                Schakel vergrendeling in om een periode in te plannen vóór het seizoen start.
              </p>
            )}
          </div>
        </div>

        {saveState === "saving" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Instellingen worden bewaard…
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PlayerListLockSettings;
