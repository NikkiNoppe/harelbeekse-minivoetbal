import React, { useMemo } from "react";
import { Trophy } from "lucide-react";
import type { ArchivedStanding } from "@/services/archiveService";
import { groupStandingsByDivision } from "@/lib/archiveManualUtils";
import { cn } from "@/lib/utils";

interface Props {
  standings: ArchivedStanding[];
}

const THEME = {
  shellBorder: "border-brand-200",
  headerBg: "bg-gradient-to-r from-brand-50 via-brand-100 to-brand-50",
  headerText: "text-brand-900",
  rowDivider: "divide-brand-100",
  posDefault: "bg-brand-100 text-brand-800",
  posFirst: "bg-yellow-100 text-yellow-800",
} as const;

function StandingsTable({
  rows,
  caption,
}: {
  rows: ArchivedStanding[];
  caption: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border shadow-lg transition-shadow duration-300 card-hover hover:shadow-xl",
        THEME.shellBorder,
      )}
    >
      <div className={cn("px-3 py-2.5 sm:px-4", THEME.headerBg, THEME.headerText)}>
        <p className="text-xs font-semibold uppercase tracking-wider">{caption}</p>
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
          <tbody className={cn("divide-y", THEME.rowDivider)}>
            {rows.map((row) => (
              <tr
                key={`${row.division ?? ""}-${row.position}-${row.team_name}`}
                className="min-h-[44px]"
              >
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      row.position === 1 ? THEME.posFirst : THEME.posDefault,
                    )}
                  >
                    {row.position}
                  </span>
                </td>
                <td className="py-2.5 px-2 font-medium text-[var(--color-700)]">
                  <span className="line-clamp-2 sm:truncate">{row.team_name}</span>
                </td>
                <td className="py-2.5 px-3 text-center font-bold tabular-nums text-[var(--color-700)]">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const StandingsArchiveCard: React.FC<Props> = ({ standings }) => {
  const groups = useMemo(() => groupStandingsByDivision(standings), [standings]);
  const multiDivision = groups.length > 1 || Boolean(groups[0]?.division);

  return (
    <section role="region" aria-labelledby="archive-standings-heading">
      <h2
        id="archive-standings-heading"
        className="text-lg font-semibold text-[var(--color-700)] mb-3 flex items-center gap-2"
      >
        <Trophy className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
        Eindklassement
      </h2>
      {!standings?.length ? (
        <div
          className={cn(
            "w-full overflow-hidden rounded-lg border shadow-lg transition-shadow duration-300 card-hover hover:shadow-xl",
            THEME.shellBorder,
          )}
        >
          <div className={cn("px-3 py-2.5 sm:px-4", THEME.headerBg, THEME.headerText)}>
            <p className="text-xs font-semibold uppercase tracking-wider">Eindstand</p>
          </div>
          <div className="bg-white px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Geen klassement gearchiveerd voor dit seizoen.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <StandingsTable
              key={group.division ?? `undivided-${index}`}
              rows={group.standings}
              caption={
                multiDivision && group.division
                  ? group.division
                  : multiDivision
                    ? "Klassement"
                    : "Eindstand"
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default StandingsArchiveCard;
