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
      ai_actions: {
        Row: {
          action_type: string
          agent_role: string
          created_at: string
          id: string
          payload: Json | null
          reasoning: string | null
          result: Json | null
          run_id: string | null
          status: string
          target: string | null
          triggered_by: string
        }
        Insert: {
          action_type: string
          agent_role: string
          created_at?: string
          id?: string
          payload?: Json | null
          reasoning?: string | null
          result?: Json | null
          run_id?: string | null
          status?: string
          target?: string | null
          triggered_by?: string
        }
        Update: {
          action_type?: string
          agent_role?: string
          created_at?: string
          id?: string
          payload?: Json | null
          reasoning?: string | null
          result?: Json | null
          run_id?: string | null
          status?: string
          target?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      ai_org_runs: {
        Row: {
          actions_count: number
          completed_at: string | null
          error: string | null
          id: string
          started_at: string
          status: string
          summary: string | null
          triggered_by: string
        }
        Insert: {
          actions_count?: number
          completed_at?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          summary?: string | null
          triggered_by?: string
        }
        Update: {
          actions_count?: number
          completed_at?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          summary?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      ai_org_settings: {
        Row: {
          autonomous_enabled: boolean
          ceo_model: string
          daily_brief_hour: number
          id: number
          last_brief_date: string | null
          run_interval_minutes: number
          updated_at: string
          worker_model: string
        }
        Insert: {
          autonomous_enabled?: boolean
          ceo_model?: string
          daily_brief_hour?: number
          id?: number
          last_brief_date?: string | null
          run_interval_minutes?: number
          updated_at?: string
          worker_model?: string
        }
        Update: {
          autonomous_enabled?: boolean
          ceo_model?: string
          daily_brief_hour?: number
          id?: number
          last_brief_date?: string | null
          run_interval_minutes?: number
          updated_at?: string
          worker_model?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_feedback: {
        Row: {
          client_name: string | null
          comment: string | null
          created_at: string
          id: string
          invoice_id: string
          rating: number | null
        }
        Insert: {
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          rating?: number | null
        }
        Update: {
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_feedback_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number | null
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          due_date: string | null
          feedback_token: string | null
          id: string
          invoice_number: string | null
          job_description: string | null
          notes: string | null
          sent_count: number | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number | null
          total_amount: number | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          feedback_token?: string | null
          id?: string
          invoice_number?: string | null
          job_description?: string | null
          notes?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number | null
          total_amount?: number | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          feedback_token?: string | null
          id?: string
          invoice_number?: string | null
          job_description?: string | null
          notes?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number | null
          total_amount?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contact_info: string | null
          created_at: string
          date_posted: string | null
          estimate_id: string | null
          id: string
          job_description: string | null
          location: string | null
          post_url: string | null
          poster_name: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          date_posted?: string | null
          estimate_id?: string | null
          id?: string
          job_description?: string | null
          location?: string | null
          post_url?: string | null
          poster_name?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          date_posted?: string | null
          estimate_id?: string | null
          id?: string
          job_description?: string | null
          location?: string | null
          post_url?: string | null
          poster_name?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          brand_color: string | null
          business_name: string | null
          city: string | null
          col_multiplier: number | null
          country: string | null
          created_at: string
          email: string | null
          estimate_color: string | null
          id: string
          invoice_template: string
          logo_url: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          state: string | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string | null
          tax_rate: number | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          business_name?: string | null
          city?: string | null
          col_multiplier?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          estimate_color?: string | null
          id: string
          invoice_template?: string
          logo_url?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          tax_rate?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          business_name?: string | null
          city?: string | null
          col_multiplier?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          estimate_color?: string | null
          id?: string
          invoice_template?: string
          logo_url?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          tax_rate?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          comparison_count: number
          created_at: string
          estimate_count: number
          id: string
          invoice_count: number
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comparison_count?: number
          created_at?: string
          estimate_count?: number
          id?: string
          invoice_count?: number
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comparison_count?: number
          created_at?: string
          estimate_count?: number
          id?: string
          invoice_count?: number
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: Json
      }
      process_referral_reward: {
        Args: { p_referred_user_id: string }
        Returns: undefined
      }
      validate_feedback_token: {
        Args: { p_invoice_id: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      invoice_status: "draft" | "sent" | "paid" | "overdue"
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
      invoice_status: ["draft", "sent", "paid", "overdue"],
    },
  },
} as const
