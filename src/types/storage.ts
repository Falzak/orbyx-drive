
export type StorageProvider = 
  | "supabase"
  | "aws"
  | "google"
  | "backblaze"
  | "wasabi"
  | "cloudflare";

export interface StorageProviderConfig {
  id: string;
  name: string;
  provider: StorageProvider;
  isActive: boolean;
  credentials: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    bucket?: string;
    endpoint?: string;
    accountId?: string;
    projectId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StorageProviderDatabase {
  id: string;
  name: string;
  provider: StorageProvider;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}
