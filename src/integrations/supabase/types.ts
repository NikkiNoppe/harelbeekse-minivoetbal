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
      matches: {
        Row: {
          away_team_id: number | null
          field_cost: number
          home_team_id: number | null
          match_date: string
          match_id: number
          referee_cost: number
          result: string | null
        }
        Insert: {
          away_team_id?: number | null
          field_cost: number
          home_team_id?: number | null
          match_date: string
          match_id?: number
          referee_cost: number
          result?: string | null
        }
        Update: {
          away_team_id?: number | null
          field_cost?: number
          home_team_id?: number | null
          match_date?: string
          match_id?: number
          referee_cost?: number
          result?: string | null
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
          is_active: boolean | null
          player_id: number
          player_name: string
          team_id: number | null
        }
        Insert: {
          birth_date: string
          is_active?: boolean | null
          player_id?: number
          player_name: string
          team_id?: number | null
        }
        Update: {
          birth_date?: string
          is_active?: boolean | null
          player_id?: number
          player_name?: string
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
      regulations: {
        Row: {
          content: string
          regulation_id: number
          title: string
        }
        Insert: {
          content: string
          regulation_id?: number
          title: string
        }
        Update: {
          content?: string
          regulation_id?: number
          title?: string
        }
        Relationships: []
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
      teams: {
        Row: {
          balance: number | null
          player_manager_id: number | null
          team_id: number
          team_name: string
        }
        Insert: {
          balance?: number | null
          player_manager_id?: number | null
          team_id?: number
          team_name: string
        }
        Update: {
          balance?: number | null
          player_manager_id?: number | null
          team_id?: number
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_player_manager_id_fkey"
            columns: ["player_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: number
          username: string
        }
        Insert: {
          created_at?: string | null
          password: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: number
          username: string
        }
        Update: {
          created_at?: string | null
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
      [_ in never]: never
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
