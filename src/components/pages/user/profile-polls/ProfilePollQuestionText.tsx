import React from "react";
import { cn } from "@/lib/utils";
import {
  parsePollQuestion,
  formatPollOptionDisplay,
  formatParsedOptionLine,
  type ParsedPollOptionLine,
} from "./profilePollQuestionUtils";

interface ProfilePollQuestionTextProps {
  question: string;
  introClassName?: string;
  optionClassName?: string;
  compact?: boolean;
}

function OptionLine({
  line,
  index,
  compact,
  className,
}: {
  line: ParsedPollOptionLine;
  index: number;
  compact?: boolean;
  className?: string;
}) {
  const formatted = formatParsedOptionLine(index, line);

  return (
    <p
      className={cn(
        "min-w-0 break-words text-foreground leading-snug",
        compact ? "text-[13px] sm:text-sm" : "text-sm sm:text-base",
        className,
      )}
    >
      {formatted.displayLine}
    </p>
  );
}

export function PollOptionLabelText({
  label,
  index = 0,
  emphasized = false,
}: {
  label: string;
  index?: number;
  emphasized?: boolean;
}) {
  const formatted = formatPollOptionDisplay(index, label);

  return (
    <span
      className={cn(
        "min-w-0 flex-1 break-words leading-snug",
        emphasized ? "font-semibold text-foreground" : "font-medium text-foreground/90",
      )}
    >
      {formatted.displayLine}
    </span>
  );
}

export function ProfilePollQuestionText({
  question,
  introClassName,
  optionClassName,
  compact = false,
}: ProfilePollQuestionTextProps) {
  const parsed = parsePollQuestion(question);

  if (!parsed.hasInlineOptions) {
    return (
      <p
        className={cn(
          "font-semibold leading-snug break-words text-foreground",
          compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
          introClassName,
        )}
      >
        {parsed.intro}
      </p>
    );
  }

  return (
    <div className="space-y-2 min-w-0">
      {parsed.intro ? (
        <p
          className={cn(
            "font-semibold leading-snug break-words text-foreground",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
            introClassName,
          )}
        >
          {parsed.intro}
        </p>
      ) : null}
      <div className={cn("space-y-2", optionClassName)}>
        {parsed.inlineOptions.map((line, index) => (
          <OptionLine key={`${line.letter}-${index}`} line={line} index={index} compact={compact} />
        ))}
      </div>
    </div>
  );
}
