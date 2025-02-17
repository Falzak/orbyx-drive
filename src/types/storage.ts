
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
    accountId?: string; // For Cloudflare R2
    projectId?: string; // For Google Cloud
  };
  createdAt: string;
  updatedAt: string;
}
