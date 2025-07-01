
import { User } from "@shared/types/auth";

export interface TeamOption {
  id: number;
  name: string;
}

export interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSave: (userData: any) => Promise<boolean>;
  teams: TeamOption[];
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  teamId?: number;
}
