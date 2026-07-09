import React from "react";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import { useTabVisibility } from "@/context/TabVisibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrgAwareNavigate } from "@/hooks/useOrgAwareNavigate";
import { getPathFromTab } from "@/config/routes";
import {
  type NavItem,
  NAV_ROUTE_MAP,
  normalizeRole,
  SIDEBAR_WEDSTRIJDFORMULIEREN_ITEMS,
  SIDEBAR_BEHEER_ITEMS,
  FINANCIEEL_ITEMS,
  SIDEBAR_SYSTEEM_ITEMS,
  filterWedstrijdformulierenItems,
  filterBeheerItems,
  filterAdminOnlyItems,
  filterSpeelformatenItems,
} from "@/config/navigation";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab }: AdminSidebarProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const normalizedRole = normalizeRole(user?.role || "");
  const isAdmin = normalizedRole === "admin";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isTabVisible } = useTabVisibility();
  const isMobile = useIsMobile();
  const navigate = useOrgAwareNavigate();

  const filterOpts = {
    isTabVisible,
    isAdmin,
    isSuperAdmin,
    normalizedRole,
    userRole: user?.role,
    variant: "sidebar" as const,
  };

  const visibleWedstrijdformulierenItems = filterWedstrijdformulierenItems(
    SIDEBAR_WEDSTRIJDFORMULIEREN_ITEMS,
    filterOpts
  );
  const visibleBeheerItems = filterBeheerItems(SIDEBAR_BEHEER_ITEMS, filterOpts);
  const visibleFinancieelItems = filterAdminOnlyItems(FINANCIEEL_ITEMS, filterOpts);
  const visibleSysteemItems = filterAdminOnlyItems(SIDEBAR_SYSTEEM_ITEMS, filterOpts);
  const visibleSpeelformatenItems = filterSpeelformatenItems(isSuperAdmin, isTabVisible);

  const isActive = (key: string) => activeTab === key;

  const renderMenuItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <div key={item.key} className="mb-1">
        <button
          type="button"
          onClick={() => {
            const path = NAV_ROUTE_MAP[item.key] || getPathFromTab(item.key);
            navigate(path);
          }}
          aria-current={isActive(item.key) ? "page" : undefined}
          className={`btn-nav w-full flex items-center ${collapsed ? "justify-center p-2" : "justify-start gap-2 px-4 py-3"} ${isActive(item.key) ? " active" : ""} bg-transparent text-white`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </button>
      </div>
    );
  };

  const renderGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-3">
        {!collapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-1.5">
            {title}
          </h3>
        )}
        <div className="space-y-0.5">{items.map(renderMenuItem)}</div>
      </div>
    );
  };

  return (
    <div
      className={`${collapsed ? "w-14" : "w-64"} flex flex-col h-full ${isMobile ? "px-4 py-6" : "p-3"}`}
      style={{ background: "var(--color-100)" }}
    >
      <div className="mb-6">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <Shield className="h-4 w-4" style={{ color: "var(--color-primary-base)" }} />
          </div>
        ) : (
          <div className={`${isMobile ? "px-2" : "px-1"}`}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-primary-base)" }}>
              {isAdmin
                ? "Admin"
                : normalizedRole === "referee"
                  ? "SCHEIDSRECHTER"
                  : normalizedRole === "player_manager"
                    ? "Team Manager"
                    : normalizedRole
                      ? normalizedRole.toUpperCase()
                      : "GEBRUIKER"}
            </div>
            <div className="text-base font-semibold" style={{ color: "var(--color-primary-base)" }}>
              {isAdmin
                ? "Administrator"
                : normalizedRole === "referee"
                  ? "Scheidsrechter"
                  : normalizedRole === "player_manager"
                    ? "Team Manager"
                    : "Gebruiker"}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        {renderGroup("Wedstrijdformulieren", visibleWedstrijdformulierenItems)}
        {renderGroup("Beheer", visibleBeheerItems)}
        {renderGroup("Financieel", visibleFinancieelItems)}
        {renderGroup("Systeem", visibleSysteemItems)}
        {renderGroup("Speelformaten", visibleSpeelformatenItems)}

        <div className="mt-2 pb-4">
          <button
            type="button"
            onClick={logout}
            className={`btn-nav active w-full flex items-center ${collapsed ? "justify-center p-2" : "justify-start gap-2 px-4 py-3"}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Uitloggen</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
