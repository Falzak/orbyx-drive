
export type StorageProvider = 
  | "aws"
  | "google"
  | "backblaze"
  | "wasabi"
  | "cloudflare";

export interface StorageProviderDatabase {
  id: string;
  name: string;
  provider: StorageProvider;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StorageProviderConfig extends Omit<StorageProviderDatabase, 'is_active' | 'created_at' | 'updated_at'> {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
