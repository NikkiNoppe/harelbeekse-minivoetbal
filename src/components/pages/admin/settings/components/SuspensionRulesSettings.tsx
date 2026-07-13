import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { PUBLIC_CARD_CLASS } from "@/components/layout";
import {
  suspensionRulesService,
  type SuspensionRules,
  type YellowCardRule,
} from "@/domains/cards-suspensions";

type SaveState = "idle" | "saving" | "saved" | "error";

function fingerprintSuspensionRules(r: SuspensionRules): string {
  const normalized: SuspensionRules = {
    ...r,
    yellow_card_rules: [...r.yellow_card_rules].sort((a, b) => a.card_count - b.card_count),
  };
  return JSON.stringify(normalized);
}

function validateSuspensionRules(rules: SuspensionRules): string | null {
  for (const rule of rules.yellow_card_rules) {
    if (rule.card_count < 1) {
      return "Elke gele-kaart drempel moet minstens 1 zijn.";
    }
    if (rule.suspension_matches < 0) {
      return "Schorsingsduur kan niet negatief zijn.";
    }
  }

  const counts = rules.yellow_card_rules.map((rule) => rule.card_count);
  if (new Set(counts).size !== counts.length) {
    return "Elke gele-kaart drempel moet uniek zijn.";
  }

  if (rules.red_card_rules.default_suspension_matches < 1) {
    return "Standaard rood-schorsing moet minstens 1 wedstrijd zijn.";
  }

  return null;
}

function summarizeYellowRules(rules: YellowCardRule[]): string {
  if (rules.length === 0) return "Geen drempels";
  const sorted = [...rules].sort((a, b) => a.card_count - b.card_count);
  const top = sorted[sorted.length - 1];
  return `${rules.length} drempel${rules.length === 1 ? "" : "s"} · max. ${top.card_count} gele → ${top.suspension_matches} w.`;
}

