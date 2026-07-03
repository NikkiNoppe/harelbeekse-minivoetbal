import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Award,
  BookOpen,
  Building2,
  Calendar,
  DollarSign,
  Home,
  MessageSquare,
  Settings,
  Shield,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "@/config/routes";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  visibilityKey?: string;
  adminOnly?: boolean;
  teamManagerOnly?: boolean;
  /** Alleen zichtbaar voor SuperAdmin (user id -1). */
  superAdminOnly?: boolean;
}

export const PUBLIC_NAV_ORDER = [
  "algemeen",
  "competitie",
  "playoff",
  "beker",
  "kaarten",
  "archief",
  "reglement",
] as const;

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { key: "algemeen", label: "Algemeen", icon: Home },
  { key: "reglement", label: "Reglement", icon: BookOpen },
  { key: "competitie", label: "Competitie", icon: Trophy },
  { key: "beker", label: "Beker", icon: Award },
  { key: "playoff", label: "Play-off", icon: Target },
  { key: "kaarten", label: "Kaarten", icon: Calendar },
  { key: "archief", label: "Archief", icon: Archive },
];

export const HEADER_WEDSTRIJDFORMULIEREN_ITEMS: NavItem[] = [
  { key: "match-forms-league", label: "Competitie", icon: Trophy, adminOnly: false },
  { key: "match-forms-cup", label: "Beker", icon: Award, adminOnly: false },
  { key: "match-forms-playoffs", label: "Play-off", icon: Target, adminOnly: false },
];

export const HEADER_BEHEER_ITEMS: NavItem[] = [
  { key: "players", label: "Spelers", icon: Users, adminOnly: false },
  { key: "teams", label: "Teams", icon: Shield, adminOnly: true },
  { key: "scheidsrechters", label: "Scheidsrechters", icon: Shield, adminOnly: false },
  { key: "schorsingen", label: "Schorsingen", icon: Shield, adminOnly: false },
  { key: "users", label: "Gebruikers", icon: User, adminOnly: true },
];

export const SIDEBAR_WEDSTRIJDFORMULIEREN_ITEMS: NavItem[] = [
  { key: "match-forms-league", label: "Competitie", icon: Trophy, adminOnly: false },
  { key: "match-forms-cup", label: "Beker", icon: Award, adminOnly: false },
  { key: "match-forms-playoffs", label: "Play-Off", icon: Target, adminOnly: false },
];

export const SIDEBAR_BEHEER_ITEMS: NavItem[] = [
  { key: "players", label: "Spelers", icon: Users, adminOnly: false },
  { key: "ploegen", label: "Teams", icon: Users, adminOnly: false },
  { key: "scheidsrechters", label: "Scheidsrechters", icon: Calendar, adminOnly: false },
  { key: "schorsingen", label: "Schorsingen", icon: Shield, adminOnly: true },
  { key: "teams", label: "Teams (Admin)", icon: Shield, adminOnly: true },
  { key: "users", label: "Gebruikers", icon: User, adminOnly: true },
];

export const SPEELFORMATEN_ITEMS: NavItem[] = [
  { key: "competition", label: "Competitie", icon: Trophy, visibilityKey: "format-competition" },
  { key: "cup", label: "Beker", icon: Award, visibilityKey: "format-cup" },
  { key: "playoffs", label: "Play-off", icon: Target, visibilityKey: "format-playoffs" },
];

export const FINANCIEEL_ITEMS: NavItem[] = [
  { key: "financial", label: "Financieel", icon: DollarSign, adminOnly: true },
];

export const HEADER_SYSTEEM_ITEMS: NavItem[] = [
  { key: "superadmin-beheer", label: "Platform beheer", icon: Building2, superAdminOnly: true },
  { key: "settings", label: "Instellingen", icon: Settings, adminOnly: true, superAdminOnly: true },
  { key: "blog-management", label: "Blog Beheer", icon: BookOpen, adminOnly: true, superAdminOnly: true },
  { key: "notification", label: "Berichten", icon: MessageSquare, adminOnly: true, superAdminOnly: true },
];

export const SIDEBAR_SYSTEEM_ITEMS: NavItem[] = [
  { key: "settings", label: "Instellingen", icon: Settings, adminOnly: true, superAdminOnly: true },
];

