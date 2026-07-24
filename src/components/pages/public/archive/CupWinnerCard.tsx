import React, { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Medal, Trophy } from "lucide-react";
import type {
  ArchivedCupWinner,
  ArchivedPlayoff,
  ArchivedPlayoffRanking,
  ArchivedStanding,
} from "@/services/archiveService";
import {
  archiveHasCup,
  archiveHasPlayoff,
  groupStandingsByDivision,
} from "@/lib/archiveManualUtils";
import { cn } from "@/lib/utils";

interface Props {
  cup: ArchivedCupWinner | null;
  playoff: ArchivedPlayoff | null;
  standings?: ArchivedStanding[] | null;
}

type WinnerThemeKey = "cup" | "po1" | "po2";

type WinnerTheme = {
  cardBorder: string;
  gradient: string;
  icon: string;
  label: string;
  title: string;
  runnerUp: string;
};

/** Winnaars-styling (beker / reeks1·PO1 / reeks2·PO2). */
export const ARCHIVE_WINNER_THEMES = {
  cup: {
    cardBorder: "border-amber-950/40",
    gradient: "bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-950",
    icon: "text-amber-300",
    label: "text-amber-200/90",
    title: "text-white",
    runnerUp: "text-amber-100/70",
  },
  po1: {
    cardBorder: "border-yellow-300/60",
    gradient: "bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-200",
    icon: "text-yellow-600",
    label: "text-yellow-800",
    title: "text-yellow-950",
    runnerUp: "text-yellow-900/65",
  },
  po2: {
    cardBorder: "border-slate-300",
    gradient: "bg-gradient-to-br from-slate-100 via-zinc-200 to-slate-300",
    icon: "text-slate-500",
    label: "text-slate-600",
    title: "text-slate-900",
    runnerUp: "text-slate-700/70",
  },
} satisfies Record<WinnerThemeKey, WinnerTheme>;

type WinnerSlot = {
  themeKey: WinnerThemeKey;
  label: string;
  winner: string;
  runnerUp?: string;
  useTrophyIcon?: boolean;
};

function teamAtPosition(
  rows: ArchivedPlayoffRanking[] | undefined,
  position: number,
): ArchivedPlayoffRanking | undefined {
  return rows?.find((r) => r.position === position);
}

function standingAtPosition(
  rows: ArchivedStanding[] | undefined,
  position: number,
): ArchivedStanding | undefined {
  return rows?.find((r) => r.position === position);
}

function reeksLabel(division: string | null, index: number): string {
  const name = division?.trim();
  if (name) return `Kampioen ${name}`;
  return index === 0 ? "Kampioen" : `Kampioen reeks ${index + 1}`;
}

function buildWinnerSlots(
  cup: ArchivedCupWinner | null,
  playoff: ArchivedPlayoff | null,
  standings: ArchivedStanding[] | null | undefined,
): WinnerSlot[] {
  const slots: WinnerSlot[] = [];

  if (archiveHasCup(cup)) {
    slots.push({
      themeKey: "cup",
      label: "Bekerwinnaar",
      winner: cup!.winner.trim(),
      runnerUp: cup!.runner_up?.trim() || undefined,
      useTrophyIcon: true,
    });
  }

  const hasPo = archiveHasPlayoff(playoff);
  const po1 = teamAtPosition(playoff?.top_ranking, 1);
  const po1Runner = teamAtPosition(playoff?.top_ranking, 2);
  const po2 = teamAtPosition(playoff?.bottom_ranking, 1);
  const po2Runner = teamAtPosition(playoff?.bottom_ranking, 2);

  const groups = groupStandingsByDivision(standings);
  const reeks1 = groups[0];
  const reeks2 = groups[1];
  const reeks1Champ = standingAtPosition(reeks1?.standings, 1);
  const reeks1Runner = standingAtPosition(reeks1?.standings, 2);
  const reeks2Champ = standingAtPosition(reeks2?.standings, 1);
  const reeks2Runner = standingAtPosition(reeks2?.standings, 2);

  // Gele kaart: play-off 1, anders kampioen reeks 1
  if (hasPo && po1?.team_name) {
    slots.push({
      themeKey: "po1",
      label: "Play-Off 1 winnaar",
      winner: po1.team_name,
      runnerUp: po1Runner?.team_name,
    });
  } else if (reeks1Champ?.team_name) {
    slots.push({
      themeKey: "po1",
      label: reeksLabel(reeks1.division, 0),
      winner: reeks1Champ.team_name,
      runnerUp: reeks1Runner?.team_name,
    });
  }

  // Grijze kaart: play-off 2, anders kampioen reeks 2 (alleen als er een 2e reeks is)
  if (hasPo && po2?.team_name) {
    slots.push({
      themeKey: "po2",
      label: "Play-Off 2 winnaar",
      winner: po2.team_name,
      runnerUp: po2Runner?.team_name,
    });
  } else if (reeks2Champ?.team_name) {
    slots.push({
      themeKey: "po2",
      label: reeksLabel(reeks2.division, 1),
      winner: reeks2Champ.team_name,
      runnerUp: reeks2Runner?.team_name,
    });
  }

  return slots;
}

const WinnerSection = memo(({
  themeKey,
  label,
  winner,
  runnerUp,
  useTrophyIcon = false,
}: WinnerSlot) => {
  const theme = ARCHIVE_WINNER_THEMES[themeKey];
  const Icon = useTrophyIcon ? Trophy : Medal;

  return (
    <Card
      className={cn("h-full overflow-hidden border-2 shadow-md", theme.cardBorder)}
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className={cn(
          "flex h-full min-h-[180px] flex-col items-center justify-center p-5 sm:min-h-[200px] sm:p-6 text-center",
          theme.gradient,
        )}
      >
        <Icon
          className={cn(
            "mx-auto mb-2 drop-shadow",
            useTrophyIcon ? "h-10 w-10 sm:h-12 sm:w-12" : "h-9 w-9 sm:h-10 sm:w-10",
            theme.icon,
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "text-xs uppercase tracking-widest font-semibold mb-1",
            theme.label,
          )}
        >
          {label}
        </div>
        <h3
          className={cn(
            "text-xl sm:text-2xl font-extrabold leading-tight",
            theme.title,
          )}
        >
          {winner}
        </h3>
        {runnerUp ? (
          <p className={cn("mt-2 text-xs sm:text-sm", theme.runnerUp)}>
            2e plaats: <span className="font-medium">{runnerUp}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
});
WinnerSection.displayName = "WinnerSection";

/**
 * Toont alleen kaarten met inhoud.
 * Zonder beker/play-offs: reeks 1 → gele kaart, reeks 2 → grijze kaart.
 */
const CupWinnerCard: React.FC<Props> = ({ cup, playoff, standings }) => {
  const slots = useMemo(
    () => buildWinnerSlots(cup, playoff, standings),
    [cup, playoff, standings],
  );

  if (slots.length === 0) return null;

  const gridClass =
    slots.length === 1
      ? "grid grid-cols-1 gap-4 sm:max-w-md"
      : slots.length === 2
        ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
        : "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4";

  return (
    <div className={gridClass}>
      {slots.map((slot) => (
        <WinnerSection key={`${slot.themeKey}-${slot.label}`} {...slot} />
      ))}
    </div>
  );
};

export default CupWinnerCard;
