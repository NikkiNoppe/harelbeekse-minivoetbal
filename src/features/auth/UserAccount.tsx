import React from "react";
import { useToast } from "@shared/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Button } from "@shared/components/ui/button";
import { Shield, User } from "lucide-react";

interface UserAccountProps {
  user: {
    id: number;
    username: string;
    role: string;
    teamId?: number;
  };
  onLogout: () => void;
}

const UserAccount: React.FC<UserAccountProps> = ({ user, onLogout }) => {
  const { toast } = useToast();
  
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    onLogout();
    
    toast({
      title: "Uitgelogd",
      description: "U bent succesvol uitgelogd",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-white text-purple-800 border-white hover:bg-purple-50 hover:text-purple-900 transition-colors"
        >
          {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
          {user.username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
        <DropdownMenuLabel className="text-gray-900">Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="focus:bg-purple-50">
          <div className="flex flex-col">
            <span className="text-gray-900">Ingelogd als: {user.username}</span>
            <span className="text-xs text-gray-600 capitalize">
              {user.role === "admin" ? "Administrator" : "Team Beheerder"}
            </span>
            {user.teamId && (
              <span className="text-xs text-gray-600">
                Team ID: {user.teamId}
              </span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
        >
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccount;
