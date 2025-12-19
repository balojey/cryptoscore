export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          email?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          entry_fee: number
          end_time: string
          status: 'active' | 'resolved' | 'cancelled'
          resolution_outcome: string | null
          total_pool: number
          platform_fee_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          entry_fee: number
          end_time: string
          status?: 'active' | 'resolved' | 'cancelled'
          resolution_outcome?: string | null
          total_pool?: number
          platform_fee_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          entry_fee?: number
          end_time?: string
          status?: 'active' | 'resolved' | 'cancelled'
          resolution_outcome?: string | null
          total_pool?: number
          platform_fee_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      participants: {
        Row: {
          id: string
          market_id: string
          user_id: string
          prediction: string
          entry_amount: number
          potential_winnings: number
          actual_winnings: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          market_id: string
          user_id: string
          prediction: string
          entry_amount: number
          potential_winnings: number
          actual_winnings?: number | null
          joined_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          user_id?: string
          prediction?: string
          entry_amount?: number
          potential_winnings?: number
          actual_winnings?: number | null
          joined_at?: string
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
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          market_id: string | null
          type: 'market_entry' | 'winnings' | 'platform_fee'
          amount: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id?: string | null
          type: 'market_entry' | 'winnings' | 'platform_fee'
          amount: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string | null
          type?: 'market_entry' | 'winnings' | 'platform_fee'
          amount?: number
          description?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          }
        ]
      }
      platform_config: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
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
      market_status: 'active' | 'resolved' | 'cancelled'
      transaction_type: 'market_entry' | 'winnings' | 'platform_fee'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}