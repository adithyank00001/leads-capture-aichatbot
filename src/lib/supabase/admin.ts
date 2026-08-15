import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
          has_lifetime_access: boolean;
          lifetime_access_granted_at: string | null;
          dodo_payment_id: string | null;
          dodo_customer_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
          has_lifetime_access?: boolean;
          lifetime_access_granted_at?: string | null;
          dodo_payment_id?: string | null;
          dodo_customer_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          created_at?: string;
          has_lifetime_access?: boolean;
          lifetime_access_granted_at?: string | null;
          dodo_payment_id?: string | null;
          dodo_customer_id?: string | null;
        };
        Relationships: [];
      };
      pending_lifetime_purchases: {
        Row: {
          id: string;
          email: string;
          dodo_payment_id: string;
          dodo_customer_id: string | null;
          paid_at: string;
          claimed_at: string | null;
          claimed_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          dodo_payment_id: string;
          dodo_customer_id?: string | null;
          paid_at?: string;
          claimed_at?: string | null;
          claimed_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          dodo_payment_id?: string;
          dodo_customer_id?: string | null;
          paid_at?: string;
          claimed_at?: string | null;
          claimed_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bots: {
        Row: {
          id: string;
          bot_id: string;
          customer_id: string;
          business_name: string;
          is_active: boolean;
          monthly_message_limit: number;
          messages_used_this_period: number;
          leads_captured_this_period: number;
          billing_period_start: string;
          billing_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          customer_id: string;
          business_name?: string;
          is_active?: boolean;
          monthly_message_limit?: number;
          messages_used_this_period?: number;
          leads_captured_this_period?: number;
          billing_period_start?: string;
          billing_period_end?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          customer_id?: string;
          business_name?: string;
          is_active?: boolean;
          monthly_message_limit?: number;
          messages_used_this_period?: number;
          leads_captured_this_period?: number;
          billing_period_start?: string;
          billing_period_end?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_allowed_domains: {
        Row: {
          id: string;
          bot_id: string;
          domain: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          domain: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          domain?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_knowledge: {
        Row: {
          bot_id: string;
          description: string;
          location: string;
          services: string;
          pricing_notes: string;
          current_offer: string;
          opening_hours: string;
          contact_method: string;
          extra_notes: string;
          consent_text: string;
          privacy_policy_url: string | null;
          updated_at: string;
        };
        Insert: {
          bot_id: string;
          description?: string;
          location?: string;
          services?: string;
          pricing_notes?: string;
          current_offer?: string;
          opening_hours?: string;
          contact_method?: string;
          extra_notes?: string;
          consent_text?: string;
          privacy_policy_url?: string | null;
          updated_at?: string;
        };
        Update: {
          bot_id?: string;
          description?: string;
          location?: string;
          services?: string;
          pricing_notes?: string;
          current_offer?: string;
          opening_hours?: string;
          contact_method?: string;
          extra_notes?: string;
          consent_text?: string;
          privacy_policy_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bot_widget_settings: {
        Row: {
          bot_id: string;
          header_color: string;
          accent_color: string;
          lead_form_enabled: boolean;
          lead_fields: Json;
          updated_at: string;
        };
        Insert: {
          bot_id: string;
          header_color?: string;
          accent_color?: string;
          lead_form_enabled?: boolean;
          lead_fields?: Json;
          updated_at?: string;
        };
        Update: {
          bot_id?: string;
          header_color?: string;
          accent_color?: string;
          lead_form_enabled?: boolean;
          lead_fields?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_leads: {
        Row: {
          id: string;
          bot_id: string;
          name: string | null;
          phone: string | null;
          email: string | null;
          custom_fields: Record<string, string>;
          session_id: string;
          page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          custom_fields?: Record<string, string>;
          session_id: string;
          page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          custom_fields?: Record<string, string>;
          session_id?: string;
          page_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chatbot_messages: {
        Row: {
          id: string;
          bot_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          session_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_website_sources: {
        Row: {
          id: string;
          bot_id: string;
          website_url: string;
          status: "idle" | "discovering" | "processing" | "ready" | "partial" | "failed";
          total_pages: number;
          completed_pages: number;
          failed_pages: number;
          current_page_index: number;
          selected_urls: unknown | null;
          error_message: string | null;
          refresh_error_message: string | null;
          embedding_model: string | null;
          embedding_dimensions: number | null;
          last_processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          website_url?: string;
          status?: "idle" | "discovering" | "processing" | "ready" | "partial" | "failed";
          total_pages?: number;
          completed_pages?: number;
          failed_pages?: number;
          current_page_index?: number;
          selected_urls?: unknown | null;
          error_message?: string | null;
          refresh_error_message?: string | null;
          embedding_model?: string | null;
          embedding_dimensions?: number | null;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          website_url?: string;
          status?: "idle" | "discovering" | "processing" | "ready" | "partial" | "failed";
          total_pages?: number;
          completed_pages?: number;
          failed_pages?: number;
          current_page_index?: number;
          selected_urls?: unknown | null;
          error_message?: string | null;
          refresh_error_message?: string | null;
          embedding_model?: string | null;
          embedding_dimensions?: number | null;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bot_website_pages: {
        Row: {
          id: string;
          source_id: string;
          bot_id: string;
          page_url: string;
          normalized_url: string;
          page_title: string;
          sort_order: number;
          status: "pending" | "processing" | "completed" | "failed";
          processing_started_at: string | null;
          reclaim_count: number;
          content_hash: string | null;
          error_message: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          bot_id: string;
          page_url: string;
          normalized_url: string;
          page_title?: string;
          sort_order?: number;
          status?: "pending" | "processing" | "completed" | "failed";
          processing_started_at?: string | null;
          reclaim_count?: number;
          content_hash?: string | null;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          bot_id?: string;
          page_url?: string;
          normalized_url?: string;
          page_title?: string;
          sort_order?: number;
          status?: "pending" | "processing" | "completed" | "failed";
          processing_started_at?: string | null;
          reclaim_count?: number;
          content_hash?: string | null;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bot_website_chunks: {
        Row: {
          id: string;
          source_id: string;
          page_id: string;
          bot_id: string;
          source_url: string;
          page_title: string;
          heading: string;
          chunk_content: string;
          embedding: string | null;
          chunk_order: number;
          content_hash: string | null;
          scraped_at: string;
          embedding_model: string | null;
          embedding_dimensions: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          page_id: string;
          bot_id: string;
          source_url: string;
          page_title?: string;
          heading?: string;
          chunk_content: string;
          embedding?: string | null;
          chunk_order?: number;
          content_hash?: string | null;
          scraped_at?: string;
          embedding_model?: string | null;
          embedding_dimensions?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          page_id?: string;
          bot_id?: string;
          source_url?: string;
          page_title?: string;
          heading?: string;
          chunk_content?: string;
          embedding?: string | null;
          chunk_order?: number;
          content_hash?: string | null;
          scraped_at?: string;
          embedding_model?: string | null;
          embedding_dimensions?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_website_build_logs: {
        Row: {
          id: string;
          source_id: string | null;
          bot_id: string;
          side: "nextjs" | "gas";
          step: string;
          status: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          bot_id: string;
          side?: "nextjs" | "gas";
          step: string;
          status: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          bot_id?: string;
          side?: "nextjs" | "gas";
          step?: string;
          status?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_widget_monitors: {
        Row: {
          bot_id: string;
          domain: string | null;
          install_status: "never_seen" | "installed" | "removed";
          purchase_at: string;
          install_window_end_at: string;
          first_installed_at: string | null;
          active_monitoring_start_at: string | null;
          active_monitoring_end_at: string | null;
          last_seen_at: string | null;
          last_checked_at: string | null;
          last_error: string | null;
          slot_minute: number | null;
          next_check_at: string | null;
          in_progress_at: string | null;
          current_check_id: string | null;
          check_heartbeat_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          bot_id: string;
          domain?: string | null;
          install_status?: "never_seen" | "installed" | "removed";
          purchase_at: string;
          install_window_end_at: string;
          first_installed_at?: string | null;
          active_monitoring_start_at?: string | null;
          active_monitoring_end_at?: string | null;
          last_seen_at?: string | null;
          last_checked_at?: string | null;
          last_error?: string | null;
          slot_minute?: number | null;
          next_check_at?: string | null;
          in_progress_at?: string | null;
          current_check_id?: string | null;
          check_heartbeat_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bot_id?: string;
          domain?: string | null;
          install_status?: "never_seen" | "installed" | "removed";
          purchase_at?: string;
          install_window_end_at?: string;
          first_installed_at?: string | null;
          active_monitoring_start_at?: string | null;
          active_monitoring_end_at?: string | null;
          last_seen_at?: string | null;
          last_checked_at?: string | null;
          last_error?: string | null;
          slot_minute?: number | null;
          next_check_at?: string | null;
          in_progress_at?: string | null;
          current_check_id?: string | null;
          check_heartbeat_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bot_widget_monitor_checks: {
        Row: {
          id: string;
          bot_id: string;
          check_id: string;
          website_url: string;
          result: "installed" | "missing" | "check_error" | null;
          page_ok: boolean | null;
          heartbeat_matched: boolean;
          visitor_heartbeat_protected: boolean;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          check_id: string;
          website_url: string;
          result?: "installed" | "missing" | "check_error" | null;
          page_ok?: boolean | null;
          heartbeat_matched?: boolean;
          visitor_heartbeat_protected?: boolean;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          check_id?: string;
          website_url?: string;
          result?: "installed" | "missing" | "check_error" | null;
          page_ok?: boolean | null;
          heartbeat_matched?: boolean;
          visitor_heartbeat_protected?: boolean;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bot_widget_monitor_events: {
        Row: {
          id: string;
          bot_id: string;
          event_type: "installed" | "removed" | "reinstalled";
          occurred_at: string;
          check_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          event_type: "installed" | "removed" | "reinstalled";
          occurred_at?: string;
          check_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          event_type?: "installed" | "removed" | "reinstalled";
          occurred_at?: string;
          check_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      widget_monitor_settings: {
        Row: {
          id: number;
          tick_url: string | null;
          cron_secret: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tick_url?: string | null;
          cron_secret?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tick_url?: string | null;
          cron_secret?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_website_chunks: {
        Args: {
          p_bot_id: string;
          p_query_embedding: string;
          p_match_threshold?: number;
          p_match_count?: number;
        };
        Returns: {
          chunk_content: string;
          source_url: string;
          page_title: string;
          heading: string;
          similarity: number;
        }[];
      };
      count_valid_website_chunks: {
        Args: {
          p_bot_id: string;
        };
        Returns: number;
      };
      begin_website_page_processing: {
        Args: {
          p_page_id: string;
        };
        Returns: Json;
      };
      complete_website_page: {
        Args: {
          p_page_id: string;
          p_success: boolean;
          p_patch?: Json;
        };
        Returns: Json;
      };
      retry_website_page: {
        Args: {
          p_page_id: string;
        };
        Returns: Json;
      };
      try_finalize_website_source: {
        Args: {
          p_source_id: string;
          p_min_chars?: number;
          p_stale_minutes?: number;
        };
        Returns: Json;
      };
      fail_stale_pending_pages: {
        Args: {
          p_source_id: string;
          p_stale_minutes?: number;
        };
        Returns: Json;
      };
      sweep_stuck_website_builds: {
        Args: {
          p_stale_minutes?: number;
        };
        Returns: Json;
      };
      enroll_bot_widget_monitor: {
        Args: {
          p_bot_id: string;
        };
        Returns: Json;
      };
      claim_due_widget_monitor_check: {
        Args: Record<string, never>;
        Returns: Json;
      };
      fail_stale_widget_monitor_checks: {
        Args: {
          p_stale_minutes?: number;
        };
        Returns: Json;
      };
      dispatch_widget_monitor_tick: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabaseAdminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error("Supabase is not configured.");
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<Database>(
      serverEnv.supabaseUrl,
      serverEnv.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdminClient;
}

export async function checkSupabaseConnection() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    return {
      connected: false,
      reason: "not_configured" as const,
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("chatbot_leads").select("id").limit(1);

    if (error) {
      return {
        connected: false,
        reason: "query_failed" as const,
        message: error.message,
      };
    }

    return {
      connected: true,
      reason: "ok" as const,
    };
  } catch (error) {
    return {
      connected: false,
      reason: "query_failed" as const,
      message: error instanceof Error ? error.message : "Unknown Supabase error",
    };
  }
}
