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
      ai_assistants: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fallback_behavior: string | null
          id: string
          knowledge_base_id: string | null
          language: string
          model: string
          name: string
          objective: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["ai_entity_status"]
          system_instructions: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_behavior?: string | null
          id?: string
          knowledge_base_id?: string | null
          language?: string
          model?: string
          name: string
          objective?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["ai_entity_status"]
          system_instructions?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_behavior?: string | null
          id?: string
          knowledge_base_id?: string | null
          language?: string
          model?: string
          name?: string
          objective?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["ai_entity_status"]
          system_instructions?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistants_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_assistants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          ai_requests: number
          chat_messages: number
          created_at: string
          documents_processed: number
          id: string
          input_tokens: number
          output_tokens: number
          period_month: string
          request_limit: number
          updated_at: string
          user_id: string
          voice_calls: number
          workflow_executions: number
        }
        Insert: {
          ai_requests?: number
          chat_messages?: number
          created_at?: string
          documents_processed?: number
          id?: string
          input_tokens?: number
          output_tokens?: number
          period_month: string
          request_limit?: number
          updated_at?: string
          user_id: string
          voice_calls?: number
          workflow_executions?: number
        }
        Update: {
          ai_requests?: number
          chat_messages?: number
          created_at?: string
          documents_processed?: number
          id?: string
          input_tokens?: number
          output_tokens?: number
          period_month?: string
          request_limit?: number
          updated_at?: string
          user_id?: string
          voice_calls?: number
          workflow_executions?: number
        }
        Relationships: []
      }
      automation_activity_logs: {
        Row: {
          actor: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          level: string
          message: string
          metadata: Json
          user_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          level?: string
          message: string
          metadata?: Json
          user_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      chatbots: {
        Row: {
          assistant_id: string | null
          business_info: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          fallback_message: string
          id: string
          knowledge_base_id: string | null
          language: string
          model: string
          name: string
          status: Database["public"]["Enums"]["ai_entity_status"]
          system_prompt: string
          tone: string
          updated_at: string
          user_id: string
          welcome_message: string
          working_hours: string | null
        }
        Insert: {
          assistant_id?: string | null
          business_info?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          fallback_message?: string
          id?: string
          knowledge_base_id?: string | null
          language?: string
          model?: string
          name: string
          status?: Database["public"]["Enums"]["ai_entity_status"]
          system_prompt?: string
          tone?: string
          updated_at?: string
          user_id: string
          welcome_message?: string
          working_hours?: string | null
        }
        Update: {
          assistant_id?: string | null
          business_info?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          fallback_message?: string
          id?: string
          knowledge_base_id?: string | null
          language?: string
          model?: string
          name?: string
          status?: Database["public"]["Enums"]["ai_entity_status"]
          system_prompt?: string
          tone?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          id: string
          mime_type: string | null
          name: string
          owner_id: string
          project_id: string | null
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          owner_id: string
          project_id?: string | null
          size_bytes?: number
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          owner_id?: string
          project_id?: string | null
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          is_subscription: boolean
          issue_date: string
          line_items: Json
          owner_id: string
          paid_at: string | null
          payment_link: string | null
          payment_reference: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_interval: string | null
          tax_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          is_subscription?: boolean
          issue_date?: string
          line_items?: Json
          owner_id: string
          paid_at?: string | null
          payment_link?: string | null
          payment_reference?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_interval?: string | null
          tax_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          is_subscription?: boolean
          issue_date?: string
          line_items?: Json
          owner_id?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_reference?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_interval?: string | null
          tax_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          extracted_chars: number
          id: string
          knowledge_base_id: string
          mime_type: string | null
          name: string
          processing_error: string | null
          processing_status: Database["public"]["Enums"]["doc_processing_status"]
          size_bytes: number
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          extracted_chars?: number
          id?: string
          knowledge_base_id: string
          mime_type?: string | null
          name: string
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["doc_processing_status"]
          size_bytes?: number
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          extracted_chars?: number
          id?: string
          knowledge_base_id?: string
          mime_type?: string | null
          name?: string
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["doc_processing_status"]
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
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
      meetings: {
        Row: {
          agenda: string | null
          calendar_error: string | null
          calendar_event_id: string | null
          calendar_status: string
          cancelled_reason: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          meet_link: string | null
          owner_id: string
          project_id: string | null
          reminder_sent_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          calendar_error?: string | null
          calendar_event_id?: string | null
          calendar_status?: string
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          meet_link?: string | null
          owner_id: string
          project_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["meeting_status"]
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          calendar_error?: string | null
          calendar_event_id?: string | null
          calendar_status?: string
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          meet_link?: string | null
          owner_id?: string
          project_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      prompts: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["prompt_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_favorite: boolean
          title: string
          updated_at: string
          user_id: string
          variables: Json
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          title: string
          updated_at?: string
          user_id: string
          variables?: Json
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          variables?: Json
        }
        Relationships: []
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
      ticket_messages: {
        Row: {
          attachments: Json
          author_id: string | null
          author_role: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          author_role?: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          last_reply_at: string
          owner_id: string
          priority: Database["public"]["Enums"]["lead_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          last_reply_at?: string
          owner_id: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_reply_at?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      voice_agents: {
        Row: {
          assistant_id: string | null
          business_hours: string | null
          business_name: string | null
          call_objective: string | null
          created_at: string
          created_by: string | null
          fallback_message: string | null
          greeting: string | null
          id: string
          language: string
          missed_calls: number
          name: string
          provider: string | null
          status: Database["public"]["Enums"]["ai_entity_status"]
          successful_calls: number
          system_instructions: string
          total_call_seconds: number
          total_calls: number
          updated_at: string
          user_id: string
          voice: string
        }
        Insert: {
          assistant_id?: string | null
          business_hours?: string | null
          business_name?: string | null
          call_objective?: string | null
          created_at?: string
          created_by?: string | null
          fallback_message?: string | null
          greeting?: string | null
          id?: string
          language?: string
          missed_calls?: number
          name: string
          provider?: string | null
          status?: Database["public"]["Enums"]["ai_entity_status"]
          successful_calls?: number
          system_instructions?: string
          total_call_seconds?: number
          total_calls?: number
          updated_at?: string
          user_id: string
          voice?: string
        }
        Update: {
          assistant_id?: string | null
          business_hours?: string | null
          business_name?: string | null
          call_objective?: string | null
          created_at?: string
          created_by?: string | null
          fallback_message?: string | null
          greeting?: string | null
          id?: string
          language?: string
          missed_calls?: number
          name?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["ai_entity_status"]
          successful_calls?: number
          system_instructions?: string
          total_call_seconds?: number
          total_calls?: number
          updated_at?: string
          user_id?: string
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_agents_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["execution_status"]
          steps: Json
          trigger_payload: Json
          user_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          steps?: Json
          trigger_payload?: Json
          user_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          steps?: Json
          trigger_payload?: Json
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          action_type:
            | Database["public"]["Enums"]["workflow_action_type"]
            | null
          config: Json
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["workflow_node_kind"]
          label: string
          position: number
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action_type?:
            | Database["public"]["Enums"]["workflow_action_type"]
            | null
          config?: Json
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["workflow_node_kind"]
          label: string
          position?: number
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action_type?:
            | Database["public"]["Enums"]["workflow_action_type"]
            | null
          config?: Json
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["workflow_node_kind"]
          label?: string
          position?: number
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          run_count: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
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
      can_access_lead: { Args: { _lead_id: string }; Returns: boolean }
      can_access_project: { Args: { _project_id: string }; Returns: boolean }
      can_access_ticket: { Args: { _ticket_id: string }; Returns: boolean }
      can_access_workflow: { Args: { _workflow_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_entity_status: "Draft" | "Active" | "Inactive" | "Archived"
      app_role: "admin" | "moderator" | "user"
      doc_processing_status: "Pending" | "Processing" | "Ready" | "Failed"
      execution_status: "Running" | "Success" | "Failed" | "Skipped"
      invoice_status: "Draft" | "Sent" | "Paid" | "Overdue" | "Void"
      lead_priority: "Low" | "Medium" | "High" | "Urgent"
      meeting_status:
        | "Requested"
        | "Scheduled"
        | "Rescheduled"
        | "Cancelled"
        | "Completed"
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
      prompt_category:
        | "Sales"
        | "Customer Support"
        | "Marketing"
        | "Lead Generation"
        | "Operations"
        | "General"
      ticket_status:
        | "Open"
        | "In Progress"
        | "Waiting on Customer"
        | "Resolved"
        | "Closed"
      workflow_action_type:
        | "Send Email"
        | "Create Task"
        | "Update Lead"
        | "Send Notification"
        | "AI Generate Response"
      workflow_node_kind: "trigger" | "action" | "condition" | "end"
      workflow_trigger_type:
        | "New Lead"
        | "Form Submitted"
        | "New Customer"
        | "Scheduled Time"
        | "Webhook"
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
      ai_entity_status: ["Draft", "Active", "Inactive", "Archived"],
      app_role: ["admin", "moderator", "user"],
      doc_processing_status: ["Pending", "Processing", "Ready", "Failed"],
      execution_status: ["Running", "Success", "Failed", "Skipped"],
      invoice_status: ["Draft", "Sent", "Paid", "Overdue", "Void"],
      lead_priority: ["Low", "Medium", "High", "Urgent"],
      meeting_status: [
        "Requested",
        "Scheduled",
        "Rescheduled",
        "Cancelled",
        "Completed",
      ],
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
      prompt_category: [
        "Sales",
        "Customer Support",
        "Marketing",
        "Lead Generation",
        "Operations",
        "General",
      ],
      ticket_status: [
        "Open",
        "In Progress",
        "Waiting on Customer",
        "Resolved",
        "Closed",
      ],
      workflow_action_type: [
        "Send Email",
        "Create Task",
        "Update Lead",
        "Send Notification",
        "AI Generate Response",
      ],
      workflow_node_kind: ["trigger", "action", "condition", "end"],
      workflow_trigger_type: [
        "New Lead",
        "Form Submitted",
        "New Customer",
        "Scheduled Time",
        "Webhook",
      ],
    },
  },
} as const
