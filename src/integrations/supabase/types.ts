export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      file_encryption_metadata: {
        Row: {
          created_at: string;
          encryption_data: string;
          file_path: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          encryption_data: string;
          file_path: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          encryption_data?: string;
          file_path?: string;
          id?: string;
        };
        Relationships: [];
      };
      files: {
        Row: {
          category: string | null;
          content_type: string | null;
          created_at: string;
          file_path: string;
          filename: string;
          folder_id: string | null;
          id: string;
          is_favorite: boolean | null;
          is_malicious: boolean | null;
          is_malware: boolean | null;
          original_id: string | null;
          security_scan_result: Json | null;
          size: number | null;
          source: string | null;
          updated_at: string;
          user_id: string;
          virus_status: string | null;
        };
        Insert: {
          category?: string | null;
          content_type?: string | null;
          created_at?: string;
          file_path: string;
          filename: string;
          folder_id?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_malicious?: boolean | null;
          is_malware?: boolean | null;
          original_id?: string | null;
          security_scan_result?: Json | null;
          size?: number | null;
          source?: string | null;
          updated_at?: string;
          user_id: string;
          virus_status?: string | null;
        };
        Update: {
          category?: string | null;
          content_type?: string | null;
          created_at?: string;
          file_path?: string;
          filename?: string;
          folder_id?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_malicious?: boolean | null;
          is_malware?: boolean | null;
          original_id?: string | null;
          security_scan_result?: Json | null;
          size?: number | null;
          source?: string | null;
          updated_at?: string;
          user_id?: string;
          virus_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          }
        ];
      };
      folders: {
        Row: {
          color: string | null;
          created_at: string | null;
          icon: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          }
        ];
      };
      google_drive_tokens: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          refresh_token: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          refresh_token: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          refresh_token?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      share_activity_logs: {
        Row: {
          activity_type: string;
          created_at: string;
          id: string;
          share_id: string;
          user_agent: string | null;
          user_ip: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          id?: string;
          share_id: string;
          user_agent?: string | null;
          user_ip?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          id?: string;
          share_id?: string;
          user_agent?: string | null;
          user_ip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "share_activity_logs_share_id_fkey";
            columns: ["share_id"];
            isOneToOne: false;
            referencedRelation: "shared_files";
            referencedColumns: ["id"];
          }
        ];
      };
      shared_files: {
        Row: {
          created_at: string;
          encrypted_password: string | null;
          expires_at: string | null;
          file_path: string | null;
          id: string;
          is_encrypted: boolean | null;
          is_public: boolean | null;
          password: string | null;
          shared_by: string;
        };
        Insert: {
          created_at?: string;
          encrypted_password?: string | null;
          expires_at?: string | null;
          file_path?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          is_public?: boolean | null;
          password?: string | null;
          shared_by: string;
        };
        Update: {
          created_at?: string;
          encrypted_password?: string | null;
          expires_at?: string | null;
          file_path?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          is_public?: boolean | null;
          password?: string | null;
          shared_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_files_file_path_fkey";
            columns: ["file_path"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["file_path"];
          }
        ];
      };
      storage_providers: {
        Row: {
          client_id: string | null;
          created_at: string;
          credentials: Json;
          description: string | null;
          file_type_patterns: Json | null;
          id: string;
          is_active: boolean | null;
          is_backup: boolean | null;
          name: string;
          priority: number | null;
          provider: Database["public"]["Enums"]["storage_provider"];
          updated_at: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          credentials: Json;
          description?: string | null;
          file_type_patterns?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_backup?: boolean | null;
          name: string;
          priority?: number | null;
          provider: Database["public"]["Enums"]["storage_provider"];
          updated_at?: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          credentials?: Json;
          description?: string | null;
          file_type_patterns?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_backup?: boolean | null;
          name?: string;
          priority?: number | null;
          provider?: Database["public"]["Enums"]["storage_provider"];
          updated_at?: string;
        };
        Relationships: [];
      };
      storage_quotas: {
        Row: {
          created_at: string;
          total_quota: number;
          updated_at: string;
          used_quota: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          total_quota?: number;
          updated_at?: string;
          used_quota?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          total_quota?: number;
          updated_at?: string;
          used_quota?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          created_at: string;
          device_info: string | null;
          id: string;
          ip_address: string | null;
          last_active_at: string;
          location: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_info?: string | null;
          id?: string;
          ip_address?: string | null;
          last_active_at?: string;
          location?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_info?: string | null;
          id?: string;
          ip_address?: string | null;
          last_active_at?: string;
          location?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      virus_scans: {
        Row: {
          created_at: string;
          detection_ratio: string | null;
          error: string | null;
          file_id: string | null;
          id: string;
          is_malicious: boolean | null;
          permalink: string | null;
          scan_date: string;
          scan_id: string;
          status: string;
          threat_names: string[] | null;
        };
        Insert: {
          created_at?: string;
          detection_ratio?: string | null;
          error?: string | null;
          file_id?: string | null;
          id?: string;
          is_malicious?: boolean | null;
          permalink?: string | null;
          scan_date?: string;
          scan_id: string;
          status: string;
          threat_names?: string[] | null;
        };
        Update: {
          created_at?: string;
          detection_ratio?: string | null;
          error?: string | null;
          file_id?: string | null;
          id?: string;
          is_malicious?: boolean | null;
          permalink?: string | null;
          scan_date?: string;
          scan_id?: string;
          status?: string;
          threat_names?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "virus_scans_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_shares: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_inactive_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
      share_permission: "view" | "edit" | "download";
      storage_provider:
        | "aws"
        | "google"
        | "backblaze"
        | "wasabi"
        | "cloudflare";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      share_permission: ["view", "edit", "download"],
      storage_provider: ["aws", "google", "backblaze", "wasabi", "cloudflare"],
    },
  },
} as const;