export const NAV_ROUTE_MAP: Record<string, string> = {
  algemeen: PUBLIC_ROUTES.algemeen,
  beker: PUBLIC_ROUTES.beker,
  competitie: PUBLIC_ROUTES.competitie,
  playoff: PUBLIC_ROUTES.playoff,
  reglement: PUBLIC_ROUTES.reglement,
  kaarten: PUBLIC_ROUTES.kaarten,
  archief: PUBLIC_ROUTES.archief,
  "match-forms": ADMIN_ROUTES["match-forms"],
  "match-forms-league": ADMIN_ROUTES["match-forms-league"],
  "match-forms-cup": ADMIN_ROUTES["match-forms-cup"],
  "match-forms-playoffs": ADMIN_ROUTES["match-forms-playoffs"],
  players: ADMIN_ROUTES.players,
  ploegen: ADMIN_ROUTES.teams,
  teams: ADMIN_ROUTES.teams,
  users: ADMIN_ROUTES.users,
  competition: ADMIN_ROUTES.competition,
  playoffs: ADMIN_ROUTES.playoffs,
  cup: ADMIN_ROUTES.cup,
  financial: ADMIN_ROUTES.financial,
  settings: ADMIN_ROUTES.settings,
  scheidsrechters: ADMIN_ROUTES.scheidsrechters,
  schorsingen: ADMIN_ROUTES.schorsingen,
  suspensions: ADMIN_ROUTES.suspensions,
  "blog-management": ADMIN_ROUTES["blog-management"],
  notification: ADMIN_ROUTES.notification,
  "superadmin-beheer": ADMIN_ROUTES["platform-beheer"],
};

export function normalizeRole(role: string): string {
  const r = String(role || "").toLowerCase();
  if (["team", "manager", "team_manager", "player-manager"].includes(r)) {
    return "player_manager";
  }
  return r;
}

export function getRoleLabel(normalizedRole: string, isAdmin: boolean): string {
  if (isAdmin) return "Administrator";
  if (normalizedRole === "referee") return "Scheidsrechter";
  if (normalizedRole === "player_manager") return "Team Manager";
  return "Gebruiker";
}

export function getOrderedPublicNavItems(
  isTabVisible: (key: string) => boolean,
  _isSuperAdmin = false,
): NavItem[] {
  const items = PUBLIC_NAV_ORDER.map((key) => PUBLIC_NAV_ITEMS.find((i) => i.key === key))
    .filter((item): item is NavItem => Boolean(item));
  return items.filter((item) => isTabVisible(item.key));
}

interface FilterNavItemsOptions {
  isTabVisible: (key: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  normalizedRole: string;
  userRole?: string;
  variant: "header" | "sidebar";
}

export function filterWedstrijdformulierenItems(
  items: NavItem[],
  {
    isTabVisible,
    isAdmin,
    isSuperAdmin = false,
  }: Pick<FilterNavItemsOptions, "isTabVisible" | "isAdmin" | "isSuperAdmin">,
): NavItem[] {
  return items.filter((item) => {
    if (!isTabVisible(item.key)) return false;
    if (item.adminOnly && !isAdmin && !isSuperAdmin) return false;
    return true;
  });
}

export function filterBeheerItems(
  items: NavItem[],
  { isTabVisible, isAdmin, isSuperAdmin = false, normalizedRole, userRole, variant }: FilterNavItemsOptions
): NavItem[] {
  return items.filter((item) => {
    if (!isTabVisible(item.key)) return false;
    if (item.adminOnly && !isAdmin && !isSuperAdmin) return false;
    if (item.teamManagerOnly && normalizedRole !== "player_manager") return false;

    if (variant === "sidebar") {
      if (item.key === "players" && userRole === "referee") return false;
      if (item.key === "scheidsrechters" && !(isAdmin || isSuperAdmin || userRole === "referee")) return false;
      return true;
    }

    if (item.key === "scheidsrechters" && !(isAdmin || isSuperAdmin || normalizedRole === "referee")) {
      return false;
    }
    return true;
  });
}

export function filterAdminOnlyItems(
  items: NavItem[],
  {
    isTabVisible,
    isAdmin,
    isSuperAdmin = false,
  }: Pick<FilterNavItemsOptions, "isTabVisible" | "isAdmin" | "isSuperAdmin">,
): NavItem[] {
  return items.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (!isTabVisible(item.key)) return false;
    if (item.adminOnly && !isAdmin && !isSuperAdmin) return false;
    return true;
  });
}

export function filterSpeelformatenItems(
  isSuperAdmin: boolean,
  isTabVisible: (key: string) => boolean,
): NavItem[] {
  if (!isSuperAdmin) {
    return [];
  }

  return SPEELFORMATEN_ITEMS.filter((item) =>
    isTabVisible(item.visibilityKey ?? item.key),
  );
}
