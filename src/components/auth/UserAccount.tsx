
import React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
        <Button variant="outline" size="sm" className="gap-2">
          {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
          {user.username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="flex flex-col">
            <span>Ingelogd als: {user.username}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role === "admin" ? "Administrator" : "Team Beheerder"}
            </span>
            {user.teamId && (
              <span className="text-xs text-muted-foreground">
                Team ID: {user.teamId}
              </span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccount;
