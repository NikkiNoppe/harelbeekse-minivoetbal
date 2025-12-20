import React, { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Users, CreditCard, Settings, Calendar } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { PUBLIC_ROUTES, ADMIN_ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  authRequired?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { 
    key: "wedstrijden", 
    label: "Wedstrijden", 
    icon: <Trophy size={20} />, 
    path: PUBLIC_ROUTES.competitie 
  },
  { 
    key: "teams", 
    label: "Teams", 
    icon: <Users size={20} />, 
    path: PUBLIC_ROUTES.teams 
  },
  { 
    key: "kaarten", 
    label: "Kaarten", 
    icon: <CreditCard size={20} />, 
    path: PUBLIC_ROUTES.kaarten 
  },
  { 
    key: "financieel", 
    label: "Financieel", 
    icon: <Calendar size={20} />, 
    path: ADMIN_ROUTES.financial,
    authRequired: true,
    adminOnly: true
  },
  { 
    key: "beheer", 
    label: "Beheer", 
    icon: <Settings size={20} />, 
    path: ADMIN_ROUTES.players,
    authRequired: true
  },
];

const MobileBottomNav: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isAuthenticated = !!user;

  // Filter items based on auth and role
  const visibleItems = navItems.filter(item => {
    if (item.authRequired && !isAuthenticated) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  // Determine active tab from current path
  const getActiveKey = () => {
    const path = location.pathname;
    
    // Match scores/matches related paths
    if (path.includes('/competitie') || path.includes('/beker') || path.includes('/playoff') || path.includes('/algemeen')) {
      return "wedstrijden";
    }
    if (path.includes('/teams')) {
      return "teams";
    }
    if (path.includes('/kaarten')) {
      return "kaarten";
    }
    if (path.includes('/admin/financial')) {
      return "financieel";
    }
    if (path.startsWith('/admin')) {
      return "beheer";
    }
    return "wedstrijden";
  };

  const activeKey = getActiveKey();

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = activeKey === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={cn(
                "mb-1 transition-transform",
                isActive && "scale-110"
              )}>
                {item.icon}
              </span>
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default memo(MobileBottomNav);
