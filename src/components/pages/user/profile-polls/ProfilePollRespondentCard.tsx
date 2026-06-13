import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertCircle, CalendarClock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfilePollQuestionText } from "./ProfilePollQuestionText";

import {
  parsePollQuestion,
  sortPollOptionsForDisplay,
  formatPollOptionDisplay,
  getInlineNoteForOption,
  buildPollOptionDisplayNumberMap,
} from "./profilePollQuestionUtils";
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

function PollOptionRow({
  pollId,
  optId,
  displayNumber,
  bodyLine,
  detailNote,
  checked,
  pending,
  allowMultiple,
  onToggle,
}: {
  pollId: number;
  optId: string;
  displayNumber: number;
  bodyLine: string;
  detailNote: string | null;
  checked: boolean;
  pending: boolean;
  allowMultiple: boolean;
  onToggle: (optionId: string, checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role={allowMultiple ? "checkbox" : "radio"}
      aria-checked={checked}
      aria-label={bodyLine}
      disabled={pending}
      onClick={() => onToggle(optId, !checked)}
      className={cn(
        "group relative w-full h-full text-left rounded-lg border p-3 flex flex-col gap-2 min-w-0",
        "cursor-pointer select-none transition-all duration-200",
        "min-h-[64px] active:scale-[0.99] motion-safe:active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40"
          : "border-border/60 bg-background/70 hover:border-primary/40 hover:bg-background",
        pending && "opacity-70 pointer-events-none",
      )}
    >
      {checked ? (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary shadow-sm"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : null}

      <div className="flex items-start gap-2 min-w-0 pr-6">
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 text-sm font-bold tabular-nums leading-snug",
            checked ? "text-primary-foreground/90" : "text-primary",
          )}
        >
          {displayNumber}.
        </span>
        <p
          className={cn(
            "text-sm leading-snug break-words flex-1",
            checked ? "font-semibold" : "font-medium text-foreground",
          )}
        >
          {bodyLine}
        </p>
      </div>

      {detailNote ? (
        <p
          className={cn(
            "text-[11px] sm:text-xs leading-snug break-words pl-6 sm:pl-7 mt-auto",
            checked ? "text-primary-foreground/80" : "text-[var(--color-400)]",
          )}
        >
          {detailNote}
        </p>
      ) : null}
    </button>
  );
}


export function ProfilePollRespondentCard({ poll }: ProfilePollRespondentCardProps) {
  const queryClient = useQueryClient();
  const initialIds = poll.my_response?.option_ids ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(!!poll.my_response);
  const [error, setError] = useState<string | null>(null);

  const parsedQuestion = parsePollQuestion(poll.question);
  const sortedOptions = sortPollOptionsForDisplay(poll.options);
  const optionDisplayNumbers = useMemo(
    () => buildPollOptionDisplayNumberMap(poll.options),
    [poll.options],
  );

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

  const handleToggle = (optionId: string, checked: boolean) => {
    if (!poll.allow_multiple) {
      setSelectedIds([optionId]);
      void saveResponse([optionId]);
      return;
    }
    const next = checked
      ? [...selectedIds, optionId]
      : selectedIds.filter((id) => id !== optionId);
    setSelectedIds(next);
    if (next.length > 0) {
      void saveResponse(next);
    }
  };

  const renderOption = (opt: (typeof sortedOptions)[number], index: number) => {
    const displayNumber = optionDisplayNumbers.get(opt.id) ?? index + 1;
    const formatted = formatPollOptionDisplay(
      displayNumber - 1,
      opt.label,
      getInlineNoteForOption(opt.label, parsedQuestion.inlineOptions),
    );
    const checked = poll.allow_multiple
      ? selectedIds.includes(opt.id)
      : selectedIds[0] === opt.id;

    return (
      <PollOptionRow
        key={opt.id}
        pollId={poll.id}
        optId={opt.id}
        displayNumber={displayNumber}
        bodyLine={formatted.bodyLine}
        detailNote={formatted.detailNote}
        checked={checked}
        pending={pending}
        allowMultiple={poll.allow_multiple}
        onToggle={handleToggle}
      />
    );
  };


  return (
    <article
      className={cn(
        "rounded-xl border border-primary/15 bg-card overflow-hidden",
        "shadow-sm transition-[box-shadow,border-color] duration-200",
        "hover:border-primary/30 hover:shadow-md motion-safe:hover:shadow-md",
      )}
    >
      <div className="p-4 sm:p-5 space-y-4 min-w-0">
        <header className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-h-[20px]">
            {saved && !pending && (
              <Badge
                variant="outline"
                className="text-[hsl(var(--success))] border-[hsl(var(--success))]/40"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Opgeslagen
              </Badge>
            )}
            {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="min-w-0 space-y-2">
            {poll.title ? (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground break-words">
                {poll.title}
              </p>
            ) : null}
            {parsedQuestion.intro ? (
              <p className="font-semibold leading-snug break-words text-foreground text-sm sm:text-base">
                {parsedQuestion.intro}
              </p>
            ) : !parsedQuestion.hasInlineOptions && poll.question ? (
              <ProfilePollQuestionText question={poll.question} compact />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span className="break-words">
                Nog invullen tot {formatPollDeadline(poll.end_date)}
              </span>
            </span>
            {poll.allow_multiple ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Meerdere antwoorden mogelijk
              </span>
            ) : null}
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section
          aria-label="Beschikbare opties"
          className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 min-w-0"
        >
          <div
            role={poll.allow_multiple ? "group" : "radiogroup"}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr min-w-0"
          >
            {sortedOptions.map((opt, index) => renderOption(opt, index))}
          </div>
        </section>

      </div>
    </article>
  );
}
