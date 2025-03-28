
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
  url?: string;
  is_folder?: boolean;
  name?: string;
  parent_id?: string | null;
  provider_id?: string; // Add this to track which provider stores the file
}

export interface FolderData {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
}

// Define file type mappings
export interface FileTypeMapping {
  fileType: string; // MIME type or extension pattern
  providerId: string; // Which provider to use
}
