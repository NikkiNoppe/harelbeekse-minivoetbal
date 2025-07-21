export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      application_settings: {
        Row: {
          created_at: string | null
          created_by: number | null
          id: number
          is_active: boolean
          setting_category: string
          setting_name: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean
          setting_category: string
          setting_name: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean
          setting_category?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      competition_standings: {
        Row: {
          draws: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_scored: number | null
          losses: number | null
          matches_played: number | null
          points: number | null
          standing_id: number
          team_id: number | null
          wins: number | null
        }
        Insert: {
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_scored?: number | null
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          standing_id?: number
          team_id?: number | null
          wins?: number | null
        }
        Update: {
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_scored?: number | null
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          standing_id?: number
          team_id?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      costs: {
        Row: {
          amount: number | null
          category: string
          description: string | null
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          amount?: number | null
          category: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          amount?: number | null
          category?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_players: Json | null
          away_score: number | null
          away_team_id: number | null
          home_players: Json | null
          home_score: number | null
          home_team_id: number | null
          is_cup_match: boolean | null
          is_locked: boolean | null
          is_submitted: boolean | null
          location: string | null
          match_date: string
          match_id: number
          referee: string | null
          referee_notes: string | null
          speeldag: string | null
          unique_number: string | null
        }
        Insert: {
          away_players?: Json | null
          away_score?: number | null
          away_team_id?: number | null
          home_players?: Json | null
          home_score?: number | null
          home_team_id?: number | null
          is_cup_match?: boolean | null
          is_locked?: boolean | null
          is_submitted?: boolean | null
          location?: string | null
          match_date: string
          match_id?: number
          referee?: string | null
          referee_notes?: string | null
          speeldag?: string | null
          unique_number?: string | null
        }
        Update: {
          away_players?: Json | null
          away_score?: number | null
          away_team_id?: number | null
          home_players?: Json | null
          home_score?: number | null
          home_team_id?: number | null
          is_cup_match?: boolean | null
          is_locked?: boolean | null
          is_submitted?: boolean | null
          location?: string | null
          match_date?: string
          match_id?: number
          referee?: string | null
          referee_notes?: string | null
          speeldag?: string | null
          unique_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string
          first_name: string
          last_name: string
          player_id: number
          red_cards: number | null
          team_id: number | null
          yellow_cards: number | null
        }
        Insert: {
          birth_date: string
          first_name: string
          last_name: string
          player_id?: number
          red_cards?: number | null
          team_id?: number | null
          yellow_cards?: number | null
        }
        Update: {
          birth_date?: string
          first_name?: string
          last_name?: string
          player_id?: number
          red_cards?: number | null
          team_id?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_costs: {
        Row: {
          amount: number | null
          cost_setting_id: number | null
          id: number
          match_id: number | null
          team_id: number | null
          transaction_date: string
        }
        Insert: {
          amount?: number | null
          cost_setting_id?: number | null
          id?: number
          match_id?: number | null
          team_id?: number | null
          transaction_date?: string
        }
        Update: {
          amount?: number | null
          cost_setting_id?: number | null
          id?: number
          match_id?: number | null
          team_id?: number | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_costs_cost_setting_id_fkey"
            columns: ["cost_setting_id"]
            isOneToOne: false
            referencedRelation: "costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_costs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "team_costs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_users: {
        Row: {
          id: number
          team_id: number | null
          user_id: number | null
        }
        Insert: {
          id?: number
          team_id?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          team_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_managers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      teams: {
        Row: {
          club_colors: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          preferred_play_moments: Json | null
          team_id: number
          team_name: string
        }
        Insert: {
          club_colors?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          preferred_play_moments?: Json | null
          team_id?: number
          team_name: string
        }
        Update: {
          club_colors?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          preferred_play_moments?: Json | null
          team_id?: number
          team_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: number
          username: string
        }
        Insert: {
          email?: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: number
          username: string
        }
        Update: {
          email?: string | null
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: number
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_team_cost: {
        Args: {
          p_team_id: number
          p_cost_name: string
          p_amount: number
          p_category?: string
          p_match_id?: number
        }
        Returns: number
      }
      add_team_deposit: {
        Args: { p_team_id: number; p_deposit_name: string; p_amount: number }
        Returns: number
      }
      calculate_team_balance: {
        Args: { team_id_param: number }
        Returns: number
      }
      calculate_team_balance_final: {
        Args: { team_id_param: number }
        Returns: number
      }
      calculate_team_balance_updated: {
        Args: { team_id_param: number }
        Returns: number
      }
      can_current_user_manage_player: {
        Args: { player_team_id: number }
        Returns: boolean
      }
      create_user_with_hashed_password: {
        Args: {
          username_param: string
          email_param: string
          password_param: string
          role_param?: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          email: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: number
          username: string
        }
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_team_ids: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      get_match_statistics: {
        Args: { match_id_param: number }
        Returns: {
          total_players: number
          home_players_count: number
          away_players_count: number
          cards_count: number
        }[]
      }
      insert_transaction_with_auto_data: {
        Args:
          | {
              p_team_id: number
              p_cost_setting_id: number
              p_amount: number
              p_date?: string
              p_match_id?: number
              p_notes?: string
            }
          | {
              p_team_id: number
              p_cost_setting_id?: number
              p_transaction_type?: string
              p_amount?: number
              p_description?: string
              p_match_id?: number
            }
          | {
              p_team_id: number
              p_transaction_type: string
              p_amount: number
              p_description?: string
              p_match_id?: number
            }
        Returns: number
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_player_list_locked: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_cost_setting_change: {
        Args: {
          p_cost_setting_id: number
          p_old_amount: number
          p_new_amount: number
          p_user_id?: number
        }
        Returns: undefined
      }
      update_competition_standings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_competition_standings_optimized: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_player_cards: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_team_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_password: {
        Args: { user_id_param: number; new_password: string }
        Returns: boolean
      }
      validate_player_data: {
        Args:
          | {
              p_first_name: string
              p_last_name: string
              p_birth_date: string
              p_team_id: number
              p_exclude_player_id?: number
            }
          | { p_name: string; p_team_id?: number }
        Returns: boolean
      }
      verify_user_password: {
        Args: { input_username_or_email: string; input_password: string }
        Returns: {
          user_id: number
          username: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      verify_user_password_flexible: {
        Args: { input_username_or_email: string; input_password: string }
        Returns: {
          user_id: number
          username: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
    }
    Enums: {
      card_type: "yellow" | "red"
      user_role: "admin" | "referee" | "player_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_type: ["yellow", "red"],
      user_role: ["admin", "referee", "player_manager"],
    },
  },
} as const
