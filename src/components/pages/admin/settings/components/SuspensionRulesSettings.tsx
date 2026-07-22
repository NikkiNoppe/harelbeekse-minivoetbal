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

export const SuspensionRulesSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgQueryEnabled } = useOrgQueryScope();
  const [rules, setRules] = useState<SuspensionRules | null>(null);
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
        Opslaan mislukt
      </Badge>
    ) : hasChanges && isValid ? (
      <Badge variant="secondary" className="rounded-full text-xs font-normal">
        Wordt bewaard…
      </Badge>
    ) : null;

  if (isLoading) {
    return (
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
        <CardHeader>
          <Skeleton className="h-8 w-56" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rules) {
    return (
      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" aria-hidden />
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
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            Schorsingsregels
          </CardTitle>
          {saveStatusBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        <section className="space-y-3" aria-labelledby="yellow-card-rules-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

          {rules.yellow_card_rules.length === 0 ? (
            <p className="rounded-lg border border-dashed border-primary/15 px-3 py-2.5 text-sm text-muted-foreground">
              Nog geen drempels. Voeg een regel toe voor schorsingen bij gele kaarten.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.yellow_card_rules.map((rule, index) => (
                <div
                  key={`yellow-rule-${index}`}
                  className="grid gap-2 rounded-lg border border-primary/10 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
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
                    className="min-h-[44px] min-w-[44px]"
                    aria-label={`Drempel bij ${rule.card_count} gele kaarten verwijderen`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section
            className="space-y-2 rounded-lg border border-primary/10 p-3"
            aria-labelledby="red-card-rules-heading"
          >
            <h3
              id="red-card-rules-heading"
              className="flex items-center gap-2 text-sm font-semibold text-brand-dark"
            >
              <Ban className="h-4 w-4 text-destructive" aria-hidden />
              Rechtstreeks rood
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="red-default">Standaard schorsing (wedstrijden)</Label>
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
            <p className="text-xs text-muted-foreground">
              Afwijkingen beheer je als handmatige schorsing.
            </p>
          </section>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 p-3 min-h-[44px]">
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor="season-reset" className="text-sm font-medium">
                Reset aan einde seizoen
              </Label>
              <p className="text-xs text-muted-foreground">
                Gele en rode tellers wissen bij seizoenseinde.
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
        </div>

        {validationError && hasChanges ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription className="text-sm">{validationError}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            Wijzigingen worden automatisch bewaard en toegepast op de kaarttotalen.
          </p>
        )}

        {saveState === "saving" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Kaarttotalen worden herberekend…
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
