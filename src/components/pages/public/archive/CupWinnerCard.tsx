import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Medal, Trophy } from "lucide-react";
import type {
  ArchivedCupWinner,
  ArchivedPlayoff,
  ArchivedPlayoffRanking,
} from "@/services/archiveService";
import { cn } from "@/lib/utils";

interface Props {
  cup: ArchivedCupWinner | null;
  playoff: ArchivedPlayoff | null;
}

type WinnerTheme = {
  cardBorder: string;
  gradient: string;
  icon: string;
  label: string;
  title: string;
  runnerUp: string;
};

const THEMES = {
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
} satisfies Record<string, WinnerTheme>;

function teamAtPosition(
  rows: ArchivedPlayoffRanking[] | undefined,
  position: number,
): ArchivedPlayoffRanking | undefined {
  return rows?.find((r) => r.position === position);
}

const CupWinnerSection = memo(({ cup }: { cup: ArchivedCupWinner | null }) => {
  const theme = THEMES.cup;

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
        <Trophy
          className={cn("mx-auto mb-2 h-10 w-10 drop-shadow sm:h-12 sm:w-12", theme.icon)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "text-xs uppercase tracking-widest font-semibold mb-1",
            theme.label,
          )}
        >
          Bekerwinnaar
        </div>
        {cup?.winner ? (
          <>
            <h3
              className={cn(
                "text-xl sm:text-2xl font-extrabold leading-tight",
                theme.title,
              )}
            >
              {cup.winner}
            </h3>
            {cup.runner_up && (
              <p className={cn("mt-2 text-xs sm:text-sm", theme.runnerUp)}>
                2e plaats: <span className="font-medium">{cup.runner_up}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm mt-1 text-amber-200/60">
            Geen bekerwinnaar gearchiveerd.
          </p>
        )}
      </div>
    </Card>
  );
});
CupWinnerSection.displayName = "CupWinnerSection";

const WinnerSection = memo(({
  themeKey,
  label,
  winner,
  runnerUp,
  emptyMessage,
  useTrophyIcon = false,
}: {
  themeKey: keyof typeof THEMES;
  label: string;
  winner?: string;
  runnerUp?: string;
  emptyMessage: string;
  useTrophyIcon?: boolean;
}) => {
  const theme = THEMES[themeKey];
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
        {winner ? (
          <>
            <h3
              className={cn(
                "text-xl sm:text-2xl font-extrabold leading-tight",
                theme.title,
              )}
            >
              {winner}
            </h3>
            {runnerUp && (
              <p className={cn("mt-2 text-xs sm:text-sm", theme.runnerUp)}>
                2e plaats: <span className="font-medium">{runnerUp}</span>
              </p>
            )}
          </>
        ) : (
          <p
            className={cn(
              "text-sm mt-1",
              themeKey === "cup" ? "text-amber-200/60" : "text-muted-foreground",
            )}
          >
            {emptyMessage}
          </p>
        )}
      </div>
    </Card>
  );
});
WinnerSection.displayName = "WinnerSection";

const CupWinnerCard: React.FC<Props> = ({ cup, playoff }) => {
  const po1Winner = teamAtPosition(playoff?.top_ranking, 1);
  const po1RunnerUp = teamAtPosition(playoff?.top_ranking, 2);
  const po2Winner = teamAtPosition(playoff?.bottom_ranking, 1);
  const po2RunnerUp = teamAtPosition(playoff?.bottom_ranking, 2);

  const hasAnyData =
    !!cup?.winner || !!po1Winner || !!po2Winner;

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-[var(--color-700)] mb-2">
            <Trophy className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">Winnaars</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Geen beker- of play-offwinnaars gearchiveerd voor dit seizoen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
      <CupWinnerSection cup={cup} />
      <WinnerSection
        themeKey="po1"
        label="Play-Off 1 winnaar"
        winner={po1Winner?.team_name}
        runnerUp={po1RunnerUp?.team_name}
        emptyMessage="Geen Play-Off 1-winnaar gearchiveerd."
      />
      <WinnerSection
        themeKey="po2"
        label="Play-Off 2 winnaar"
        winner={po2Winner?.team_name}
        runnerUp={po2RunnerUp?.team_name}
        emptyMessage="Geen Play-Off 2-winnaar gearchiveerd."
      />
    </div>
  );
};

export default CupWinnerCard;
