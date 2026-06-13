import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  profilePollService,
  formatPollDeadline,
  type ProfilePollRespondentView,
} from "@/services/profilePoll/profilePollService";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_POLLS_QUERY_KEY } from "@/services/profilePoll/profilePollService";

interface ProfilePollRespondentCardProps {
  poll: ProfilePollRespondentView;
}

export function ProfilePollRespondentCard({ poll }: ProfilePollRespondentCardProps) {
  const queryClient = useQueryClient();
  const initialIds = poll.my_response?.option_ids ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(!!poll.my_response);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds(poll.my_response?.option_ids ?? []);
    setSaved(!!poll.my_response);
  }, [poll.my_response]);

  const saveResponse = useCallback(
    async (optionIds: string[]) => {
      if (optionIds.length === 0) return;
      setPending(true);
      setError(null);
      try {
        await profilePollService.submitResponse(poll.id, optionIds);
        setSaved(true);
        await queryClient.invalidateQueries({ queryKey: PROFILE_POLLS_QUERY_KEY });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon antwoord niet opslaan");
        setSelectedIds(poll.my_response?.option_ids ?? []);
      } finally {
        setPending(false);
      }
    },
    [poll.id, poll.my_response, queryClient],
  );

  const handleRadioChange = (optionId: string) => {
    setSelectedIds([optionId]);
    void saveResponse([optionId]);
  };

  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    const next = checked
      ? [...selectedIds, optionId]
      : selectedIds.filter((id) => id !== optionId);
    setSelectedIds(next);
    if (next.length > 0) {
      void saveResponse(next);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {poll.title && (
              <p className="text-xs text-muted-foreground mb-0.5">{poll.title}</p>
            )}
            <CardTitle className="text-base sm:text-lg leading-snug">
              {(() => {
                const markerRegex = /(?=[🅐🅑🅒🅓🅔🅕🅖🅗🅘])|(?=\s[A-F]\)\s)/u;
                const parts = poll.question
                  .split(markerRegex)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (parts.length <= 1) return poll.question;
                const isOption = (s: string) => /^[🅐🅑🅒🅓🅔🅕🅖🅗🅘]|^[A-F]\)/u.test(s);
                const intro = !isOption(parts[0]) ? parts[0] : null;
                const options = intro ? parts.slice(1) : parts;
                const splitOption = (line: string) => {
                  // Trek de letter (1e char) los van de rest, en splits op " → " voor uitleg
                  const letter = line.slice(0, 2).trim();
                  const rest = line.slice(2).trim();
                  const [main, ...note] = rest.split(/→/);
                  return { letter, main: main.trim(), note: note.join("→").trim() };
                };
                return (
                  <span className="block">
                    {intro && (
                      <span className="block text-sm sm:text-base font-semibold text-foreground leading-snug mb-2">
                        {intro}
                      </span>
                    )}
                    <span className="block space-y-1.5">
                      {options.map((line, i) => {
                        const { letter, main, note } = splitOption(line);
                        return (
                          <span
                            key={i}
                            className="flex items-start gap-2 text-[13px] sm:text-sm font-normal leading-snug"
                          >
                            <span
                              aria-hidden="true"
                              className="shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-md bg-primary/10 text-primary text-xs font-semibold leading-none"
                            >
                              {letter}
                            </span>
                            <span className="min-w-0 flex-1 text-foreground/90">
                              <span className="font-medium">{main}</span>
                              {note && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  → {note}
                                </span>
                              )}
                            </span>
                          </span>
                        );
                      })}
                    </span>
                  </span>
                );
              })()}
            </CardTitle>
          </div>
          {saved && !pending && (
            <Badge variant="outline" className="shrink-0 text-[hsl(var(--success))] border-[hsl(var(--success))]/40">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Opgeslagen
            </Badge>
          )}
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
        </div>
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3" />
          Nog invullen tot {formatPollDeadline(poll.end_date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {poll.allow_multiple ? (
          <div className="space-y-2">
            {poll.options.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px]",
                  selectedIds.includes(opt.id)
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:bg-muted/30",
                  pending && "opacity-70 pointer-events-none",
                )}
              >
                <Checkbox
                  checked={selectedIds.includes(opt.id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(opt.id, checked === true)
                  }
                  disabled={pending}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <RadioGroup
            value={selectedIds[0] ?? ""}
            onValueChange={handleRadioChange}
            disabled={pending}
            className="space-y-2"
          >
            {poll.options.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px]",
                  selectedIds[0] === opt.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:bg-muted/30",
                  pending && "opacity-70 pointer-events-none",
                )}
              >
                <RadioGroupItem value={opt.id} id={`poll-${poll.id}-${opt.id}`} />
                <Label
                  htmlFor={`poll-${poll.id}-${opt.id}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {opt.label}
                </Label>
              </label>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
