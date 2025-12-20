import React, { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "@/config/routes";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MatchdayActionsBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Only show for authenticated users
  if (!user) return null;

  // Determine which match form to link to based on current page
  const getMatchFormPath = () => {
    const path = location.pathname;
    
    if (path === PUBLIC_ROUTES.beker) {
      return ADMIN_ROUTES["match-forms-cup"];
    }
    if (path === PUBLIC_ROUTES.playoff) {
      return ADMIN_ROUTES["match-forms-playoffs"];
    }
    // Default to league for competitie or other pages
    return ADMIN_ROUTES["match-forms-league"];
  };

  const getMatchFormLabel = () => {
    const path = location.pathname;
    
    if (path === PUBLIC_ROUTES.beker) {
      return "Beker formulier invullen";
    }
    if (path === PUBLIC_ROUTES.playoff) {
      return "Playoff formulier invullen";
    }
    return "Wedstrijdformulier invullen";
  };

  // Only show on relevant public pages
  const relevantPaths = [
    PUBLIC_ROUTES.competitie,
    PUBLIC_ROUTES.beker,
    PUBLIC_ROUTES.playoff,
    PUBLIC_ROUTES.algemeen,
  ];

  if (!relevantPaths.includes(location.pathname as any)) {
    return null;
  }

  return (
    <button
      onClick={() => navigate(getMatchFormPath())}
      className={cn(
        "w-full flex items-center justify-between p-3 mb-4",
        "bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors",
        "border border-primary/20"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <ClipboardList size={18} className="text-primary" />
        </div>
        <span className="font-medium text-foreground text-sm">
          {getMatchFormLabel()}
        </span>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  );
};

export default memo(MatchdayActionsBar);