export const SuspensionRulesSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgQueryEnabled } = useOrgQueryScope();
  const [rules, setRules] = useState<SuspensionRules | null>(null);
  const [savedRules, setSavedRules] = useState<SuspensionRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedFingerprint = useRef("");

  useEffect(() => {
    if (!orgQueryEnabled) return;
    void loadRules();
  }, [orgQueryEnabled]);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const suspensionRules = await suspensionRulesService.getSuspensionRules();
      setRules(suspensionRules);
      setSavedRules(suspensionRules);
      lastSavedFingerprint.current = fingerprintSuspensionRules(suspensionRules);
      setHasChanges(false);
      setSaveState("idle");
    } catch (error) {
      console.error("Error loading suspension rules:", error);
      toast({
        title: "Fout",
        description: "Kon schorsingsregels niet laden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const persistRules = async (nextRules: SuspensionRules) => {
    try {
      setSaveState("saving");
      const rulesToSave: SuspensionRules = {
        ...nextRules,
        yellow_card_rules: [...nextRules.yellow_card_rules].sort(
          (a, b) => a.card_count - b.card_count,
        ),
        red_card_rules: {
          ...nextRules.red_card_rules,
          admin_can_modify: true,
        },
      };

      const success = await suspensionRulesService.updateSuspensionRules(rulesToSave);

      if (!success) throw new Error("Update failed");

      setRules(rulesToSave);
      setSavedRules(rulesToSave);
      lastSavedFingerprint.current = fingerprintSuspensionRules(rulesToSave);
      setHasChanges(false);
      setSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["suspensions"] });
    } catch (error) {
      console.error("Error saving suspension rules:", error);
      setSaveState("error");
      toast({
        title: "Fout",
        description: "Kon schorsingsregels niet opslaan.",
        variant: "destructive",
      });
    }
  };

  const updateRules = (updater: (current: SuspensionRules) => SuspensionRules) => {
    setRules((current) => {
      if (!current) return current;
      const next = updater(current);
      setHasChanges(true);
      setSaveState("idle");
      return next;
    });
  };

  const addYellowCardRule = () => {
    updateRules((current) => {
      const highestCardCount = Math.max(
        0,
        ...current.yellow_card_rules.map((rule) => rule.card_count || 0),
      );
      const newRule: YellowCardRule = {
        card_count: highestCardCount + 2,
        suspension_matches: 1,
      };
      return {
        ...current,
        yellow_card_rules: [...current.yellow_card_rules, newRule],
      };
    });
  };

  const updateYellowCardRule = (
    index: number,
    field: "card_count" | "suspension_matches",
    value: number,
  ) => {
    updateRules((current) => {
      const updatedRules = [...current.yellow_card_rules];
      updatedRules[index] = { ...updatedRules[index], [field]: value };
      return { ...current, yellow_card_rules: updatedRules };
    });
  };

  const removeYellowCardRule = (index: number) => {
    updateRules((current) => ({
      ...current,
      yellow_card_rules: current.yellow_card_rules.filter((_, i) => i !== index),
    }));
  };

  const currentFingerprint = useMemo(
    () => (rules ? fingerprintSuspensionRules(rules) : null),
    [rules],
  );

  const validationError = useMemo(
    () => (rules ? validateSuspensionRules(rules) : null),
    [rules],
  );

  const isValid = !validationError;

  useEffect(() => {
    if (!rules || !hasChanges || !isValid) return;
    if (!currentFingerprint || currentFingerprint === lastSavedFingerprint.current) return;

    const timeoutId = window.setTimeout(() => {
      void persistRules(rules);
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [currentFingerprint, hasChanges, isValid, rules]);

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

  if (isLoading) {
    return (
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rules || !savedRules) {
    return (
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-dark">
            <ShieldAlert className="h-5 w-5 text-primary" aria-hidden />
            Schorsingsregels
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription>
              Kon schorsingsregels niet laden. Probeer de pagina te vernieuwen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-brand-dark">
              <ShieldAlert className="h-5 w-5 text-primary" aria-hidden />
              Schorsingsregels
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Bepaal drempels voor gele en rode kaarten. Na opslaan worden kaarttotalen
              opnieuw berekend. Geldige wijzigingen worden automatisch bewaard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="rounded-full">
              {savedRules.yellow_card_rules.length} gele drempel
              {savedRules.yellow_card_rules.length === 1 ? "" : "s"}
            </Badge>
            {saveStatusBadge}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Gele kaarten
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-brand-dark">
                {summarizeYellowRules(savedRules.yellow_card_rules)}
              </p>
            </div>

            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rechtstreeks rood
              </p>
              <p className="mt-2 text-base font-semibold text-brand-dark">
                {savedRules.red_card_rules.default_suspension_matches} wedstrijd
                {savedRules.red_card_rules.default_suspension_matches === 1 ? "" : "en"}
              </p>
            </div>

            <div className="rounded-xl border border-primary/15 bg-brand-50/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Einde seizoen
              </p>
              <div className="mt-2 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground" aria-hidden />
                <p className="text-sm font-semibold text-brand-dark">
                  {savedRules.reset_rules.reset_at_season_end
                    ? "Kaarten resetten"
                    : "Geen reset"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4 sm:p-5">
            <section className="space-y-3" aria-labelledby="yellow-card-rules-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  id="yellow-card-rules-heading"
                  className="flex items-center gap-2 text-sm font-semibold text-brand-dark"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
                  Gele kaarten
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addYellowCardRule}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Drempel toevoegen
                </Button>
              </div>

              <div className="space-y-2">
                {rules.yellow_card_rules.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-primary/15 px-4 py-3 text-xs text-muted-foreground">
                    Nog geen drempels. Voeg een regel toe om schorsingen bij gele kaarten te
                    bepalen.
                  </p>
                ) : (
                  rules.yellow_card_rules.map((rule, index) => (
                    <div
                      key={`yellow-rule-${index}`}
                      className="grid gap-3 rounded-lg border border-primary/10 bg-card p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`yellow-count-${index}`} className="text-xs">
                          Vanaf (gele kaarten)
                        </Label>
                        <Input
                          id={`yellow-count-${index}`}
                          type="number"
                          value={rule.card_count}
                          onChange={(e) =>
                            updateYellowCardRule(
                              index,
                              "card_count",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="min-h-[44px]"
                          min={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`yellow-suspension-${index}`} className="text-xs">
                          Schorsing (wedstrijden)
                        </Label>
                        <Input
                          id={`yellow-suspension-${index}`}
                          type="number"
                          value={rule.suspension_matches}
                          onChange={(e) =>
                            updateYellowCardRule(
                              index,
                              "suspension_matches",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="min-h-[44px]"
                          min={0}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeYellowCardRule(index)}
                        className="min-h-[44px] min-w-[44px] sm:mb-0"
                        aria-label={`Drempel bij ${rule.card_count} gele kaarten verwijderen`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-primary/10 bg-card p-4" aria-labelledby="red-card-rules-heading">
              <h3
                id="red-card-rules-heading"
                className="flex items-center gap-2 text-sm font-semibold text-brand-dark"
              >
                <Ban className="h-4 w-4 text-destructive" aria-hidden />
                Rechtstreeks rood
              </h3>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="red-default">Standaard schorsing</Label>
                  <Input
                    id="red-default"
                    type="number"
                    value={rules.red_card_rules.default_suspension_matches}
                    onChange={(e) =>
                      updateRules((current) => ({
                        ...current,
                        red_card_rules: {
                          ...current.red_card_rules,
                          default_suspension_matches: parseInt(e.target.value, 10) || 1,
                        },
                      }))
                    }
                    className="min-h-[44px]"
                    min={1}
                  />
                </div>
                <p className="pb-1 text-xs leading-relaxed text-muted-foreground sm:max-w-[12rem]">
                  Geen maximum; afwijkingen beheer je als handmatige schorsing.
                </p>
              </div>
            </section>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/10 bg-card px-4 py-3 min-h-[44px]">
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="season-reset" className="text-sm font-medium text-brand-dark">
                  Reset kaarten aan einde seizoen
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gele en rode tellers worden gewist bij seizoenseinde.
                </p>
              </div>
              <Switch
                id="season-reset"
                checked={rules.reset_rules.reset_at_season_end}
                onCheckedChange={(checked) =>
                  updateRules((current) => ({
                    ...current,
                    reset_rules: {
                      ...current.reset_rules,
                      reset_at_season_end: checked,
                    },
                  }))
                }
                className="shrink-0"
              />
            </div>

            {validationError && hasChanges ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Aanpasbaar tijdens het seizoen. Wijzigingen worden na een korte pauze automatisch
                opgeslagen en toegepast op de kaarttotalen.
              </p>
            )}
          </div>
        </div>

        {saveState === "saving" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Schorsingsregels worden bewaard en opnieuw toegepast…
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
