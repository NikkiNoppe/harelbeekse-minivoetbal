export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
            foreignKeyName: "available_dates_venue_id_fkey"
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
      cards: {
        Row: {
          card_id: number
          card_time: string
          card_type: Database["public"]["Enums"]["card_type"]
          match_id: number | null
          penalty_cost: number
          player_id: number | null
        }
        Insert: {
          card_id?: number
          card_time: string
          card_type: Database["public"]["Enums"]["card_type"]
          match_id?: number | null
          penalty_cost: number
          player_id?: number | null
        }
        Update: {
          card_id?: number
          card_time?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          match_id?: number | null
          penalty_cost?: number
          player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "cards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["player_id"]
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
            isOneToOne: false
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
      holiday_periods: {
        Row: {
          created_at: string | null
          end_date: string
          holiday_id: number
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          holiday_id?: number
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          holiday_id?: number
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      match_form_players: {
        Row: {
          created_at: string | null
          form_id: number
          form_player_id: number
          is_captain: boolean | null
          jersey_number: number
          player_id: number
        }
        Insert: {
          created_at?: string | null
          form_id: number
          form_player_id?: number
          is_captain?: boolean | null
          jersey_number: number
          player_id: number
        }
        Update: {
          created_at?: string | null
          form_id?: number
          form_player_id?: number
          is_captain?: boolean | null
          jersey_number?: number
          player_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_form_players_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "match_forms"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "match_form_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["player_id"]
          },
        ]
      }
      match_forms: {
        Row: {
          created_at: string | null
          form_id: number
          is_submitted: boolean | null
          match_id: number
          team_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_id?: number
          is_submitted?: boolean | null
          match_id: number
          team_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: number
          is_submitted?: boolean | null
          match_id?: number
          team_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_forms_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_forms_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      match_players: {
        Row: {
          jersey_number: number
          match_id: number | null
          match_player_id: number
          player_id: number | null
        }
        Insert: {
          jersey_number: number
          match_id?: number | null
          match_player_id?: number
          player_id?: number | null
        }
        Update: {
          jersey_number?: number
          match_id?: number | null
          match_player_id?: number
          player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["player_id"]
          },
        ]
      }
      matchdays: {
        Row: {
          competition_id: number | null
          is_playoff: boolean | null
          matchday_date: string
          matchday_id: number
          name: string
          playoff_stage: string | null
        }
        Insert: {
          competition_id?: number | null
          is_playoff?: boolean | null
          matchday_date: string
          matchday_id?: number
          name: string
          playoff_stage?: string | null
        }
        Update: {
          competition_id?: number | null
          is_playoff?: boolean | null
          matchday_date?: string
          matchday_id?: number
          name?: string
          playoff_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matchdays_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: number | null
          field_cost: number
          home_team_id: number | null
          is_cup_match: boolean | null
          match_date: string
          match_id: number
          matchday_id: number | null
          referee_cost: number
          result: string | null
          unique_number: string | null
        }
        Insert: {
          away_team_id?: number | null
          field_cost: number
          home_team_id?: number | null
          is_cup_match?: boolean | null
          match_date: string
          match_id?: number
          matchday_id?: number | null
          referee_cost: number
          result?: string | null
          unique_number?: string | null
        }
        Update: {
          away_team_id?: number | null
          field_cost?: number
          home_team_id?: number | null
          is_cup_match?: boolean | null
          match_date?: string
          match_id?: number
          matchday_id?: number | null
          referee_cost?: number
          result?: string | null
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
          {
            foreignKeyName: "matches_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["matchday_id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string
          first_name: string
          is_active: boolean | null
          last_name: string
          player_id: number
          team_id: number | null
        }
        Insert: {
          birth_date: string
          first_name: string
          is_active?: boolean | null
          last_name: string
          player_id?: number
          team_id?: number | null
        }
        Update: {
          birth_date?: string
          first_name?: string
          is_active?: boolean | null
          last_name?: string
          player_id?: number
          team_id?: number | null
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
      suspensions: {
        Row: {
          end_date: string
          player_id: number | null
          start_date: string
          suspension_id: number
        }
        Insert: {
          end_date: string
          player_id?: number | null
          start_date: string
          suspension_id?: number
        }
        Update: {
          end_date?: string
          player_id?: number | null
          start_date?: string
          suspension_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "suspensions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["player_id"]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
