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
      ai_generation_logs: {
        Row: {
          ai_provider: string
          config_id: number | null
          created_at: string | null
          error_message: string | null
          generation_time_ms: number | null
          id: number
          request_data: Json
          response_data: Json | null
          status: string | null
        }
        Insert: {
          ai_provider: string
          config_id?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: number
          request_data: Json
          response_data?: Json | null
          status?: string | null
        }
        Update: {
          ai_provider?: string
          config_id?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: number
          request_data?: Json
          response_data?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "competition_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      available_dates: {
        Row: {
          available_date: string
          date_id: number
          end_time: string | null
          is_available: boolean | null
          is_cup_date: boolean | null
          start_time: string | null
          venue_id: number | null
        }
        Insert: {
          available_date: string
          date_id?: number
          end_time?: string | null
          is_available?: boolean | null
          is_cup_date?: boolean | null
          start_time?: string | null
          venue_id?: number | null
        }
        Update: {
          available_date?: string
          date_id?: number
          end_time?: string | null
          is_available?: boolean | null
          is_cup_date?: boolean | null
          start_time?: string | null
          venue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_available_dates_venue"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "fk_available_dates_venue_id"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      blogs: {
        Row: {
          content: string
          date: string
          id: number
          tags: string[] | null
          title: string
        }
        Insert: {
          content: string
          date?: string
          id?: number
          tags?: string[] | null
          title: string
        }
        Update: {
          content?: string
          date?: string
          id?: number
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      competition_configs: {
        Row: {
          config_data: Json | null
          created_at: string | null
          created_by: number | null
          end_date: string
          format_type: string
          id: number
          matches_per_week: number | null
          name: string
          playoff_teams: number | null
          start_date: string
          total_rounds: number | null
          vacation_periods: number[] | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string | null
          created_by?: number | null
          end_date: string
          format_type: string
          id?: number
          matches_per_week?: number | null
          name: string
          playoff_teams?: number | null
          start_date: string
          total_rounds?: number | null
          vacation_periods?: number[] | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string | null
          created_by?: number | null
          end_date?: string
          format_type?: string
          id?: number
          matches_per_week?: number | null
          name?: string
          playoff_teams?: number | null
          start_date?: string
          total_rounds?: number | null
          vacation_periods?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      competition_formats: {
        Row: {
          created_at: string | null
          description: string | null
          format_id: number
          has_playoffs: boolean | null
          name: string
          regular_rounds: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          format_id?: number
          has_playoffs?: boolean | null
          name: string
          regular_rounds?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          format_id?: number
          has_playoffs?: boolean | null
          name?: string
          regular_rounds?: number | null
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
      competitions: {
        Row: {
          competition_id: number
          end_date: string
          is_playoff: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          competition_id?: number
          end_date: string
          is_playoff?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          competition_id?: number
          end_date?: string
          is_playoff?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      cost_setting_audit_log: {
        Row: {
          affected_transactions_count: number | null
          changed_at: string | null
          changed_by: number | null
          cost_setting_id: number | null
          id: number
          new_amount: number | null
          old_amount: number | null
        }
        Insert: {
          affected_transactions_count?: number | null
          changed_at?: string | null
          changed_by?: number | null
          cost_setting_id?: number | null
          id?: number
          new_amount?: number | null
          old_amount?: number | null
        }
        Update: {
          affected_transactions_count?: number | null
          changed_at?: string | null
          changed_by?: number | null
          cost_setting_id?: number | null
          id?: number
          new_amount?: number | null
          old_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_setting_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cost_setting_audit_log_cost_setting_id_fkey"
            columns: ["cost_setting_id"]
            isOneToOne: false
            referencedRelation: "cost_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_settings: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      manual_competition_schedules: {
        Row: {
          competition_id: number | null
          created_at: string | null
          created_by: number | null
          description: string | null
          is_active: boolean | null
          name: string
          parsed_data: Json | null
          schedule_id: number
          schema_text: string | null
          status: string | null
        }
        Insert: {
          competition_id?: number | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          is_active?: boolean | null
          name: string
          parsed_data?: Json | null
          schedule_id?: number
          schema_text?: string | null
          status?: string | null
        }
        Update: {
          competition_id?: number | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          is_active?: boolean | null
          name?: string
          parsed_data?: Json | null
          schedule_id?: number
          schema_text?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_competition_schedules_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "manual_competition_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      manual_schedule_matches: {
        Row: {
          away_team_id: number | null
          created_at: string | null
          home_team_id: number | null
          manual_match_id: number
          match_date: string
          match_time: string | null
          matchday: number
          notes: string | null
          schedule_id: number | null
          venue_id: number | null
        }
        Insert: {
          away_team_id?: number | null
          created_at?: string | null
          home_team_id?: number | null
          manual_match_id?: number
          match_date: string
          match_time?: string | null
          matchday: number
          notes?: string | null
          schedule_id?: number | null
          venue_id?: number | null
        }
        Update: {
          away_team_id?: number | null
          created_at?: string | null
          home_team_id?: number | null
          manual_match_id?: number
          match_date?: string
          match_time?: string | null
          matchday?: number
          notes?: string | null
          schedule_id?: number | null
          venue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_schedule_matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "manual_schedule_matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "manual_schedule_matches_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "manual_competition_schedules"
            referencedColumns: ["schedule_id"]
          },
          {
            foreignKeyName: "manual_schedule_matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      matches: {
        Row: {
          away_players: Json | null
          away_score: number | null
          away_team_id: number | null
          created_at: string | null
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
          updated_at: string | null
        }
        Insert: {
          away_players?: Json | null
          away_score?: number | null
          away_team_id?: number | null
          created_at?: string | null
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
          updated_at?: string | null
        }
        Update: {
          away_players?: Json | null
          away_score?: number | null
          away_team_id?: number | null
          created_at?: string | null
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
          updated_at?: string | null
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
      player_list_lock_settings: {
        Row: {
          created_at: string | null
          created_by: number | null
          id: number
          is_active: boolean | null
          lock_from_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean | null
          lock_from_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean | null
          lock_from_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_list_lock_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string
          first_name: string
          is_locked: boolean | null
          last_name: string
          locked_from_date: string | null
          player_id: number
          red_cards: number | null
          team_id: number | null
          yellow_cards: number | null
        }
        Insert: {
          birth_date: string
          first_name: string
          is_locked?: boolean | null
          last_name: string
          locked_from_date?: string | null
          player_id?: number
          red_cards?: number | null
          team_id?: number | null
          yellow_cards?: number | null
        }
        Update: {
          birth_date?: string
          first_name?: string
          is_locked?: boolean | null
          last_name?: string
          locked_from_date?: string | null
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
      tab_visibility_settings: {
        Row: {
          created_at: string | null
          id: number
          is_visible: boolean
          requires_login: boolean
          setting_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_visible?: boolean
          requires_login?: boolean
          setting_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_visible?: boolean
          requires_login?: boolean
          setting_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_preferences: {
        Row: {
          blackout_dates: string[] | null
          created_at: string | null
          id: number
          max_travel_distance: number | null
          notes: string | null
          preferred_home_day: number | null
          preferred_time_slot: string | null
          team_id: number | null
        }
        Insert: {
          blackout_dates?: string[] | null
          created_at?: string | null
          id?: number
          max_travel_distance?: number | null
          notes?: string | null
          preferred_home_day?: number | null
          preferred_time_slot?: string | null
          team_id?: number | null
        }
        Update: {
          blackout_dates?: string[] | null
          created_at?: string | null
          id?: number
          max_travel_distance?: number | null
          notes?: string | null
          preferred_home_day?: number | null
          preferred_time_slot?: string | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_transactions: {
        Row: {
          amount: number
          cost_setting_id: number | null
          created_at: string | null
          created_by: number | null
          description: string | null
          id: number
          match_id: number | null
          penalty_type_id: number | null
          team_id: number | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          cost_setting_id?: number | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          match_id?: number | null
          penalty_type_id?: number | null
          team_id?: number | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          cost_setting_id?: number | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          match_id?: number | null
          penalty_type_id?: number | null
          team_id?: number | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_transactions_cost_setting_id_fkey"
            columns: ["cost_setting_id"]
            isOneToOne: false
            referencedRelation: "cost_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_transactions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "team_transactions_team_id_fkey"
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
          balance: number | null
          team_id: number
          team_name: string
        }
        Insert: {
          balance?: number | null
          team_id?: number
          team_name: string
        }
        Update: {
          balance?: number | null
          team_id?: number
          team_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: number
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: number
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: number
          username?: string
        }
        Relationships: []
      }
      vacation_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: number
          is_active: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: number
          is_active?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: number
          is_active?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      venue_timeslots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          start_time: string
          timeslot_id: number
          venue_id: number | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          start_time: string
          timeslot_id?: number
          venue_id?: number | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          start_time?: string
          timeslot_id?: number
          venue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_timeslots_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          created_at: string | null
          name: string
          venue_id: number
        }
        Insert: {
          address: string
          created_at?: string | null
          name: string
          venue_id?: number
        }
        Update: {
          address?: string
          created_at?: string | null
          name?: string
          venue_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_team_balance: {
        Args: { team_id_param: number }
        Returns: number
      }
      calculate_team_balance_updated: {
        Args: { team_id_param: number }
        Returns: number
      }
      create_user_with_hashed_password: {
        Args: {
          username_param: string
          email_param: string
          password_param: string
          role_param?: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          created_at: string | null
          email: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: number
          username: string
        }
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_player_list_locked: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_competition_standings: {
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
