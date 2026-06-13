import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  BarChart3,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPollDeadline,
  getRoleLabel,
  type ProfilePollAdmin,
} from "@/services/profilePoll/profilePollService";
import { ProfilePollQuestionText } from "./ProfilePollQuestionText";
import { parsePollQuestion, formatPollOptionDisplay, sortPollOptionsForDisplay, getInlineNoteForOption, getPollResponseSelectionLines, buildPollOptionDisplayNumberMap } from "./profilePollQuestionUtils";

interface ProfilePollResultsCardProps {
  poll: ProfilePollAdmin;
  onClose: (pollId: number) => Promise<void>;
  onDelete: (pollId: number) => Promise<void>;
  isClosing?: boolean;
  isDeleting?: boolean;
}

export function ProfilePollResultsCard({
  poll,
  onClose,
  onDelete,
  isClosing,
  isDeleting,
}: ProfilePollResultsCardProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const { stats } = poll;
  const total = Math.max(stats.eligible_count, 1);
  const responseRate = Math.round((stats.responded_count / total) * 100);
  const parsedQuestion = parsePollQuestion(poll.question);
  const sortedOptions = sortPollOptionsForDisplay(poll.options);
  const optionDisplayNumbers = useMemo(
    () => buildPollOptionDisplayNumberMap(poll.options),
    [poll.options],
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-primary/15 bg-card overflow-hidden",
        "shadow-sm transition-[box-shadow,border-color] duration-200",
        "hover:border-primary/30 hover:shadow-md motion-safe:hover:shadow-md",
        !poll.is_active && "opacity-95",
      )}
    >
      <div className="p-4 sm:p-5 space-y-4 min-w-0">
        <header className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {poll.is_active ? (
              <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                Actief
              </Badge>
            ) : poll.status === "closed" ? (
              <Badge variant="secondary">Gesloten</Badge>
            ) : (
              <Badge variant="outline">Verlopen</Badge>
            )}
            {poll.target_roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>

          <div className="min-w-0 space-y-2">
            {poll.title ? (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground break-words">
                {poll.title === "⚽ Nieuw speelmoment minivoetbal – Stem mee!" ? "⚽ Nieuw speelmoment – Stem mee!" : poll.title}
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
              <span className="break-words">Deadline: {formatPollDeadline(poll.end_date)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span className="tabular-nums">
                <strong className="text-foreground">{stats.responded_count}</strong> /{" "}
                {stats.eligible_count} ingevuld ({responseRate}%)
              </span>
            </span>
          </div>
        </header>

        <section
          aria-label="Resultaten per optie"
          className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-3 min-w-0"
        >
          {sortedOptions.map((opt, index) => {
            const count = stats.option_counts[opt.id] ?? 0;
            const pct = Math.round((count / total) * 100);
            const displayNumber = optionDisplayNumbers.get(opt.id) ?? index + 1;
            const formatted = formatPollOptionDisplay(
              displayNumber - 1,
              opt.label,
              getInlineNoteForOption(opt.label, parsedQuestion.inlineOptions),
            );
            const barWidth = count > 0 ? Math.max(pct, 8) : 0;

            return (
              <div
                key={opt.id}
                className="rounded-lg border border-border/50 bg-background/70 p-3 space-y-2.5 min-w-0"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-sm font-bold tabular-nums text-primary leading-snug"
                  >
                    {displayNumber}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug break-words text-foreground">
                      {formatted.bodyLine}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="relative h-2.5 flex-1 min-w-0 rounded-full bg-muted/80 border border-border/40 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${formatted.displayLine}: ${count} stemmen (${pct}%)`}
                  >
                    <div
                      className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs sm:text-sm tabular-nums text-muted-foreground whitespace-nowrap">
                    {count} ({pct}%)
                  </span>
                </div>

                {formatted.detailNote ? (
                  <p className="text-[11px] sm:text-xs leading-snug break-words text-[var(--color-400)]">
                    {formatted.detailNote}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>

        <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-between min-h-[44px]",
                "border-border/60 bg-background/60 text-muted-foreground",
                "hover:text-foreground hover:border-primary/30 hover:bg-primary/5",
              )}
            >
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="h-4 w-4 shrink-0" />
                Wie heeft ingevuld?
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 motion-safe:transition-transform motion-safe:duration-200",
                  participantsOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3 min-w-0">
            {stats.responded.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-background/50 p-3 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <UserCheck className="h-3 w-3 shrink-0" />
                  Ingevuld ({stats.responded.length})
                </p>
                <ul className="space-y-2">
                  {stats.responded.map((r) => (
                    <li
                      key={r.user_id}
                      className="text-xs sm:text-sm py-2 border-b border-border/40 last:border-0 last:pb-0 min-w-0"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <span className="min-w-0 break-words">
                          <span className="font-medium text-foreground">{r.username}</span>{" "}
                          <span className="text-muted-foreground">
                            ({getRoleLabel(r.role)})
                          </span>
                        </span>
                        <div className="flex flex-col gap-0.5 sm:items-end sm:max-w-[55%] min-w-0">
                          {getPollResponseSelectionLines(
                            r.option_labels,
                            r.option_ids,
                            poll.options,
                          ).map((line, lineIndex) => (
                            <span
                              key={`${line}-${lineIndex}`}
                              className="text-[11px] sm:text-xs leading-snug break-words text-[var(--color-400)]"
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.pending.length > 0 && (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <UserX className="h-3 w-3 shrink-0" />
                  Nog open ({stats.pending.length})
                </p>
                <ul className="flex flex-wrap gap-2">
                  {stats.pending.map((p) => (
                    <li
                      key={p.user_id}
                      className="text-xs sm:text-sm text-muted-foreground rounded-md border border-border/50 bg-background px-2 py-1 break-words"
                    >
                      {p.username} ({getRoleLabel(p.role)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <footer className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border/40">
          {poll.is_active && poll.status === "open" && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] flex-1 border-border/60 hover:border-primary/30 hover:bg-primary/5"
              disabled={isClosing}
              onClick={() => void onClose(poll.id)}
            >
              <Lock className="h-4 w-4 mr-2 shrink-0" />
              Sluiten
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            disabled={isDeleting}
            onClick={() => void onDelete(poll.id)}
          >
            <Trash2 className="h-4 w-4 mr-2 shrink-0" />
            Verwijderen
          </Button>
        </footer>
      </div>
    </article>
  );
}
