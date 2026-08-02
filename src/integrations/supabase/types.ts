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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lead_activity: {
        Row: {
          actor: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string
          message: string
          metadata: Json
        }
        Insert: {
          actor?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          message: string
          metadata?: Json
        }
        Update: {
          actor?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          assigned_user: string | null
          calendar_error: string | null
          calendar_event_id: string | null
          calendar_event_link: string | null
          calendar_status: string
          closing_probability: number
          company_name: string
          company_size: string | null
          country: string
          created_at: string
          created_by: string | null
          customer_email_attempts: number
          customer_email_error: string | null
          customer_email_status: string
          email: string
          estimated_value: number
          full_name: string
          id: string
          industry: string | null
          last_contact: string | null
          lead_source: string
          lead_status: string
          meeting_date: string | null
          meeting_link: string | null
          next_followup: string | null
          notes: string | null
          owner_email_attempts: number
          owner_email_error: string | null
          owner_email_status: string
          phone: string
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          priority: Database["public"]["Enums"]["lead_priority"]
          project_description: string
          scheduled_at: string | null
          seen_at: string | null
          service: string
          source: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_user?: string | null
          calendar_error?: string | null
          calendar_event_id?: string | null
          calendar_event_link?: string | null
          calendar_status?: string
          closing_probability?: number
          company_name: string
          company_size?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          customer_email_attempts?: number
          customer_email_error?: string | null
          customer_email_status?: string
          email: string
          estimated_value?: number
          full_name: string
          id?: string
          industry?: string | null
          last_contact?: string | null
          lead_source?: string
          lead_status?: string
          meeting_date?: string | null
          meeting_link?: string | null
          next_followup?: string | null
          notes?: string | null
          owner_email_attempts?: number
          owner_email_error?: string | null
          owner_email_status?: string
          phone: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_description: string
          scheduled_at?: string | null
          seen_at?: string | null
          service: string
          source?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_user?: string | null
          calendar_error?: string | null
          calendar_event_id?: string | null
          calendar_event_link?: string | null
          calendar_status?: string
          closing_probability?: number
          company_name?: string
          company_size?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          customer_email_attempts?: number
          customer_email_error?: string | null
          customer_email_status?: string
          email?: string
          estimated_value?: number
          full_name?: string
          id?: string
          industry?: string | null
          last_contact?: string | null
          lead_source?: string
          lead_status?: string
          meeting_date?: string | null
          meeting_link?: string | null
          next_followup?: string | null
          notes?: string | null
          owner_email_attempts?: number
          owner_email_error?: string | null
          owner_email_status?: string
          phone?: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_description?: string
          scheduled_at?: string | null
          seen_at?: string | null
          service?: string
          source?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_timeline_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_team: string[]
          created_at: string
          created_by: string | null
          description: string | null
          expected_completion: string | null
          id: string
          lead_id: string | null
          name: string
          owner_id: string
          progress: number
          service_type: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          assigned_team?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          lead_id?: string | null
          name: string
          owner_id: string
          progress?: number
          service_type: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          assigned_team?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          owner_id?: string
          progress?: number
          service_type?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          priority: Database["public"]["Enums"]["lead_priority"]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_lead: { Args: { _lead_id: string }; Returns: boolean }
      can_access_project: { Args: { _project_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      lead_priority: "Low" | "Medium" | "High" | "Urgent"
      pipeline_stage:
        | "New"
        | "Contacted"
        | "Discovery Scheduled"
        | "Qualified"
        | "Proposal Sent"
        | "Negotiation"
        | "Won"
        | "Lost"
      project_status:
        | "Pending"
        | "Planning"
        | "Development"
        | "Testing"
        | "Deployment"
        | "Completed"
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
      app_role: ["admin", "moderator", "user"],
      lead_priority: ["Low", "Medium", "High", "Urgent"],
      pipeline_stage: [
        "New",
        "Contacted",
        "Discovery Scheduled",
        "Qualified",
        "Proposal Sent",
        "Negotiation",
        "Won",
        "Lost",
      ],
      project_status: [
        "Pending",
        "Planning",
        "Development",
        "Testing",
        "Deployment",
        "Completed",
      ],
    },
  },
} as const
