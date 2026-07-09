import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, CheckCircle2, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSeasonDataScope } from "@/hooks/useSeasonDataScope";
import { seasonService, type SeasonData } from "@/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";

type SaveState = "idle" | "saving" | "saved" | "error";

function formatSeasonDate(dateString?: string): string {
  if (!dateString) return "Nog niet ingesteld";
  const normalized = `${dateString.split("T")[0]}T12:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Nog niet ingesteld";
  return date.toLocaleDateString("nl-BE");
}

const SeasonDataSettings: React.FC = () => {
  const { toast } = useToast();
  const { orgQueryEnabled, getSeasonData, saveSeasonData } = useSeasonDataScope();
  const [seasonData, setSeasonData] = useState<SeasonData>({
    season_start_date: "",
    season_end_date: "",
  });
  const [localSeasonData, setLocalSeasonData] = useState<SeasonData>(seasonData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedFingerprint = useRef("");

  useEffect(() => {
    if (!orgQueryEnabled) return;
    void loadSeasonData();
  }, [orgQueryEnabled]);

  const loadSeasonData = async () => {
    setIsLoading(true);
    try {
      const loaded = await getSeasonData();
      setSeasonData(loaded);
      setLocalSeasonData(loaded);
      lastSavedFingerprint.current = JSON.stringify({
        season_start_date: loaded.season_start_date || "",
        season_end_date: loaded.season_end_date || "",
      });
      setHasChanges(false);
      setSaveState("idle");
    } catch (error) {
      console.error("\u274c Error loading season data:", error);
      toast({
        title: "Fout",
        description: "Kon seizoensdata niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const persistSeasonData = async (nextData: SeasonData) => {
    setIsLoading(true);
    setSaveState("saving");

    try {
      const validation = seasonService.validateSeasonData(nextData);
      if (!validation.isValid) {
        setSaveState("error");
        return;
      }

      const result = await saveSeasonData(nextData);

      if (result.success) {
        setSeasonData(nextData);
        setLocalSeasonData(nextData);
        setHasChanges(false);
        setSaveState("saved");
        lastSavedFingerprint.current = JSON.stringify({
          season_start_date: nextData.season_start_date || "",
          season_end_date: nextData.season_end_date || "",
        });
      } else {
        setSaveState("error");
        toast({
          title: "Fout bij opslaan",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setSaveState("error");
      toast({
        title: "Fout bij opslaan",
        description: "Kon seizoensdata niet opslaan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SeasonData, value: string) => {
    setLocalSeasonData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    setSaveState("idle");
  };

  const validation = seasonService.validateSeasonData(localSeasonData);
  const isValid = validation.isValid;
  const currentFingerprint = useMemo(
    () =>
      JSON.stringify({
        season_start_date: localSeasonData.season_start_date || "",
        season_end_date: localSeasonData.season_end_date || "",
      }),
    [localSeasonData.season_end_date, localSeasonData.season_start_date],
  );

  useEffect(() => {
    if (!hasChanges || !isValid) return;
    if (!localSeasonData.season_start_date || !localSeasonData.season_end_date) return;
    if (currentFingerprint === lastSavedFingerprint.current) return;

    const timeoutId = window.setTimeout(() => {
      void persistSeasonData(localSeasonData);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [currentFingerprint, hasChanges, isValid, localSeasonData]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  const saveStatusBadge =
    saveState === "saving" ? (
      <Badge variant="secondary" className="gap-1 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" />
        Opslaan…
      </Badge>
    ) : saveState === "saved" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Opgeslagen
      </Badge>
    ) : saveState === "error" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-destructive">
        <AlertCircle className="h-3 w-3" />
        Controleer datums
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

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-brand-dark">
              <Settings className="h-5 w-5 text-primary" />
              Seizoensdata
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Stel start- en einddatum in. Geldige wijzigingen worden automatisch bewaard.
            </p>
          </div>
          <div className="shrink-0">{saveStatusBadge}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Startdatum
              </p>
              <p className="mt-2 text-base font-semibold text-brand-dark">
                {formatSeasonDate(seasonData.season_start_date)}
              </p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Einddatum
              </p>
              <p className="mt-2 text-base font-semibold text-brand-dark">
                {formatSeasonDate(seasonData.season_end_date)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background p-4 sm:p-5">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <Calendar className="h-4 w-4 text-primary" />
                Seizoensperiode
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seasonStart">Startdatum</Label>
                  <Input
                    id="seasonStart"
                    type="date"
                    className="min-h-[44px]"
                    value={localSeasonData.season_start_date}
                    onChange={(e) => handleInputChange("season_start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonEnd">Einddatum</Label>
                  <Input
                    id="seasonEnd"
                    type="date"
                    className="min-h-[44px]"
                    value={localSeasonData.season_end_date}
                    onChange={(e) => handleInputChange("season_end_date", e.target.value)}
                  />
                </div>
              </div>

              {!isValid && hasChanges ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validation.errors.join(", ")}</AlertDescription>
                </Alert>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  De planner en seizoenslocks gebruiken meteen deze periode zodra de datums geldig zijn.
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Seizoensdata worden bijgewerkt…
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SeasonDataSettings; 