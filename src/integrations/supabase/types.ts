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
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          ai_provider: string
          context_used: Json | null
          created_at: string
          feedback_score: number | null
          id: string
          input: string
          output: string
          processing_time_ms: number | null
          prompt_id: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          ai_provider: string
          context_used?: Json | null
          created_at?: string
          feedback_score?: number | null
          id?: string
          input: string
          output: string
          processing_time_ms?: number | null
          prompt_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          ai_provider?: string
          context_used?: Json | null
          created_at?: string
          feedback_score?: number | null
          id?: string
          input?: string
          output?: string
          processing_time_ms?: number | null
          prompt_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "system_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memories: {
        Row: {
          access_count: number | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          last_accessed: string | null
          memory_type: string | null
          metadata: Json | null
          relevance_score: number | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          access_count?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          memory_type?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          access_count?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          memory_type?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          ip_address: unknown | null
          page_url: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          level: string
          message: string
          metadata: Json | null
          session_id: string | null
          source: string | null
          stack_trace: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          level: string
          message: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          stack_trace?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          level?: string
          message?: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          stack_trace?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brain_context: {
        Row: {
          access_count: number | null
          context_data: Json
          context_key: string
          created_at: string
          embedding: string | null
          id: string
          last_accessed: string | null
          relevance_weights: Json | null
          updated_at: string
        }
        Insert: {
          access_count?: number | null
          context_data: Json
          context_key: string
          created_at?: string
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          relevance_weights?: Json | null
          updated_at?: string
        }
        Update: {
          access_count?: number | null
          context_data?: Json
          context_key?: string
          created_at?: string
          embedding?: string | null
          id?: string
          last_accessed?: string | null
          relevance_weights?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string
          id: string
          last_activity_at: string | null
          lead_score: number | null
          message: string
          name: string
          priority: string | null
          status: string | null
          subject: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email: string
          id?: string
          last_activity_at?: string | null
          lead_score?: number | null
          message: string
          name: string
          priority?: string | null
          status?: string | null
          subject: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string
          id?: string
          last_activity_at?: string | null
          lead_score?: number | null
          message?: string
          name?: string
          priority?: string | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          metadata: Json | null
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_relevance_scores: {
        Row: {
          article_id: string | null
          context_factors: Json | null
          created_at: string
          id: string
          reasoning: string | null
          relevance_score: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          context_factors?: Json | null
          created_at?: string
          id?: string
          reasoning?: string | null
          relevance_score: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          context_factors?: Json | null
          created_at?: string
          id?: string
          reasoning?: string | null
          relevance_score?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_relevance_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_logs: {
        Row: {
          content: string
          context_data: Json | null
          conversation_type: string | null
          created_at: string
          id: string
          sentiment_score: number | null
          session_id: string | null
          topics: string[] | null
          user_id: string | null
        }
        Insert: {
          content: string
          context_data?: Json | null
          conversation_type?: string | null
          created_at?: string
          id?: string
          sentiment_score?: number | null
          session_id?: string | null
          topics?: string[] | null
          user_id?: string | null
        }
        Update: {
          content?: string
          context_data?: Json | null
          conversation_type?: string | null
          created_at?: string
          id?: string
          sentiment_score?: number | null
          session_id?: string | null
          topics?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          activity_type: string
          created_at: string
          deal_id: string
          description: string
          id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          deal_id: string
          description: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          deal_id?: string
          description?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assigned_to: string
          contact_id: string | null
          created_at: string
          currency: string | null
          custom_fields: Json | null
          deal_status: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          pipeline_id: string
          probability: number | null
          stage_id: string
          tags: string[] | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to: string
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          deal_status?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          pipeline_id: string
          probability?: number | null
          stage_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          deal_status?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          pipeline_id?: string
          probability?: number | null
          stage_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          sender_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dev_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_threads: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          browser_info: Json | null
          created_at: string
          device_type: string
          id: string
          is_active: boolean
          last_used: string
          token: string
          user_id: string
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string
          device_type: string
          id?: string
          is_active?: boolean
          last_used?: string
          token: string
          user_id: string
        }
        Update: {
          browser_info?: Json | null
          created_at?: string
          device_type?: string
          id?: string
          is_active?: boolean
          last_used?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_key: string
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_key: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_key?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      files: {
        Row: {
          bucket_name: string
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string | null
          name: string
          original_name: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          original_name: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          original_name?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          form_data: Json
          form_name: string
          id: string
          ip_address: unknown | null
          status: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          form_data: Json
          form_name: string
          id?: string
          ip_address?: unknown | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          form_data?: Json
          form_name?: string
          id?: string
          ip_address?: unknown | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          lead_id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          lead_id: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          source_type: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          source_type?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          source_type?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string
          first_name: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          lead_score: number | null
          lead_source_id: string | null
          lead_status: string
          notes: string | null
          phone: string | null
          qualification_status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source_id?: string | null
          lead_status?: string
          notes?: string | null
          phone?: string | null
          qualification_status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source_id?: string | null
          lead_status?: string
          notes?: string | null
          phone?: string | null
          qualification_status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: string
          identifier: string
          ip_address: unknown | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type?: string
          created_at?: string
          id?: string
          identifier: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: string
          identifier?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message_type: string | null
          priority: string | null
          recipient_id: string | null
          sender_id: string
          subject: string
          updated_at: string
          video_room_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          priority?: string | null
          recipient_id?: string | null
          sender_id: string
          subject: string
          updated_at?: string
          video_room_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          priority?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
          video_room_id?: string | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          ai_relevance_score: number | null
          category_id: string | null
          content: string | null
          created_at: string
          engagement_score: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          published_at: string | null
          source: string
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          trending_score: number | null
          updated_at: string
        }
        Insert: {
          ai_relevance_score?: number | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          published_at?: string | null
          source: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          trending_score?: number | null
          updated_at?: string
        }
        Update: {
          ai_relevance_score?: number | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          published_at?: string | null
          source?: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          trending_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          content: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: string
          priority_level: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          priority_level?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          priority_level?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          notification_type: string
          payload: Json
          priority: string
          processed_at: string | null
          retry_count: number
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          notification_type: string
          payload: Json
          priority?: string
          processed_at?: string | null
          retry_count?: number
          scheduled_for?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          notification_type?: string
          payload?: Json
          priority?: string
          processed_at?: string | null
          retry_count?: number
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          subject_template: string | null
          template_key: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          subject_template?: string | null
          template_key: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subject_template?: string | null
          template_key?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_closed_lost: boolean | null
          is_closed_won: boolean | null
          name: string
          pipeline_id: string
          probability: number | null
          stage_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          name: string
          pipeline_id: string
          probability?: number | null
          stage_order: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          name?: string
          pipeline_id?: string
          probability?: number | null
          stage_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action_type: string
          count?: number
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action_type?: string
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          keywords: string[] | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_path: string
          robots: string | null
          schema_markup: Json | null
          title: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path: string
          robots?: string | null
          schema_markup?: Json | null
          title?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path?: string
          robots?: string | null
          schema_markup?: Json | null
          title?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          ai_provider: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          parameters: Json | null
          prompt_template: string
          updated_at: string
          version: number
        }
        Insert: {
          ai_provider?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json | null
          prompt_template: string
          updated_at?: string
          version?: number
        }
        Update: {
          ai_provider?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json | null
          prompt_template?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          id: string
          is_typing: boolean | null
          last_updated: string | null
          recipient_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          last_updated?: string | null
          recipient_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          last_updated?: string | null
          recipient_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          metadata: Json | null
          pre_assigned_role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          metadata?: Json | null
          pre_assigned_role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          metadata?: Json | null
          pre_assigned_role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          custom_status: string | null
          id: string
          last_seen: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          custom_status?: string | null
          id?: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          custom_status?: string | null
          id?: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reading_behavior: {
        Row: {
          action_type: string
          article_id: string | null
          created_at: string
          id: string
          interaction_data: Json | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          article_id?: string | null
          created_at?: string
          id?: string
          interaction_data?: Json | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          article_id?: string | null
          created_at?: string
          id?: string
          interaction_data?: Json | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_behavior_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_account_lockout: {
        Args: {
          p_identifier: string
          p_max_attempts?: number
          p_lockout_minutes?: number
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_action_type: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_application_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_security_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: {
          anomaly_type: string
          user_id: string
          details: Json
          severity: string
          detected_at: string
        }[]
      }
      find_similar_memories: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          memory_type: string
          similarity: number
          relevance_score: number
        }[]
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_prompt: {
        Args: { provider_name?: string }
        Returns: {
          id: string
          name: string
          prompt_template: string
          parameters: Json
        }[]
      }
      get_articles_by_category: {
        Args: { category_name: string; limit_count?: number }
        Returns: {
          id: string
          title: string
          summary: string
          source: string
          source_url: string
          published_at: string
          ai_relevance_score: number
          engagement_score: number
        }[]
      }
      get_brain_context: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          context_key: string
          context_data: Json
          similarity: number
        }[]
      }
      get_brand_setting: {
        Args: { setting_key_param: string }
        Returns: Json
      }
      get_trending_articles: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          title: string
          summary: string
          source: string
          source_url: string
          published_at: string
          category_name: string
          category_color: string
          trending_score: number
          engagement_score: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_valid_uuid: {
        Args: { input_text: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_admin_action: {
        Args: {
          admin_user_id: string
          action_type: string
          resource_type?: string
          resource_id?: string
          metadata?: Json
        }
        Returns: undefined
      }
      log_application_event: {
        Args: {
          p_level: string
          p_message: string
          p_source?: string
          p_stack_trace?: string
          p_metadata?: Json
          p_session_id?: string
          p_user_agent?: string
          p_ip_address?: unknown
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          event_type: string
          user_id?: string
          details?: Json
          ip_address?: unknown
        }
        Returns: undefined
      }
      log_user_interaction: {
        Args: {
          p_user_id: string
          p_article_id: string
          p_action_type: string
          p_time_spent?: number
          p_interaction_data?: Json
        }
        Returns: undefined
      }
      mark_message_read: {
        Args: { message_uuid: string; reader_uuid: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      track_context_access: {
        Args: { context_key_param: string }
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_session_id: string; p_user_id?: string }
        Returns: undefined
      }
      update_user_presence: {
        Args: { user_uuid: string; new_status?: string }
        Returns: undefined
      }
      validate_admin_access: {
        Args: { user_id: string }
        Returns: boolean
      }
      validate_admin_operation: {
        Args: { operation_type: string; resource_id?: string }
        Returns: boolean
      }
      validate_file_upload: {
        Args: {
          file_name: string
          file_size: number
          mime_type: string
          user_id?: string
        }
        Returns: Json
      }
      validate_file_upload_enhanced: {
        Args: {
          file_name: string
          file_size: number
          mime_type: string
          file_content?: string
          user_id?: string
        }
        Returns: Json
      }
      validate_file_upload_strict: {
        Args: {
          file_name: string
          file_size: number
          mime_type: string
          user_id?: string
        }
        Returns: Json
      }
      validate_invitation_acceptance: {
        Args: { invitation_token: string; accepting_email: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
