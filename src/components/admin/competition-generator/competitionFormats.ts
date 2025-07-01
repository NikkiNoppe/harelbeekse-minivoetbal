
import { CompetitionType } from "./types";

export const predefinedFormats: CompetitionType[] = [
  {
    id: "regular-single",
    name: "Reguliere competitie (enkele ronde)",
    description: "Elke ploeg speelt één keer tegen elke andere ploeg",
    hasPlayoffs: false,
    regularRounds: 1,
    has_playoffs: false,
    regular_rounds: 1,
  },
  {
    id: "regular-double",
    name: "Reguliere competitie (dubbele ronde)",
    description: "Elke ploeg speelt twee keer tegen elke andere ploeg (thuis en uit)",
    hasPlayoffs: false,
    regularRounds: 2,
    has_playoffs: false,
    regular_rounds: 2,
  },
  {
    id: "playoff-top6-bottom6",
    name: "Competitie met Play-offs (Top 6 / Bottom 6)",
    description: "Reguliere competitie gevolgd door playoff tussen top 6 teams en degradatie playoff voor bottom 6 teams",
    hasPlayoffs: true,
    regularRounds: 1,
    playoffTeams: 6,
    has_playoffs: true,
    regular_rounds: 1,
  },
  {
    id: "playoff-top4",
    name: "Competitie met Play-offs (Top 4)",
    description: "Reguliere competitie gevolgd door playoff tussen top 4 teams",
    hasPlayoffs: true,
    regularRounds: 1,
    playoffTeams: 4,
    has_playoffs: true,
    regular_rounds: 1,
  },
  {
    id: "cup",
    name: "Beker competitie (knockout)",
    description: "Knock-out toernooi waarin elke ploeg één wedstrijd speelt en de winnaar doorgaat",
    hasPlayoffs: false,
    regularRounds: 0,
    isCup: true,
    has_playoffs: false,
    regular_rounds: 0,
  }
];

// Helper function to find format by id
export const findFormatById = (id: string | null): CompetitionType | undefined => {
  return predefinedFormats.find(f => f.id === id);
};
