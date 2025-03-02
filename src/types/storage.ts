export type StorageProvider =
  | "aws"
  | "google"
  | "backblaze"
  | "wasabi"
  | "cloudflare";

// Interface that directly matches the database column names
export interface StorageProviderDatabase {
  id: string;
  name: string;
  provider: StorageProvider;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Optional interface for component-friendly property names (if needed)
export interface StorageProviderConfig {
  id: string;
  name: string;
  provider: StorageProvider;
  isActive: boolean;
  credentials: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert from database format to component format
export function mapDatabaseToConfig(
  provider: StorageProviderDatabase
): StorageProviderConfig {
  return {
    id: provider.id,
    name: provider.name,
    provider: provider.provider,
    isActive: provider.is_active,
    credentials: provider.credentials,
    createdAt: provider.created_at,
    updatedAt: provider.updated_at,
  };
}
