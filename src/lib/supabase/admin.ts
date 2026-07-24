import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          customer_id: string;
          business_name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          customer_id?: string;
          business_name?: string;
          is_active?: boolean;
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
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_leads: {
        Row: {
          id: string;
          bot_id: string;
          name: string;
          phone: string;
          email: string | null;
          session_id: string;
          page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          name: string;
          phone: string;
          email?: string | null;
          session_id: string;
          page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
