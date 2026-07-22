import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Lock,
  LockOpen,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { formatDateShort } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS, SectionIcon } from "@/components/layout";
import {
  formatLockPeriodsSummary,
  getPlayerListLockScheduleStatus,
  normalizePlayerListLockPeriods,
  PLAYER_LIST_LOCK_STATUS_LABELS,
  toPlayerListLockSettingValue,
  validatePlayerListLockPeriods,
  type PlayerListLockPeriod,
  type PlayerListLockScheduleStatus,
  type PlayerListLockSettingValue,
} from "@/lib/playerListLockUtils";
import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from "@/services/core/applicationSettingsSessionFetch";

interface LockSettings {
  id: number;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const STATUS_BADGE_CLASS: Record<PlayerListLockScheduleStatus, string> = {
  inactive: "bg-muted text-muted-foreground",
  scheduled: "border-primary/30 bg-primary/5 text-primary",
  active: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground",
};

function emptyPeriod(): PlayerListLockPeriod {
  return { from: "", until: null };
}

function toFingerprint(lockEnabled: boolean, periods: PlayerListLockPeriod[]): string {
  return JSON.stringify(toPlayerListLockSettingValue(lockEnabled, periods));
}

const PlayerListLockSettings: React.FC = () => {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [periods, setPeriods] = useState<PlayerListLockPeriod[]>([emptyPeriod()]);
  const [savedSnapshot, setSavedSnapshot] = useState<PlayerListLockSettingValue>({
    lock_enabled: false,
    periods: [],
  });
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedFingerprint = useRef("");
  const { toast } = useToast();
  const { orgQueryEnabled } = useOrgQueryScope();

  const draftSettingValue = useMemo(
    () => toPlayerListLockSettingValue(lockEnabled, periods),
    [lockEnabled, periods],
  );

  const scheduleStatus = useMemo(
    () => getPlayerListLockScheduleStatus(draftSettingValue),
    [draftSettingValue],
  );

  const validationError = useMemo(
    () => validatePlayerListLockPeriods(lockEnabled, periods),
    [lockEnabled, periods],
  );

  const isValid = !validationError;

  const currentFingerprint = useMemo(
    () => toFingerprint(lockEnabled, periods),
    [lockEnabled, periods],
  );

  useEffect(() => {
    if (!orgQueryEnabled) return;
    void fetchSettings();
  }, [orgQueryEnabled]);

  const applyLoadedValue = (id: number, settingValue: PlayerListLockSettingValue) => {
    const enabled = settingValue.lock_enabled ?? false;
    const normalized = normalizePlayerListLockPeriods(settingValue);
    const nextPeriods = normalized.length > 0 ? normalized : [emptyPeriod()];
    const persisted = toPlayerListLockSettingValue(enabled, normalized);

    setSettings({ id });
    setLockEnabled(enabled);
    setPeriods(nextPeriods);
    setSavedSnapshot(persisted);
    lastSavedFingerprint.current = toFingerprint(enabled, normalized);
  };

  const fetchSettings = async () => {
    try {
      const rows = await listApplicationSettingsForSession("player_list_lock");
      const data = rows.find((row) => row.setting_name === "global_lock");

      if (data) {
        applyLoadedValue(data.id, (data.setting_value ?? {}) as PlayerListLockSettingValue);
      } else {
        const defaultSettingValue = toPlayerListLockSettingValue(false, []);
        const newId = await insertApplicationSettingForSession({
          setting_category: "player_list_lock",
          setting_name: "global_lock",
          setting_value: defaultSettingValue,
        });
        applyLoadedValue(newId, defaultSettingValue);
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

  const persistSettings = async (nextEnabled: boolean, nextPeriods: PlayerListLockPeriod[]) => {
    if (!settings) return;

    setSaveState("saving");
    try {
      const settingValue = toPlayerListLockSettingValue(nextEnabled, nextPeriods);

      await updateApplicationSettingForSession(settings.id, {
        setting_value: settingValue,
        setting_category: "player_list_lock",
      });

      setSavedSnapshot(settingValue);
      lastSavedFingerprint.current = toFingerprint(nextEnabled, nextPeriods);
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

  const markDirty = () => {
    setHasChanges(true);
    setSaveState("idle");
  };

  const updatePeriod = (index: number, patch: Partial<PlayerListLockPeriod>) => {
    setPeriods((prev) =>
      prev.map((period, i) => {
        if (i !== index) return period;
        return {
          from: patch.from !== undefined ? patch.from : period.from,
          until:
            patch.until !== undefined
              ? patch.until?.trim()
                ? patch.until.trim()
                : null
              : period.until,
        };
      }),
    );
    markDirty();
  };

  const addPeriod = () => {
    setPeriods((prev) => [...prev, emptyPeriod()]);
    markDirty();
  };

  const removePeriod = (index: number) => {
    setPeriods((prev) => {
      if (prev.length <= 1) return [emptyPeriod()];
      return prev.filter((_, i) => i !== index);
    });
    markDirty();
  };

  useEffect(() => {
    if (!settings || !hasChanges || !isValid) return;
    if (currentFingerprint === lastSavedFingerprint.current) return;

    const timeoutId = window.setTimeout(() => {
      void persistSettings(lockEnabled, periods);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentFingerprint,
    hasChanges,
    isValid,
    lockEnabled,
    periods,
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
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const savedScheduleStatus = getPlayerListLockScheduleStatus(savedSnapshot);
  const savedPeriods = normalizePlayerListLockPeriods(savedSnapshot);
  const savedSummary = savedSnapshot.lock_enabled
    ? formatLockPeriodsSummary(savedPeriods, formatDateShort) ?? "Datums nog invullen"
    : "Uitgeschakeld";

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-brand-dark">
              <SectionIcon icon={Lock} />
              Spelerslijst vergrendeling
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Periodes waarin teammanagers de lijst niet mogen wijzigen. Daarbuiten blijft
              alles bewerkbaar.
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

      <CardContent className="space-y-3 pt-0">
        {/* Compact status strip */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2.5 text-sm",
            savedScheduleStatus === "active"
              ? "border-destructive/25 bg-destructive/5"
              : "border-primary/15 bg-brand-50/30",
          )}
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-brand-dark">
            {savedScheduleStatus === "active" ? (
              <Lock className="h-3.5 w-3.5 text-destructive" aria-hidden />
            ) : (
              <LockOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            )}
            Nu:{" "}
            <span
              className={
                savedScheduleStatus === "active" ? "text-destructive" : "text-muted-foreground"
              }
            >
              {savedScheduleStatus === "active" ? "vergrendeld" : "open"}
            </span>
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="min-w-0 text-muted-foreground">
            <span className="font-medium text-brand-dark">Periodes:</span>{" "}
            <span className="break-words">{savedSummary}</span>
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/10 px-3 py-2.5 min-h-[44px]">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="lock-enabled" className="text-sm font-medium text-brand-dark">
              Vergrendeling inschakelen
            </Label>
            <p className="text-xs text-muted-foreground">Periodes blijven bewaard als je dit uitzet.</p>
          </div>
          <Switch
            id="lock-enabled"
            checked={lockEnabled}
            onCheckedChange={(checked) => {
              setLockEnabled(checked);
              markDirty();
            }}
            className="shrink-0"
          />
        </div>

        {lockEnabled ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
                Periodes
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] w-full sm:w-auto gap-1"
                onClick={addPeriod}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Toevoegen
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-primary/10">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium">Vanaf</TableHead>
                    <TableHead className="h-10 text-xs font-medium">Tot (optioneel)</TableHead>
                    <TableHead className="h-10 w-12">
                      <span className="sr-only">Verwijderen</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period, index) => (
                    <TableRow key={`lock-period-${index}`}>
                      <TableCell className="py-2">
                        <Input
                          id={`lock-from-${index}`}
                          type="date"
                          aria-label={`Periode ${index + 1} vanaf`}
                          value={period.from}
                          onChange={(e) => updatePeriod(index, { from: e.target.value })}
                          className="min-h-[44px] max-w-[11rem]"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          id={`lock-until-${index}`}
                          type="date"
                          aria-label={`Periode ${index + 1} tot`}
                          value={period.until ?? ""}
                          onChange={(e) => updatePeriod(index, { until: e.target.value })}
                          className="min-h-[44px] max-w-[11rem]"
                          min={period.from || undefined}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                          onClick={() => removePeriod(index)}
                          aria-label={`Periode ${index + 1} verwijderen`}
                          disabled={periods.length <= 1 && !period.from && !period.until}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {validationError && hasChanges ? (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertDescription className="text-sm">{validationError}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-xs text-muted-foreground">
                {scheduleStatus === "scheduled"
                  ? "Tussen periodes is de lijst bewerkbaar."
                  : 'Laat "tot" leeg voor onbeperkt na de startdatum.'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-primary/15 px-3 py-2.5">
            Schakel in om periodes te plannen (bijv. seizoen + play-offs).
          </p>
        )}

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
