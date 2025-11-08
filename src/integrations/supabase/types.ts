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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_earnings: {
        Row: {
          agent_name: string
          agent_phone: string
          amount: number
          created_at: string
          earning_type: string
          id: string
          payment_id: string | null
          tenant_id: string | null
        }
        Insert: {
          agent_name: string
          agent_phone: string
          amount: number
          created_at?: string
          earning_type: string
          id?: string
          payment_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          agent_name?: string
          agent_phone?: string
          amount?: number
          created_at?: string
          earning_type?: string
          id?: string
          payment_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_earnings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "daily_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_earnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_points: {
        Row: {
          agent_name: string
          agent_phone: string
          created_at: string
          description: string | null
          id: string
          points: number
          points_source: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          agent_phone: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          points_source: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          agent_phone?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          points_source?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_rewards: {
        Row: {
          agent_name: string
          agent_phone: string
          claimed_at: string
          fulfilled_at: string | null
          id: string
          notes: string | null
          points_cost: number
          reward_name: string
          status: string
        }
        Insert: {
          agent_name: string
          agent_phone: string
          claimed_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          points_cost: number
          reward_name: string
          status?: string
        }
        Update: {
          agent_name?: string
          agent_phone?: string
          claimed_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          points_cost?: number
          reward_name?: string
          status?: string
        }
        Relationships: []
      }
      authorized_recorders: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          modified_at: string | null
          modified_by: string | null
          paid: boolean
          paid_amount: number | null
          recorded_at: string | null
          recorded_by: string | null
          service_center: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          modified_at?: string | null
          modified_by?: string | null
          paid?: boolean
          paid_amount?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          service_center?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          modified_at?: string | null
          modified_by?: string | null
          paid?: boolean
          paid_amount?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          service_center?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          message: string
          read: boolean
          severity: string
          tenant_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          read?: boolean
          severity?: string
          tenant_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          read?: boolean
          severity?: string
          tenant_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      payment_forecasts: {
        Row: {
          collection_rate: number
          created_at: string
          days_ahead: number
          expected_amount: number
          forecast_amount: number
          forecast_date: string
          id: string
          target_date: string
        }
        Insert: {
          collection_rate: number
          created_at?: string
          days_ahead: number
          expected_amount: number
          forecast_amount: number
          forecast_date: string
          id?: string
          target_date: string
        }
        Update: {
          collection_rate?: number
          created_at?: string
          days_ahead?: number
          expected_amount?: number
          forecast_amount?: number
          forecast_date?: string
          id?: string
          target_date?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json
          id: string
          report_date: string
          report_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          report_date: string
          report_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          report_date?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_centers: {
        Row: {
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_comments: {
        Row: {
          comment_text: string
          commenter_name: string
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          comment_text: string
          commenter_name: string
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          comment_text?: string
          commenter_name?: string
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_service_center_transfers: {
        Row: {
          created_at: string
          from_service_center: string | null
          id: string
          notes: string | null
          reason: string | null
          tenant_id: string
          to_service_center: string
          transferred_at: string
          transferred_by: string
        }
        Insert: {
          created_at?: string
          from_service_center?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          tenant_id: string
          to_service_center: string
          transferred_at?: string
          transferred_by: string
        }
        Update: {
          created_at?: string
          from_service_center?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          tenant_id?: string
          to_service_center?: string
          transferred_at?: string
          transferred_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_service_center_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          access_fee: number
          address: string
          agent_name: string
          agent_phone: string
          contact: string
          created_at: string
          edited_at: string | null
          edited_by: string | null
          guarantor1_contact: string | null
          guarantor1_name: string | null
          guarantor2_contact: string | null
          guarantor2_name: string | null
          id: string
          landlord: string
          landlord_contact: string
          location_cell_or_village: string | null
          location_country: string | null
          location_county: string | null
          location_district: string | null
          location_subcounty_or_ward: string | null
          name: string
          payment_status: string
          performance: number
          registration_fee: number
          rent_amount: number
          repayment_days: number
          service_center: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_fee?: number
          address: string
          agent_name?: string
          agent_phone?: string
          contact: string
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          guarantor1_contact?: string | null
          guarantor1_name?: string | null
          guarantor2_contact?: string | null
          guarantor2_name?: string | null
          id?: string
          landlord: string
          landlord_contact: string
          location_cell_or_village?: string | null
          location_country?: string | null
          location_county?: string | null
          location_district?: string | null
          location_subcounty_or_ward?: string | null
          name: string
          payment_status: string
          performance?: number
          registration_fee?: number
          rent_amount: number
          repayment_days: number
          service_center?: string | null
          source?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          access_fee?: number
          address?: string
          agent_name?: string
          agent_phone?: string
          contact?: string
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          guarantor1_contact?: string | null
          guarantor1_name?: string | null
          guarantor2_contact?: string | null
          guarantor2_name?: string | null
          id?: string
          landlord?: string
          landlord_contact?: string
          location_cell_or_village?: string | null
          location_country?: string | null
          location_county?: string | null
          location_district?: string | null
          location_subcounty_or_ward?: string | null
          name?: string
          payment_status?: string
          performance?: number
          registration_fee?: number
          rent_amount?: number
          repayment_days?: number
          service_center?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          agent_name: string
          agent_phone: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_name: string
          agent_phone: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_name?: string
          agent_phone?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
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
      app_role: ["admin", "agent", "user"],
    },
  },
} as const
