import React from "react";
import { Medal, Target, Trophy } from "lucide-react";
import type { ArchivedPlayoff, ArchivedPlayoffRanking } from "@/services/archiveService";
import { cn } from "@/lib/utils";

interface Props {
  entry: ArchivedPlayoff | null;
}

type PlayoffVariant = "po1" | "po2";

const VARIANT_THEME = {
  po1: {
    shellBorder: "border-yellow-300/60",
    headerBg: "bg-gradient-to-r from-yellow-50 via-amber-100 to-yellow-100",
    headerText: "text-yellow-950",
    icon: "text-yellow-700",
    rowDivider: "divide-yellow-100/80",
    posDefault: "bg-yellow-100/80 text-yellow-900",
    posFirst: "bg-yellow-300 text-yellow-950",
  },
  po2: {
    shellBorder: "border-slate-300",
    headerBg: "bg-gradient-to-r from-slate-100 via-zinc-200 to-slate-200",
    headerText: "text-slate-900",
    icon: "text-slate-600",
    rowDivider: "divide-slate-200",
    posDefault: "bg-slate-100 text-slate-800",
    posFirst: "bg-slate-300 text-slate-950",
  },
} satisfies Record<
  PlayoffVariant,
  {
    shellBorder: string;
    headerBg: string;
    headerText: string;
    icon: string;
    rowDivider: string;
    posDefault: string;
    posFirst: string;
  }
>;

const PlayoffRankingSection: React.FC<{
  variant: PlayoffVariant;
  title: string;
  headingId: string;
  rows: ArchivedPlayoffRanking[];
}> = ({ variant, title, headingId, rows }) => {
  const theme = VARIANT_THEME[variant];
  const Icon = variant === "po1" ? Trophy : Medal;

  if (!rows.length) {
    return (
      <section role="region" aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="text-lg font-semibold text-[var(--color-700)] mb-3 flex items-center gap-2"
        >
          <Icon className={cn("w-5 h-5 shrink-0", theme.icon)} aria-hidden="true" />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Geen {title.toLowerCase()}-klassement gearchiveerd.
        </p>
      </section>
    );
  }

  return (
    <section role="region" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-lg font-semibold text-[var(--color-700)] mb-3 flex items-center gap-2"
      >
        <Icon className={cn("w-5 h-5 shrink-0", theme.icon)} aria-hidden="true" />
        {title}
      </h2>
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border shadow-lg transition-shadow duration-300 card-hover hover:shadow-xl",
          theme.shellBorder,
        )}
      >
        <div className={cn("px-3 py-2.5 sm:px-4", theme.headerBg, theme.headerText)}>
          <p className="text-xs font-semibold uppercase tracking-wider">Eindstand</p>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[16rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs text-muted-foreground">
                <th scope="col" className="w-12 py-2 px-3 text-center font-medium">
                  #
                </th>
                <th scope="col" className="py-2 px-2 text-left font-medium">
                  Team
                </th>
                <th scope="col" className="w-16 py-2 px-3 text-center font-medium">
                  Ptn
                </th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme.rowDivider)}>
              {rows.map((row) => (
                <tr key={`${variant}-${row.position}`} className="min-h-[44px]">
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        row.position === 1 ? theme.posFirst : theme.posDefault,
                      )}
                    >
                      {row.position}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-medium text-[var(--color-700)]">
                    <span className="line-clamp-2 sm:truncate">{row.team_name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold tabular-nums text-[var(--color-700)]">
                    {row.total_points ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const PlayoffArchiveCard: React.FC<Props> = ({ entry }) => {
  const hasPo1 = (entry?.top_ranking?.length ?? 0) > 0;
  const hasPo2 = (entry?.bottom_ranking?.length ?? 0) > 0;

  if (!entry || (!hasPo1 && !hasPo2)) {
    return (
      <section role="region" aria-labelledby="archive-playoffs-heading">
        <h2
          id="archive-playoffs-heading"
          className="text-lg font-semibold text-[var(--color-700)] mb-3 flex items-center gap-2"
        >
          <Target className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          Play-offs
        </h2>
        <p className="text-sm text-muted-foreground">
          Geen play-off-archief voor dit seizoen.
        </p>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <PlayoffRankingSection
        variant="po1"
        title="Play-Off 1"
        headingId="archive-po1-heading"
        rows={entry.top_ranking ?? []}
      />
      <PlayoffRankingSection
        variant="po2"
        title="Play-Off 2"
        headingId="archive-po2-heading"
        rows={entry.bottom_ranking ?? []}
      />
      {entry.notes && (
        <p className="text-xs text-muted-foreground italic md:col-span-2">{entry.notes}</p>
      )}
    </div>
  );
};

export default PlayoffArchiveCard;
