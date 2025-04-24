export interface FileWithPreview extends File {
  preview?: string;
}

export interface FileData {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  file_path: string | null;
  folder_id: string | null;
  is_favorite: boolean;
  category: string;
  is_folder?: boolean;
  url?: string;
  icon?: string;
  color?: string;
  name?: string;
  parent_id?: string | null;
  is_trashed?: boolean;
  trashed_at?: string | null;
}

export interface ShareSettings {
  is_public: boolean;
  custom_url?: string;
  password?: string;
  expires_at?: string;
}

export type ViewMode = "grid" | "list";

export type FileCategory =
  | "images"
  | "documents"
  | "videos"
  | "audio"
  | "other";

export interface FileFilter {
  category?: FileCategory;
  search?: string;
  favorite?: boolean;
  shared?: boolean;
  recent?: boolean;
  trashed?: boolean;
}

export interface SharedFile {
  id: string;
  file_path: string;
  shared_by: string;
  is_public: boolean;
  is_encrypted: boolean | null;
  password: string | null;
  expires_at: string | null;
  created_at: string;
}
