import type { PlayerSelection } from "@/components/pages/admin/matches/types";

export type MatchFormTeamKey = "home" | "away";

export type MatchFormCardType = "yellow" | "double_yellow" | "red";

export interface MatchFormCardItem {
  team: MatchFormTeamKey | "";
  playerId: number | null;
  cardType: MatchFormCardType;
}

export interface MatchFormSavedCard {
  team: MatchFormTeamKey;
  playerName: string;
  cardType: string;
  playerId: number;
}

export interface MatchFormPenaltyItem {
  id?: number;
  costSettingId: number | null;
  teamId: number | null;
}

export interface MatchFormSavedPenalty {
  id: number;
  teamName: string;
  penaltyName: string;
  amount: number;
}

export interface MatchFormMatchCost {
  id: number;
  teamId: number;
  teamName: string;
  costName: string;
  category: string;
  amount: number;
  costSettingId: number | null;
}

export interface MatchFormPenaltyOption {
  id: number;
  name: string;
  amount: number;
}

export interface MatchFormTeamOption {
  id: number;
  name: string;
}

export const MATCH_FORM_CARD_OPTIONS = [
  { value: "yellow" as const, label: "Geel" },
  { value: "double_yellow" as const, label: "2x Geel" },
  { value: "red" as const, label: "Rood" },
];

export type MatchFormPlayersByTeam = {
  home: PlayerSelection[];
  away: PlayerSelection[];
};
