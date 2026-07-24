import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Sparkles } from "lucide-react";
import { seasonService } from "@/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMatchesForSession } from "@/services/core/matchesSessionBulk";
import {
  buildCupRoundLabels,
  suggestIdealCupDates,
  type IdealCupDatesSuggestion,
} from "@/lib/cupBracketPlan";
import { toMondayIso, uniqueMondaysFromDates } from "@/lib/competitionPlanningEstimate";

interface BekerDateSelectorProps {
  onDatesSelected: (dates: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** Exact aantal speelweken (berekend uit teamcount + slots). */
  weeks: number;
  /** Aantal 1/8-weken (voor ronde-labels). */
  firstRoundWeeks?: number;
  organizationId: number;
  allowByeSelection?: boolean;
  teamsForBye?: Array<{ team_id: number; team_name: string }>;
  onByeSelected?: (teamId: number | null) => void;
}

const BekerDateInput = React.memo<{
  id: string;
  label: string;
  value: string;
  minDate: string;
  onChange: (value: string) => void;
}>(({ id, label, value, minDate, onChange }) => (
  <div>
    <Label htmlFor={id} className="text-sm">{label}</Label>
    <Input
      id={id}
      type="date"
      value={value}
      min={minDate}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[44px]"
    />
  </div>
));

const BekerRoundComponent = React.memo<{
  round: {
    type: "group" | "single";
    name: string;
    index?: number;
    subRounds?: Array<{ name: string; index: number }>;
  };
  selectedDates: string[];
  minimumDates: string[];
  onDateChange: (index: number, value: string) => void;
}>(({ round, selectedDates, minimumDates, onDateChange }) => {
  const handleDateChange = useCallback((index: number, value: string) => {
    onDateChange(index, value);
  }, [onDateChange]);

  if (round.type === "group") {
    return (
      <div className="space-y-2">
        <Label className="font-semibold text-sm">{round.name}</Label>
        <div className="ml-2 space-y-2">
          {round.subRounds?.map((subRound) => (
            <div key={subRound.index} className="grid grid-cols-1 gap-2 items-center">
              <BekerDateInput
                id={`beker-date-${subRound.index}`}
                label={subRound.name}
                value={selectedDates[subRound.index] ?? ""}
                minDate={minimumDates[subRound.index] ?? ""}
                onChange={(value) => handleDateChange(subRound.index, value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="font-semibold text-sm">{round.name}</Label>
      <BekerDateInput
        id={`beker-date-${round.index}`}
        label="Selecteer datum"
        value={selectedDates[round.index!] ?? ""}
        minDate={minimumDates[round.index!] ?? ""}
        onChange={(value) => handleDateChange(round.index!, value)}
      />
    </div>
  );
});

const BekerLoadingComponent = React.memo(() => (
  <div className="flex justify-center items-center py-8" aria-busy="true">
    <div className="text-sm text-muted-foreground">Ideale speeldata laden…</div>
  </div>
));

const BekerDateSelector: React.FC<BekerDateSelectorProps> = ({
  onDatesSelected,
  onCancel,
  isLoading = false,
  weeks,
  firstRoundWeeks,
  organizationId,
  allowByeSelection = false,
  teamsForBye = [],
  onByeSelected,
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    Array.from({ length: weeks }, () => ""),
  );
  const [seasonStartDate, setSeasonStartDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<IdealCupDatesSuggestion | null>(null);

  const resolvedFirstRoundWeeks = firstRoundWeeks ?? Math.max(0, weeks - 3);

  const bekerRounds = useMemo(
    () => buildCupRoundLabels(resolvedFirstRoundWeeks),
    [resolvedFirstRoundWeeks],
  );

  // Reset length when weeks changes
  useEffect(() => {
    setSelectedDates((prev) => {
      if (prev.length === weeks) return prev;
      const next = Array.from({ length: weeks }, (_, i) => prev[i] ?? "");
      return next;
    });
  }, [weeks]);

  useEffect(() => {
    let cancelled = false;

    const loadAndSuggest = async () => {
      try {
        setLoading(true);
        const [seasonData, competitionMatches] = await Promise.all([
          seasonService.getSeasonData(organizationId),
          fetchMatchesForSession({ is_cup_match: false }).catch(() => []),
        ]);

        const start =
          seasonData.season_start_date ||
          (() => {
            const fallback = new Date();
            fallback.setDate(fallback.getDate() + 14);
            return fallback.toISOString().split("T")[0];
          })();
        const end =
          seasonData.season_end_date ||
          (() => {
            const d = new Date(start);
            d.setMonth(d.getMonth() + 9);
            return d.toISOString().split("T")[0];
          })();

        if (cancelled) return;
        setSeasonStartDate(start);

        const competitionMondays = uniqueMondaysFromDates(
          (competitionMatches || [])
            .map((m: { match_date?: string }) => m.match_date)
            .filter(Boolean) as string[],
        );

        const ideal = suggestIdealCupDates({
          requiredWeeks: weeks,
          seasonStart: start,
          seasonEnd: end,
          vacations: seasonData.vacation_periods || [],
          competitionMondays,
          timeslots: seasonData.venue_timeslots || [],
        });

        if (cancelled) return;
        setSuggestion(ideal);
        if (ideal.dates.length === weeks) {
          setSelectedDates(ideal.dates);
        } else if (ideal.dates.length > 0) {
          setSelectedDates(
            Array.from({ length: weeks }, (_, i) => ideal.dates[i] ?? ""),
          );
        }
      } catch (error) {
        console.error("❌ Error loading season/ideal cup dates:", error);
        if (!cancelled) {
          const fallback = new Date();
          fallback.setDate(fallback.getDate() + 14);
          setSeasonStartDate(fallback.toISOString().split("T")[0]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAndSuggest();
    return () => {
      cancelled = true;
    };
  }, [weeks, organizationId]);

  const bekerMinimumDates = useMemo(() => {
    if (!seasonStartDate) {
      return Array.from({ length: weeks }, () => "");
    }
    const seasonStart = new Date(`${toMondayIso(seasonStartDate)}T12:00:00`);
    return Array.from({ length: weeks }, (_, i) => {
      const date = new Date(seasonStart);
      date.setDate(seasonStart.getDate() + i * 7);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    });
  }, [seasonStartDate, weeks]);

  const applyIdealDates = useCallback(() => {
    if (suggestion?.dates?.length) {
      setSelectedDates(
        Array.from({ length: weeks }, (_, i) => suggestion.dates[i] ?? ""),
      );
    }
  }, [suggestion, weeks]);

  const handleBekerDateChange = useCallback((index: number, value: string) => {
    setSelectedDates((prev) => {
      const newDates = [...prev];
      newDates[index] = value;
      return newDates;
    });
  }, []);

  const handleBekerSubmit = useCallback(() => {
    const validDates = selectedDates.filter((date) => date !== "");
    if (validDates.length === weeks) {
      onDatesSelected(validDates);
    }
  }, [selectedDates, onDatesSelected, weeks]);

  const isBekerSelectionValid = useMemo(
    () =>
      selectedDates.length === weeks &&
      selectedDates.every((date) => date !== "") &&
      selectedDates.every((date, index) => !bekerMinimumDates[index] || date >= bekerMinimumDates[index]),
    [selectedDates, bekerMinimumDates, weeks],
  );

  const isBekerSubmitDisabled = useMemo(() => {
    const byeRequiredButMissing = allowByeSelection && !byeTeamId;
    return !isBekerSelectionValid || isLoading || byeRequiredButMissing;
  }, [isBekerSelectionValid, isLoading, allowByeSelection, byeTeamId]);

  return (
    <div className="modal">
      <div className="modal__title">Beker Speeldata Selecteren</div>
      <p className="text-sm text-muted-foreground mb-2">
        {weeks} speelweek{weeks === 1 ? "" : "en"} nodig op basis van het aantal teams en beschikbare tijdslots.
      </p>

      <div className="space-y-3">
        {allowByeSelection && teamsForBye.length % 2 === 1 && (
          <div className="space-y-1">
            <Label>Bye team (stroomt door naar volgende ronde)</Label>
            <Select
              value={byeTeamId ? String(byeTeamId) : undefined}
              onValueChange={(val) => {
                const id = Number(val);
                setByeTeamId(id);
                onByeSelected?.(id);
              }}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Selecteer bye team" />
              </SelectTrigger>
              <SelectContent>
                {teamsForBye.map((t) => (
                  <SelectItem key={t.team_id} value={String(t.team_id)}>
                    {t.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Bij oneven aantal teams kan één team automatisch doorstromen.
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 mt-3 w-full max-w-md space-y-3">
        {loading ? (
          <BekerLoadingComponent />
        ) : (
          <>
            {suggestion && suggestion.notes.length > 0 && (
              <Alert className="border-primary/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm space-y-1">
                  {suggestion.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={applyIdealDates}
              disabled={!suggestion?.dates?.length}
            >
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              Ideale data opnieuw toepassen
            </Button>

            <div className="space-y-3">
              {bekerRounds.map((round, roundIndex) => (
                <div key={roundIndex}>
                  <BekerRoundComponent
                    round={round}
                    selectedDates={selectedDates}
                    minimumDates={bekerMinimumDates}
                    onDateChange={handleBekerDateChange}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={handleBekerSubmit}
            disabled={isBekerSubmitDisabled || loading}
            className="btn btn--primary flex-1 min-h-[44px]"
          >
            {isLoading ? "Beker aanmaken..." : "Beker Data Bevestigen"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn--secondary min-h-[44px]"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BekerDateSelector);
