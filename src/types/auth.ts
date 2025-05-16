
import type { Database } from "@/integrations/supabase/types";

export interface User {
  id: number;
  username: string;
  role: "admin" | "player_manager" | "referee";
  teamId?: number;
  password?: string; // Used for mock data, would not be included in a real app
}

export type UserRole = "admin" | "player_manager" | "referee";

export interface TeamData {
  id: number;
  name: string;
  email?: string;
  played?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goalDiff?: number;
  points?: number;
}

// Map from Supabase DB types to our application types if needed
export function mapDatabaseUserToAppUser(dbUser: Database["public"]["Tables"]["users"]["Row"]): User {
  return {
    id: dbUser.user_id,
    username: dbUser.username,
    role: dbUser.role as "admin" | "player_manager" | "referee",
    // Add additional mapping as needed
  };
}
