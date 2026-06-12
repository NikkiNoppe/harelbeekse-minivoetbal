import React from "react";
import { Award, Trophy } from "lucide-react";
import type { ArchivedCupRound, ArchivedCupWinner } from "@/services/archiveService";
import { resolveCupArchiveRounds } from "@/services/archiveService";
import { cn } from "@/lib/utils";

interface Props {
  cup: ArchivedCupWinner | null;
}

const CUP_THEME = {
  shellBorder: "border-amber-950/30",
  headerBg: "bg-gradient-to-r from-amber-950 via-amber-900 to-yellow-950",
  headerText: "text-white",
  rowDivider: "divide-amber-100/80",
  icon: "text-amber-700",
} as const;

const FINAL_THEME = {
  shellBorder: "border-amber-950/40",
  headerBg: "bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-950",
  headerText: "text-white",
  rowDivider: "divide-amber-100/80",
  icon: "text-amber-700",
} as const;

function hasScores(round: ArchivedCupRound): boolean {
  return round.home_score !== null && round.away_score !== null;
}

const CupMatchRow: React.FC<{
  round: ArchivedCupRound;
  highlightWinner?: boolean;
  compact?: boolean;
}> = ({ round, highlightWinner = false, compact = false }) => {
  const homeWon =
    highlightWinner && round.winner && round.winner === round.home_team;
  const awayWon =
    highlightWinner && round.winner && round.winner === round.away_team;
  const scored = hasScores(round);

  return (
    <div className={cn(compact ? "px-3 py-2 sm:px-4" : "px-4 py-3.5 sm:px-5")}>
      {!compact && (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {round.label}
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2.5 sm:gap-x-3">
        <span
          className={cn(
            "text-sm font-medium leading-tight text-left line-clamp-2 sm:truncate text-[var(--color-700)]",
            homeWon && "font-bold text-amber-900",
          )}
        >
          {round.home_team}
        </span>
        <div
          className={cn(
            "flex min-w-[4rem] shrink-0 items-center justify-center gap-1 tabular-nums",
            scored ? "text-sm font-bold text-[var(--color-700)]" : "text-sm text-muted-foreground",
          )}
          aria-label={scored ? `Uitslag ${round.home_score} tegen ${round.away_score}` : "Nog niet gespeeld"}
        >
          {scored ? (
            <>
              <span className="min-w-[1.1rem] text-center">{round.home_score}</span>
              <span className="font-normal text-muted-foreground">–</span>
              <span className="min-w-[1.1rem] text-center">{round.away_score}</span>
            </>
          ) : (
            <span>vs</span>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium leading-tight text-right line-clamp-2 sm:truncate text-[var(--color-700)]",
            awayWon && "font-bold text-amber-900",
          )}
        >
          {round.away_team}
        </span>
      </div>
    </div>
  );
};

const CupMatchTable: React.FC<{
  rounds: ArchivedCupRound[];
  emptyMessage: string;
  theme: typeof CUP_THEME | typeof FINAL_THEME;
  headerLabel: string;
  highlightWinner?: boolean;
}> = ({ rounds, emptyMessage, theme, headerLabel, highlightWinner = false }) => {
  if (!rounds.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const compact = rounds.length === 1;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border shadow-lg transition-shadow duration-300 card-hover hover:shadow-xl",
        !compact && "h-full",
        theme.shellBorder,
      )}
    >
      <div
        className={cn(
          "shrink-0 px-3 sm:px-4",
          compact ? "py-2" : "py-2.5",
          theme.headerBg,
          theme.headerText,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-white">{headerLabel}</p>
      </div>
      <div className={cn("bg-white", !compact && "flex-1 divide-y", theme.rowDivider)}>
        {rounds.map((round, index) => (
          <CupMatchRow
            key={`${round.label}-${index}`}
            round={round}
            highlightWinner={highlightWinner}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

const CupRoundSection: React.FC<{
  title: string;
  headingId: string;
  headerLabel: string;
  rounds: ArchivedCupRound[];
  emptyMessage: string;
  theme: typeof CUP_THEME | typeof FINAL_THEME;
  icon: typeof Award | typeof Trophy;
  highlightWinner?: boolean;
}> = ({
  title,
  headingId,
  headerLabel,
  rounds,
  emptyMessage,
  theme,
  icon: Icon,
  highlightWinner,
}) => {
  const compact = rounds.length === 1;

  return (
  <section role="region" aria-labelledby={headingId} className={cn("flex flex-col", !compact && "h-full")}>
    <h2
      id={headingId}
      className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-700)]"
    >
      <Icon className={cn("h-5 w-5 shrink-0", theme.icon)} aria-hidden="true" />
      {title}
    </h2>
    <CupMatchTable
      rounds={rounds}
      emptyMessage={emptyMessage}
      theme={theme}
      headerLabel={headerLabel}
      highlightWinner={highlightWinner}
    />
  </section>
  );
};

const CupArchiveCard: React.FC<Props> = ({ cup }) => {
  const { semiFinals, final } = resolveCupArchiveRounds(cup);
  const hasSemi = semiFinals.length > 0;
  const hasFinal = !!final;
  const hasData = hasSemi || hasFinal;

  if (!hasData) {
    return (
      <section role="region" aria-labelledby="archive-cup-heading">
        <h2
          id="archive-cup-heading"
          className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-700)]"
        >
          <Award className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          Beker
        </h2>
        <p className="text-sm text-muted-foreground">
          Geen bekerwedstrijden gearchiveerd voor dit seizoen.
        </p>
      </section>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-6",
        hasSemi && hasFinal && "md:grid-cols-2",
      )}
    >
      {hasSemi && (
        <CupRoundSection
          title="Halve finales"
          headingId="archive-cup-semi-heading"
          headerLabel="Halve finales"
          rounds={semiFinals}
          emptyMessage="Geen halve finales gearchiveerd."
          theme={CUP_THEME}
          icon={Award}
          highlightWinner
        />
      )}
      {hasFinal && (
        <CupRoundSection
          title="Finale"
          headingId="archive-cup-final-heading"
          headerLabel="Bekerfinale"
          rounds={[final]}
          emptyMessage="Geen bekerfinale gearchiveerd."
          theme={FINAL_THEME}
          icon={Trophy}
          highlightWinner
        />
      )}
    </div>
  );
};

export default CupArchiveCard;
