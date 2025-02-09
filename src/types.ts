export interface FileWithPreview extends File {
  preview?: string;
}

export interface FileData {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  is_favorite: boolean;
  file_path: string;
  created_at: string;
  category: string;
  url?: string;
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
