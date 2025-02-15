export interface FileWithPreview extends File {
  preview?: string;
}

export interface FileData {
  id: string;
  filename: string;
  file_path: string;
  content_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_favorite?: boolean;
  url?: string;
  is_folder?: boolean;
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
}
