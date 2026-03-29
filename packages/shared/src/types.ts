// TypeScript types matching the Supabase DB schema (00001_initial_schema.sql)
// Used as the generic parameter for createClient<Database>()

export type MessageStatus = "pending" | "summarized" | "complete" | "failed";

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          slack_team_id: string;
          name: string;
          icon_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slack_team_id: string;
          name: string;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slack_team_id?: string;
          name?: string;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      channels: {
        Row: {
          id: string;
          workspace_id: string;
          slack_channel_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          slack_channel_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          slack_channel_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          workspace_id: string;
          auth_user_id: string | null;
          slack_user_id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          auth_user_id?: string | null;
          slack_user_id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          auth_user_id?: string | null;
          slack_user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          slack_message_ts: string;
          summary: string | null;
          card_images: string[];
          status: MessageStatus;
          share_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          slack_message_ts: string;
          summary?: string | null;
          card_images?: string[];
          status?: MessageStatus;
          share_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          slack_message_ts?: string;
          summary?: string | null;
          card_images?: string[];
          status?: MessageStatus;
          share_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      urls: {
        Row: {
          id: string;
          message_id: string;
          url: string;
          title: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          url: string;
          title?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          url?: string;
          title?: string | null;
          position?: number;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          message_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Channel = Database["public"]["Tables"]["channels"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Url = Database["public"]["Tables"]["urls"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
