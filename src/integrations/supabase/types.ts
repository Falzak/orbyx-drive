export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      file_encryption_metadata: {
        Row: {
          created_at: string
          encryption_data: string
          file_path: string
          id: string
        }
        Insert: {
          created_at?: string
          encryption_data: string
          file_path: string
          id?: string
        }
        Update: {
          created_at?: string
          encryption_data?: string
          file_path?: string
          id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          category: string | null
          content_type: string | null
          created_at: string
          file_path: string
          filename: string
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          original_id: string | null
          size: number | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          file_path: string
          filename: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          original_id?: string | null
          size?: number | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          file_path?: string
          filename?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          original_id?: string | null
          size?: number | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      google_drive_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      share_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          share_id: string
          user_agent: string | null
          user_ip: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          share_id: string
          user_agent?: string | null
          user_ip?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          share_id?: string
          user_agent?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_activity_logs_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "shared_files"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_files: {
        Row: {
          created_at: string
          encrypted_password: string | null
          expires_at: string | null
          file_path: string | null
          id: string
          is_public: boolean | null
          password: string | null
          shared_by: string
        }
        Insert: {
          created_at?: string
          encrypted_password?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          password?: string | null
          shared_by: string
        }
        Update: {
          created_at?: string
          encrypted_password?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          password?: string | null
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_files_file_path_fkey"
            columns: ["file_path"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["file_path"]
          },
        ]
      }
      storage_providers: {
        Row: {
          client_id: string | null
          created_at: string
          credentials: Json
          description: string | null
          file_type_patterns: Json | null
          id: string
          is_active: boolean | null
          is_backup: boolean | null
          name: string
          priority: number | null
          provider: Database["public"]["Enums"]["storage_provider"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          credentials: Json
          description?: string | null
          file_type_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          is_backup?: boolean | null
          name: string
          priority?: number | null
          provider: Database["public"]["Enums"]["storage_provider"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          credentials?: Json
          description?: string | null
          file_type_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          is_backup?: boolean | null
          name?: string
          priority?: number | null
          provider?: Database["public"]["Enums"]["storage_provider"]
          updated_at?: string
        }
        Relationships: []
      }
      storage_quotas: {
        Row: {
          created_at: string
          total_quota: number
          updated_at: string
          used_quota: number
          user_id: string
        }
        Insert: {
          created_at?: string
          total_quota?: number
          updated_at?: string
          used_quota?: number
          user_id: string
        }
        Update: {
          created_at?: string
          total_quota?: number
          updated_at?: string
          used_quota?: number
          user_id?: string
        }
        Relationships: []
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
      cleanup_expired_shares: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      share_permission: "view" | "edit" | "download"
      storage_provider: "aws" | "google" | "backblaze" | "wasabi" | "cloudflare"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
