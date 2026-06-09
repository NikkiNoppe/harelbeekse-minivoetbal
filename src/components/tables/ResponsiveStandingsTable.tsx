import React from "react";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Rij in de competitiestand — herbruikbaar in hooks/pagina's */
export interface StandingsTeamRow {
  id: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDiff: number;
  points: number;
}

export interface ResponsiveStandingsTableProps {
  teams?: StandingsTeamRow[];
  isLoading?: boolean;
  /** Tabel als card: volle breedte, shadow, geen dubbele padding */
  embeddedInCard?: boolean;
}

/** Stat-kolommen tussen Team en Ptn (volgorde = tabel) */
const STAT_COLUMNS = [
  { id: "wed", label: "Wed", width: "w-10", dividerBefore: true },
  { id: "w", label: "W", width: "w-9" },
  { id: "g", label: "G", width: "w-9" },
  { id: "v", label: "V", width: "w-9" },
  { id: "saldo", label: "+/-", width: "w-10", dividerBefore: true },
] as const;

/**
 * Tailwind tokens — responsive gedrag in index.css (.responsive-standings-table).
 * Blauwe body-tekst: Team, W/G (incl. 0), +/-, Ptn — zie index.css.
 */
const S = {
  border: "border-primary/30 border-purple-light",
  row: "standings-row-divider",
  colDivider: "standings-col-divider",
  scrollWrap:
    "responsive-standings-table standings-scroll-wrap overflow-x-auto border",
  table:
    "w-full min-w-0 lg:min-w-[20rem] border-collapse text-sm standings-table-fit",
  headerCell:
    "standings-header-cell py-2 px-1.5 sm:px-2 text-center font-medium text-xs",
  statCell: "py-2.5 px-1.5 sm:px-2 text-center tabular-nums",
  teamCell:
    "py-2.5 px-1.5 sm:px-2 text-left font-medium standings-sticky-team standings-sticky-bg standings-team-col lg:min-w-[9rem]",
  embeddedWrap:
    "w-full max-w-none rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover overflow-hidden",
  standaloneWrap: "rounded-md",
} as const;

function scrollWrapClass(embeddedInCard?: boolean) {
  return cn(
    S.scrollWrap,
    S.border,
    embeddedInCard ? S.embeddedWrap : S.standaloneWrap,
  );
}

function legendClass(embeddedInCard?: boolean, extra?: string) {
  return cn(embeddedInCard && "px-4 pb-3 pt-2", extra);
}

function statHeaderClass(
  col: (typeof STAT_COLUMNS)[number],
) {
  return cn(
    S.headerCell,
    col.width,
    "standings-scroll-stats",
    col.dividerBefore && S.colDivider,
  );
}

function StandingsHeader() {
  return (
    <thead>
      <tr className={S.row}>
        <th scope="col" className={cn(S.headerCell, "w-9 standings-sticky-pos")}>
          #
        </th>
        <th
          scope="col"
          className={cn(
            S.headerCell,
            "standings-sticky-team standings-team-col text-left",
            S.colDivider,
          )}
        >
          Team
        </th>
        {STAT_COLUMNS.map((col) => (
          <th key={col.id} scope="col" className={statHeaderClass(col)}>
            {col.label}
          </th>
        ))}
        <th
          scope="col"
          className={cn(
            S.headerCell,
            "w-11 pr-2 sm:pr-3 font-semibold standings-sticky-ptn",
            S.colDivider,
          )}
        >
          Ptn
        </th>
      </tr>
    </thead>
  );
}

