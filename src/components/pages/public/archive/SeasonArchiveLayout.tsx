import React from "react";
import type { SeasonArchive } from "@/services/archiveService";
import {
  archiveHasCup,
  archiveHasPlayoff,
  archiveHasStandings,
} from "@/lib/archiveManualUtils";
import CupWinnerCard from "./CupWinnerCard";
import CupArchiveCard from "./CupArchiveCard";
import PlayoffArchiveCard from "./PlayoffArchiveCard";
import StandingsArchiveCard from "./StandingsArchiveCard";

interface Props {
  archive: SeasonArchive | null;
}

/**
 * Archief-layout per seizoen: winnaarsstrip + alleen secties met data.
 * Zonder beker/play-offs vult de strip reekskampioenen in (reeks 1 / reeks 2).
 */
const SeasonArchiveLayout: React.FC<Props> = ({ archive }) => {
  const cup = archive?.cup_winner ?? null;
  const playoff = archive?.playoff ?? null;
  const standings = archive?.competition_standings ?? [];
  const showCupDetail = archiveHasCup(cup);
  const showPlayoffDetail = archiveHasPlayoff(playoff);
  const showStandings = archiveHasStandings(standings);

  return (
    <div className="space-y-4 sm:space-y-6">
      <CupWinnerCard cup={cup} playoff={playoff} standings={standings} />
      {showCupDetail ? <CupArchiveCard cup={cup} /> : null}
      {showPlayoffDetail ? <PlayoffArchiveCard entry={playoff} /> : null}
      {showStandings ? <StandingsArchiveCard standings={standings} /> : null}
    </div>
  );
};

export default SeasonArchiveLayout;
