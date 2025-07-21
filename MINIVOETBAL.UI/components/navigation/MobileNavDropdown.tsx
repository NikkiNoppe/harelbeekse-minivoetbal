
import React from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../MINIVOETBAL.UI/components/ui/dropdown-menu";
import { TabName } from "../../../MINIVOETBAL.UI/context/TabVisibilityContext";

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileNavDropdownProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
}

const MobileNavDropdown: React.FC<MobileNavDropdownProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isAuthenticated,
  user,
  onLogin,
  onLogout
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2 text-white hover:bg-white/10"
        >
          <Menu size={20} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white border border-purple-200 shadow-lg z-50"
      >
        {/* Navigation Items */}
        {tabs.map((tab) => (
          <DropdownMenuItem
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-purple-100 text-purple-700 font-medium' 
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </DropdownMenuItem>
        ))}
        
        {/* Separator if user actions exist */}
        {(isAuthenticated || onLogin) && <DropdownMenuSeparator />}
        
        {/* User Actions */}
        {isAuthenticated && user ? (
          <>
            <DropdownMenuItem className="text-purple-600 hover:bg-purple-50">
              <User size={16} className="mr-2" />
              <span className="truncate">{user.email}</span>
            </DropdownMenuItem>
            {onLogout && (
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={16} className="mr-2" />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            )}
          </>
        ) : (
          onLogin && (
            <DropdownMenuItem
              onClick={onLogin}
              className="text-purple-600 hover:bg-purple-50 cursor-pointer"
            >
              <User size={16} className="mr-2" />
              <span>Inloggen</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MobileNavDropdown;
