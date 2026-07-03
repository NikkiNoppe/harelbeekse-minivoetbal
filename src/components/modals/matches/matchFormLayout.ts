/** Rol en sectievolgorde voor wedstrijdformulier — zie design-system/pages/wedstrijdformulier.md */

export type MatchFormRole = "team_manager" | "referee" | "admin";

export type MatchFormMobileTab = "spelers" | "score" | "overig";

export type MatchFormDesktopSection =
  | "score"
  | "gegevens"
  | "spelers"
  | "wedstrijd";

const MOBILE_TAB_LABELS: Record<MatchFormMobileTab, string> = {
  spelers: "Spelers",
  score: "Score",
  overig: "Overig",
};

export function getMatchFormRole(isAdmin: boolean, isReferee: boolean): MatchFormRole {
  if (isAdmin) return "admin";
  if (isReferee) return "referee";
  return "team_manager";
}

/** Mobiele tabs per rol (P4) */
export function getMatchFormMobileTabs(role: MatchFormRole): MatchFormMobileTab[] {
  if (role === "team_manager") {
    return ["spelers", "score"];
  }
  return ["score", "spelers", "overig"];
}

export function getMatchFormMobileTabLabel(tab: MatchFormMobileTab): string {
  return MOBILE_TAB_LABELS[tab];
}

/** Standaard actieve tab bij openen op mobiel */
export function getDefaultMatchFormMobileTab(role: MatchFormRole): MatchFormMobileTab {
  if (role === "team_manager") return "spelers";
  return "score";
}

/** Welke mobiele tab hoort bij een desktop-sectie */
export function getSectionMobileTab(
  section: MatchFormDesktopSection,
  role: MatchFormRole,
): MatchFormMobileTab | null {
  switch (section) {
    case "score":
      return "score";
    case "spelers":
      return "spelers";
    case "gegevens":
      return "score";
    case "wedstrijd":
      return role === "team_manager" ? null : "overig";
    default:
      return null;
  }
}

/** Flex order voor desktop sectievolgorde */
export function getSectionDesktopOrder(
  section: MatchFormDesktopSection,
  role: MatchFormRole,
): number {
  const order = getDesktopSectionOrder(role);
  const index = order.indexOf(section);
  return index >= 0 ? index + 1 : 99;
}

/** Desktop sectievolgorde per rol */
export function getDesktopSectionOrder(role: MatchFormRole): MatchFormDesktopSection[] {
  switch (role) {
    case "team_manager":
      return ["spelers", "score", "gegevens"];
    case "referee":
      return ["score", "gegevens", "spelers", "wedstrijd"];
    case "admin":
      return ["score", "gegevens", "spelers", "wedstrijd"];
  }
}

/** Welke collapsibles standaard open bij openen modal */
export function getDefaultSectionOpenState(
  role: MatchFormRole,
  teamId: number,
  homeTeamId: number,
  awayTeamId: number,
) {
  const ownIsHome = homeTeamId === teamId;
  const ownIsAway = awayTeamId === teamId;

  if (role === "team_manager") {
    return {
      homeTeamOpen: ownIsHome,
      awayTeamOpen: ownIsAway,
      isKaartenOpen: false,
      isGegevensOpen: true,
      isNotitiesOpen: false,
      isFinancieelOpen: false,
    };
  }

  if (role === "referee") {
    return {
      homeTeamOpen: false,
      awayTeamOpen: false,
      isKaartenOpen: true,
      isGegevensOpen: true,
      isNotitiesOpen: false,
      isFinancieelOpen: false,
    };
  }

  return {
    homeTeamOpen: false,
    awayTeamOpen: false,
    isKaartenOpen: false,
    isGegevensOpen: true,
    isNotitiesOpen: false,
    isFinancieelOpen: false,
  };
}
