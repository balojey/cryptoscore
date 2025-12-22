export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      markets: {
        Row: {
          away_team_id: number | null
          away_team_name: string | null
          created_at: string | null
          creator_id: string
          creator_reward_percentage: number | null
          description: string
          end_time: string
          entry_fee: number
          home_team_id: number | null
          home_team_name: string | null
          id: string
          match_id: number | null
          platform_fee_percentage: number | null
          resolution_outcome: string | null
          status: Database["public"]["Enums"]["market_status"] | null
          title: string
          total_pool: number | null
          updated_at: string | null
        }
        Insert: {
          away_team_id?: number | null
          away_team_name?: string | null
          created_at?: string | null
          creator_id: string
          creator_reward_percentage?: number | null
          description: string
          end_time: string
          entry_fee: number
          home_team_id?: number | null
          home_team_name?: string | null
          id?: string
          match_id?: number | null
          platform_fee_percentage?: number | null
          resolution_outcome?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          title: string
          total_pool?: number | null
          updated_at?: string | null
        }
        Update: {
          away_team_id?: number | null
          away_team_name?: string | null
          created_at?: string | null
          creator_id?: string
          creator_reward_percentage?: number | null
          description?: string
          end_time?: string
          entry_fee?: number
          home_team_id?: number | null
          home_team_name?: string | null
          id?: string
          match_id?: number | null
          platform_fee_percentage?: number | null
          resolution_outcome?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          title?: string
          total_pool?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "markets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mnee_balances: {
        Row: {
          address: string
          balance_atomic: number
          balance_decimal: number
          created_at: string | null
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          address: string
          balance_atomic?: number
          balance_decimal?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          address?: string
          balance_atomic?: number
          balance_decimal?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mnee_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          actual_winnings: number | null
          entry_amount: number
          id: string
          joined_at: string | null
          market_id: string
          potential_winnings: number
          prediction: string
          user_id: string
        }
        Insert: {
          actual_winnings?: number | null
          entry_amount: number
          id?: string
          joined_at?: string | null
          market_id: string
          potential_winnings: number
          prediction: string
          user_id: string
        }
        Update: {
          actual_winnings?: number | null
          entry_amount?: number
          id?: string
          joined_at?: string | null
          market_id?: string
          potential_winnings?: number
          prediction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          market_id: string | null
          metadata: Json | null
          mnee_transaction_id: string | null
          status: string | null
          ticket_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          market_id?: string | null
          metadata?: Json | null
          mnee_transaction_id?: string | null
          status?: string | null
          ticket_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          market_id?: string | null
          metadata?: Json | null
          mnee_transaction_id?: string | null
          status?: string | null
          ticket_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atomic_to_mnee: { Args: { atomic_amount: number }; Returns: number }
      get_market_match_data: {
        Args: { market_id_param: string }
        Returns: {
          away_team_id: number
          away_team_name: string
          home_team_id: number
          home_team_name: string
          match_id: number
          status: Database["public"]["Enums"]["market_status"]
        }[]
      }
      get_mnee_balance_cache: {
        Args: { address_param: string; user_id_param: string }
        Returns: {
          balance_atomic: number
          balance_decimal: number
          last_updated: string
        }[]
      }
      mnee_to_atomic: { Args: { mnee_amount: number }; Returns: number }
      resolve_market: {
        Args: { market_id_param: string; winning_outcome: string }
        Returns: {
          participant_id: string
          user_id: string
          winnings: number
        }[]
      }
      update_market_status_from_api: {
        Args: {
          match_id_param: number
          new_status: Database["public"]["Enums"]["market_status"]
        }
        Returns: boolean
      }
      update_mnee_balance_cache: {
        Args: {
          address_param: string
          balance_atomic_param: number
          user_id_param: string
        }
        Returns: undefined
      }
    }
    Enums: {
      market_status:
        | "SCHEDULED"
        | "LIVE"
        | "IN_PLAY"
        | "PAUSED"
        | "FINISHED"
        | "POSTPONED"
        | "CANCELLED"
        | "SUSPENDED"
      transaction_type:
        | "market_entry"
        | "winnings"
        | "platform_fee"
        | "creator_reward"
        | "automated_transfer"
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
      market_status: [
        "SCHEDULED",
        "LIVE",
        "IN_PLAY",
        "PAUSED",
        "FINISHED",
        "POSTPONED",
        "CANCELLED",
        "SUSPENDED",
      ],
      transaction_type: [
        "market_entry",
        "winnings",
        "platform_fee",
        "creator_reward",
        "automated_transfer",
      ],
    },
  },
} as const
// Convenience types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type Market = Database['public']['Tables']['markets']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type PlatformConfig = Database['public']['Tables']['platform_config']['Row']
export type MneeBalance = Database['public']['Tables']['mnee_balances']['Row']

export type CreateUser = Database['public']['Tables']['users']['Insert']
export type CreateMarket = Database['public']['Tables']['markets']['Insert']
export type CreateParticipant = Database['public']['Tables']['participants']['Insert']
export type CreateTransaction = Database['public']['Tables']['transactions']['Insert']
export type CreateMneeBalance = Database['public']['Tables']['mnee_balances']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateMarket = Database['public']['Tables']['markets']['Update']
export type UpdateParticipant = Database['public']['Tables']['participants']['Update']
export type UpdateMneeBalance = Database['public']['Tables']['mnee_balances']['Update']

// Enum types for easier usage
export type MarketStatus = Database['public']['Enums']['market_status']
export type TransactionType = Database['public']['Enums']['transaction_type']