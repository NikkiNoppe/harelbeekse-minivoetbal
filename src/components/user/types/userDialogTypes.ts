
import { User } from "@/types/auth";

export interface TeamOption {
  id: number;
  name: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "referee" | "player_manager";
  teamId: number;
  teamIds: number[];
}

export interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: {
    id: number;
    username: string;
    email?: string;
    password: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teams?: {team_id: number, team_name: string}[];
  };
  onSave: (formData: any) => void;
  teams: TeamOption[];
  isLoading?: boolean;
}