function StandingsRow({
  team,
  index,
}: {
  team: StandingsTeamRow;
  index: number;
}) {
  const position = index + 1;
  const isEven = index % 2 === 1;
  const rowBg = isEven ? "bg-muted/20" : "bg-background";
  const stickyBg = cn(rowBg, "group-hover:bg-primary/5");

  return (
    <tr
      className={cn(
        "group last:border-b-0 transition-colors",
        S.row,
        rowBg,
        "hover:bg-primary/5",
      )}
    >
      <td
        className={cn(
          S.statCell,
          "w-9 text-muted-foreground font-medium standings-sticky-pos standings-sticky-bg",
          stickyBg,
        )}
      >
        {position}
      </td>
      <td className={cn(S.teamCell, S.colDivider, stickyBg)}>
        <span className="standings-team-name leading-snug break-words">
          {team.name}
        </span>
      </td>
      <td
        className={cn(
          S.statCell,
          "w-10 text-muted-foreground standings-scroll-stats",
          S.colDivider,
        )}
      >
        {team.played}
      </td>
      <td
        className={cn(
          S.statCell,
          "w-9 standings-w-cell standings-scroll-stats",
          team.won > 0 && "text-success font-medium",
        )}
      >
        {team.won}
      </td>
      <td
        className={cn(
          S.statCell,
          "w-9 standings-g-cell standings-scroll-stats",
          team.draw > 0 && "text-warning font-medium",
        )}
      >
        {team.draw}
      </td>
      <td
        className={cn(
          S.statCell,
          "w-9 font-medium standings-lost standings-scroll-stats",
        )}
      >
        {team.lost}
      </td>
      <td
        className={cn(
          S.statCell,
          "w-10 font-medium standings-saldo-cell standings-scroll-stats",
          S.colDivider,
        )}
      >
        {team.goalDiff > 0 ? "+" : ""}
        {team.goalDiff}
      </td>
      <td
        className={cn(
          S.statCell,
          "w-11 pr-2 sm:pr-3 font-bold text-lg sm:text-sm standings-ptn-cell standings-sticky-ptn standings-sticky-bg",
          isEven ? rowBg : "bg-primary/5",
          S.colDivider,
          stickyBg,
        )}
      >
        {team.points}
      </td>
    </tr>
  );
}

function StandingsSkeleton({ embeddedInCard }: { embeddedInCard?: boolean }) {
  return (
    <div
      className={scrollWrapClass(embeddedInCard)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <table className={S.table}>
        <StandingsHeader />
        <tbody>
          {Array.from({ length: 8 }, (_, i) => (
            <tr key={i} className={S.row}>
              <td className="w-9 py-2.5 standings-sticky-pos standings-sticky-bg">
                <Skeleton className="h-4 w-4 mx-auto bg-muted" />
              </td>
              <td className={cn(S.teamCell, S.colDivider, "py-2.5 pr-2")}>
                <Skeleton className="h-4 w-full max-w-[10rem] bg-muted" />
              </td>
              {STAT_COLUMNS.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    "py-2.5 standings-scroll-stats",
                    col.dividerBefore && S.colDivider,
                  )}
                >
                  <Skeleton className="h-4 w-5 mx-auto bg-muted" />
                </td>
              ))}
              <td
                className={cn(
                  "py-2.5 pr-2 sm:pr-3 standings-sticky-ptn standings-sticky-bg",
                  S.colDivider,
                )}
              >
                <Skeleton className="h-5 w-6 mx-auto bg-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileScrollHint({ embeddedInCard }: { embeddedInCard?: boolean }) {
  return (
    <p
      className={legendClass(
        embeddedInCard,
        "mt-0 px-2 py-1 text-xs text-muted-foreground flex items-center justify-center gap-1.5 sm:hidden",
      )}
      aria-hidden="true"
    >
      <ChevronRight
        className="w-3.5 h-3.5 shrink-0 text-primary/70 motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <span>Veeg voor Wed, W, G, V en +/-</span>
      <ChevronRight
        className="w-3.5 h-3.5 shrink-0 text-primary/70 motion-safe:animate-pulse"
        aria-hidden="true"
      />
    </p>
  );
}

function DesktopLegend({ embeddedInCard }: { embeddedInCard?: boolean }) {
  return (
    <p
      className={legendClass(
        embeddedInCard,
        "mt-0 px-1 text-xs text-muted-foreground text-center leading-relaxed hidden sm:block",
      )}
    >
      Wed = Gespeeld • W = Winst • G = Gelijk • V = Verlies • +/- = Doelsaldo •
      Ptn = Punten
    </p>
  );
}

const ResponsiveStandingsTable: React.FC<ResponsiveStandingsTableProps> = ({
  teams,
  isLoading,
  embeddedInCard,
}) => {
  if (isLoading) {
    return <StandingsSkeleton embeddedInCard={embeddedInCard} />;
  }

  if (!teams?.length) {
    return (
      <div
        className={cn(
          "text-center py-8 text-sm text-muted-foreground",
          embeddedInCard && "px-4",
        )}
      >
        Geen teams beschikbaar
      </div>
    );
  }

  return (
    <div className={cn(embeddedInCard && "w-full max-w-none")}>
      <div className="standings-scroll-hint relative w-full">
        <div
          className={scrollWrapClass(embeddedInCard)}
          role="table"
          aria-label="Competitiestand"
        >
          <table className={S.table}>
            <StandingsHeader />
            <tbody>
              {teams.map((team, index) => (
                <StandingsRow key={team.id} team={team} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <MobileScrollHint embeddedInCard={embeddedInCard} />
      <DesktopLegend embeddedInCard={embeddedInCard} />
    </div>
  );
};

export default ResponsiveStandingsTable;
