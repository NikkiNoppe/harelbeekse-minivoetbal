import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSeasonDataScope } from "@/hooks/useSeasonDataScope";
import { seasonService, type SeasonData } from "@/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";

type SaveState = "idle" | "saving" | "saved" | "error";

const EMPTY_SEASON: SeasonData = {
  season_start_date: "",
  season_end_date: "",
};

const SeasonDataSettings: React.FC = () => {
  const { toast } = useToast();
  const { orgQueryEnabled, getSeasonData, saveSeasonData } = useSeasonDataScope();
  const [localSeasonData, setLocalSeasonData] = useState<SeasonData>(EMPTY_SEASON);
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
    } catch {
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
      <Badge variant="secondary" className="gap-1 rounded-full text-xs font-normal">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Opslaan…
      </Badge>
    ) : saveState === "saved" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-xs font-normal text-green-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Opgeslagen
      </Badge>
    ) : saveState === "error" ? (
      <Badge variant="secondary" className="gap-1 rounded-full text-xs font-normal text-destructive">
        <AlertCircle className="h-3 w-3" aria-hidden />
        Ongeldig
      </Badge>
    ) : hasChanges && isValid ? (
      <Badge variant="secondary" className="rounded-full text-xs font-normal">
        Wordt bewaard…
      </Badge>
    ) : null;

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden />
            Seizoensdata
          </CardTitle>
          {saveStatusBadge}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="grid gap-3 sm:grid-cols-2"
          aria-busy={isLoading}
          aria-label="Seizoensperiode"
        >
          <div className="space-y-1.5">
            <Label htmlFor="seasonStart">Startdatum</Label>
            <Input
              id="seasonStart"
              type="date"
              className="min-h-[44px]"
              value={localSeasonData.season_start_date}
              onChange={(e) => handleInputChange("season_start_date", e.target.value)}
              disabled={isLoading && !hasChanges}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seasonEnd">Einddatum</Label>
            <Input
              id="seasonEnd"
              type="date"
              className="min-h-[44px]"
              value={localSeasonData.season_end_date}
              onChange={(e) => handleInputChange("season_end_date", e.target.value)}
              disabled={isLoading && !hasChanges}
            />
          </div>
        </div>

        {!isValid && hasChanges ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{validation.errors.join(", ")}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            Wijzigingen worden automatisch bewaard. Planner en seizoenslocks gebruiken deze periode.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SeasonDataSettings;
