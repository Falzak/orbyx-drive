
export type StorageProvider =
  | "aws"
  | "google"
  | "backblaze"
  | "wasabi"
  | "cloudflare";

export type FileTypeMapping = {
  type: string;
  pattern: string;
  providerId: string | null;
};

export type UsageMetrics = {
  totalStorage: number;
  filesCount: number;
  lastUpdated: string;
};

// Interface that directly matches the database column names
export interface StorageProviderDatabase {
  id: string;
  name: string;
  provider: StorageProvider;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
  priority?: number;
  description?: string;
  file_type_patterns?: FileTypeMapping[];
  usage_metrics?: UsageMetrics;
  is_backup?: boolean;
  client_id?: string | null;
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
  priority?: number;
  description?: string;
  fileTypeMappings?: FileTypeMapping[];
  usageMetrics?: UsageMetrics;
  isBackup?: boolean;
  clientId?: string | null;
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
    priority: provider.priority,
    description: provider.description,
    fileTypeMappings: provider.file_type_patterns,
    usageMetrics: provider.usage_metrics,
    isBackup: provider.is_backup,
    clientId: provider.client_id,
  };
}

// Helper functions to select appropriate storage provider
export function getProviderForFileType(
  providers: StorageProviderDatabase[],
  fileType: string,
  clientId?: string | null
): StorageProviderDatabase | null {
  // First check for client-specific providers
  if (clientId) {
    const clientProvider = providers.find(
      (p) => p.is_active && p.client_id === clientId
    );
    if (clientProvider) return clientProvider;
  }

  // Then check for file type specific mappings
  const providerWithMapping = providers.find((provider) => {
    if (!provider.is_active || !provider.file_type_patterns) return false;
    
    return provider.file_type_patterns.some((mapping) => {
      // Check if the file type matches the pattern
      if (mapping.pattern === '*') return true;
      if (mapping.type === 'mime' && fileType.match(new RegExp(mapping.pattern))) return true;
      if (mapping.type === 'extension' && fileType.endsWith(mapping.pattern)) return true;
      return false;
    });
  });

  if (providerWithMapping) return providerWithMapping;

  // Finally, get the default active provider with highest priority
  return providers
    .filter(p => p.is_active)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null;
}
