import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { StorageProviderDatabase, getProviderForFileType } from "@/types/storage";

let s3Client: S3Client | null = null;
let providers: StorageProviderDatabase[] | null = null;
let providersLastFetched: number = 0;

const PROVIDER_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fetch and cache all providers
const fetchProviders = async (): Promise<StorageProviderDatabase[]> => {
  const now = Date.now();
  
  // Return cached providers if they exist and aren't stale
  if (providers && now - providersLastFetched < PROVIDER_CACHE_TIME) {
    return providers;
  }

  // Fetch all providers from the database
  const { data, error } = await supabase
    .from("storage_providers")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching storage providers:", error);
    throw new Error("Failed to fetch storage providers");
  }

  // Convert the JSON credentials to objects if needed
  const processedData = data.map(provider => {
    return {
      ...provider,
      credentials: typeof provider.credentials === 'string' 
        ? JSON.parse(provider.credentials) 
        : provider.credentials
    } as StorageProviderDatabase;
  });

  providers = processedData;
  providersLastFetched = now;
  return providers;
};

// Get the specific S3 client for a provider
export const getS3Client = async (providerName: string) => {
  const allProviders = await fetchProviders();
  const provider = allProviders.find(p => p.name === providerName);

  if (!provider) {
    throw new Error(`Provider ${providerName} not found`);
  }

  let credentials;
  try {
    // Check if credentials is already a parsed object or needs to be parsed
    credentials = typeof provider.credentials === 'string' 
      ? JSON.parse(provider.credentials) 
      : provider.credentials;
  } catch (error) {
    console.error(`Error parsing ${providerName} credentials:`, error);
    throw new Error(`Failed to parse ${providerName} credentials`);
  }

  // Create an S3 client with appropriate configuration
  const clientConfig: any = {
    region: credentials.region || 'auto',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    }
  };

  // Add endpoint if available
  if (credentials.endpoint) {
    clientConfig.endpoint = credentials.endpoint;
    // Force path style access for providers like Cloudflare R2, Wasabi, etc.
    clientConfig.forcePathStyle = true;
  }

  return new S3Client(clientConfig);
};

// Get the appropriate storage provider based on file type and/or client ID
export const getStorageProvider = async (fileType?: string, clientId?: string) => {
  try {
    const allProviders = await fetchProviders();
    
    // Get the best provider for this file type and client
    let provider;
    
    if (fileType) {
      provider = getProviderForFileType(allProviders, fileType, clientId);
    } else {
      // Default to the highest priority active provider
      provider = allProviders
        .filter(p => p.is_active)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
    }

    if (!provider) {
      throw new Error("No active storage provider found");
    }

    // Parse credentials and extract bucket name
    let credentials;
    try {
      credentials = typeof provider.credentials === 'string' 
        ? JSON.parse(provider.credentials) 
        : provider.credentials;
    } catch (error) {
      console.error("Error parsing credentials:", error, "Raw data:", provider.credentials);
      throw new Error("Failed to parse storage provider credentials");
    }

    return {
      provider: provider.name,
      providerType: provider.provider,
      bucket: credentials.bucket || "files", // Default to "files" if not specified
      isBackup: provider.is_backup || false,
    };
  } catch (error) {
    console.error("Error in getStorageProvider:", error);
    throw error;
  }
};

// Get backup providers if configured
export const getBackupProviders = async () => {
  const allProviders = await fetchProviders();
  return allProviders.filter(p => p.is_active && p.is_backup);
};

export const resetStorageProvider = () => {
  s3Client = null;
  providers = null;
  providersLastFetched = 0;
};

export const getFileUrl = async (filePath: string, clientId?: string): Promise<string> => {
  if (!filePath) {
    console.error("Empty file path provided to getFileUrl");
    throw new Error("File path is required");
  }
  
  try {
    // Get the file's content type from the database if possible
    let contentType: string | undefined;
    const { data: fileData } = await supabase
      .from("files")
      .select("content_type")
      .eq("file_path", filePath)
      .maybeSingle();
    
    if (fileData?.content_type) {
      contentType = fileData.content_type;
    }
    
    const { provider, providerType, bucket } = await getStorageProvider(contentType, clientId);

    switch (providerType) {
      case "supabase": {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
      }
      case "aws": 
      case "backblaze":
      case "wasabi":
      case "cloudflare": {
        const client = await getS3Client(provider);
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: filePath,
        });
        return getSignedUrl(client, command, { expiresIn: 3600 });
      }
      case "google":
        throw new Error("Google Cloud Storage not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (error) {
    console.error("Error getting signed URL:", error, "for file:", filePath);
    throw error;
  }
};

export const removeFiles = async (filePaths: string[], clientId?: string): Promise<void> => {
  if (!filePaths || filePaths.length === 0) {
    console.warn("No file paths provided for deletion.");
    return;
  }

  // First, determine the provider based on the first file (could be improved to handle multiple providers)
  let contentType: string | undefined;
  if (filePaths.length > 0) {
    const { data: fileData } = await supabase
      .from("files")
      .select("content_type")
      .eq("file_path", filePaths[0])
      .maybeSingle();
    
    if (fileData?.content_type) {
      contentType = fileData.content_type;
    }
  }

  const { provider, providerType, bucket } = await getStorageProvider(contentType, clientId);

  try {
    switch (providerType) {
      case "supabase":
        // Delete files from Supabase storage
        const { error } = await supabase.storage.from(bucket).remove(filePaths);

        if (error) {
          console.error("Error deleting files from Supabase:", error);
          throw new Error(`Failed to delete files from Supabase: ${error.message}`);
        }
        console.log(`Successfully deleted ${filePaths.length} file(s) from Supabase.`);
        break;
      case "aws":
      case "cloudflare":
      case "backblaze":
      case "wasabi": {
        // Delete files from S3-compatible storage
        const client = await getS3Client(provider);

        // Process deletions one by one
        for (const filePath of filePaths) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: filePath,
            });
            await client.send(deleteCommand);
            console.log(`Deleted file: ${filePath}`);
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        }
        console.log(`Successfully processed deletion of ${filePaths.length} file(s).`);
        break;
      }
      case "google":
        throw new Error("Google Cloud Storage not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error;
  }
};

export async function downloadFile(filePath: string, clientId?: string): Promise<Blob> {
  if (!filePath) {
    throw new Error("File path is required for download");
  }
  
  // Get the file's content type from the database if possible
  let contentType: string | undefined;
  const { data: fileData, error: fileError } = await supabase
    .from("files")
    .select("content_type, id")
    .eq("file_path", filePath)
    .maybeSingle();
  
  if (fileError) {
    console.error("Error fetching file data:", fileError);
  }
  
  if (fileData?.content_type) {
    contentType = fileData.content_type;
  }
  
  const { provider, providerType, bucket } = await getStorageProvider(contentType, clientId);

  // Generate file URL for virus scanning
  let fileUrl: string;
  switch (providerType) {
    case "supabase": {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      fileUrl = data.publicUrl;
      break;
    }
    case "aws": 
    case "backblaze":
    case "wasabi":
    case "cloudflare": {
      const client = await getS3Client(provider);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });
      fileUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      break;
    }
    default:
      throw new Error(`Provider ${provider} not supported for virus scanning`);
  }

  try {
    // Get the session token for authorization
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    // Call our virus scan edge function
    const { data: scanResult, error: scanError } = await supabase.functions.invoke('virus-scan', {
      body: { 
        fileUrl, 
        userId: sessionData?.session?.user?.id,
        fileId: fileData?.id
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (scanError) {
      console.error("Error during virus scan:", scanError);
      throw new Error("File could not be scanned for viruses");
    }

    if (scanResult.status === 'timeout') {
      // Handle timeout - could show a message to try again later
      console.warn("Virus scan timeout:", scanResult.message);
    } else if (!scanResult.safe) {
      throw new Error("Security risk detected: This file may contain malware");
    }

    // If scan was successful and file is safe (or timeout), proceed with download
  } catch (scanError) {
    console.error("Virus scan failed:", scanError);
    throw scanError;
  }

  // Continue with the existing download logic
  switch (providerType) {
    case "supabase": {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        console.error("Error downloading file from Supabase:", error);
        throw new Error("Failed to download file from Supabase");
      }

      if (!data) {
        throw new Error("No data received from Supabase download");
      }

      return data;
    }
    case "aws":
    case "cloudflare":
    case "backblaze":
    case "wasabi": {
      const client = await getS3Client(provider);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      try {
        const response = await client.send(command);
        if (response.Body) {
          const blob = await response.Body.transformToByteArray();
          return new Blob([blob]);
        } else {
          throw new Error(`No body in ${providerType} response`);
        }
      } catch (error) {
        console.error(`Error downloading file from ${providerType}:`, error);
        throw new Error(`Failed to download file from ${providerType}`);
      }
    }
    case "google":
      throw new Error("Google Cloud Storage not yet implemented");
    default:
      throw new Error(`Provider ${provider} not implemented`);
  }
}

export interface UploadOptions {
  onUploadProgress?: (progress: number) => void;
  encryption?: {
    password?: string;
  };
  compress?: boolean;
  clientId?: string;
}

export async function uploadFile(
  file: File, 
  filePath: string, 
  options: UploadOptions = {}
): Promise<string> {
  // Get provider based on file type and client ID
  const { provider, providerType, bucket, isBackup } = await getStorageProvider(
    file.type,
    options.clientId
  );
  
  let fileData: ArrayBuffer;
  fileData = await file.arrayBuffer();
  
  try {    
    let result: string | null = null;
    
    switch (providerType) {
      case 'supabase':
        // Supabase doesn't support onUploadProgress natively, so we'll handle it separately
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileData, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          console.error('Error uploading file to Supabase:', error);
          throw error;
        }
        
        result = data.path;
        break;
      case 'aws':
      case 'cloudflare':
      case 'backblaze':  
      case 'wasabi': {
        // Implement S3-compatible upload with progress tracking
        const client = await getS3Client(provider);
        
        // Convert ArrayBuffer to Uint8Array for AWS SDK
        const buffer = new Uint8Array(fileData);
        
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          ContentType: file.type,
          Body: buffer,
        });
        
        try {
          if (options.onUploadProgress) {
            // Since AWS SDK doesn't have native progress tracking, we'll simulate it
            options.onUploadProgress(10);
            await client.send(command);
            options.onUploadProgress(100);
          } else {
            await client.send(command);
          }
          result = filePath;
        } catch (uploadError) {
          console.error(`Error during ${providerType} upload:`, uploadError);
          throw new Error(`Failed to upload file to ${providerType}`);
        }
        break;
      }
      case 'google':
        throw new Error("Google Cloud Storage not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
    
    if (!result) {
      throw new Error('Upload failed: no result returned');
    }
    
    // If successful upload and backup providers are configured, backup the file
    if (result && !isBackup) {
      try {
        const backupProviders = await getBackupProviders();
        if (backupProviders.length > 0) {
          console.log(`Backing up file to ${backupProviders.length} providers`);
          
          // Don't await these to avoid slowing down the primary upload
          for (const backupProvider of backupProviders) {
            // Reuse the same uploadFile function with backup provider's client ID
            uploadFile(file, filePath, { 
              clientId: backupProvider.id,
            }).catch(e => {
              console.error(`Backup to ${backupProvider.name} failed:`, e);
            });
          }
        }
      } catch (backupError) {
        // Log backup errors but don't fail the original upload
        console.error("Error during backup:", backupError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// New utility functions for the admin panel

// Get usage statistics for a storage provider
export async function getProviderUsageStats(providerId: string): Promise<UsageMetrics> {
  // Implementation depends on how you track usage
  // Here's a very basic implementation that counts files and total size
  try {
    const { data: files, error } = await supabase
      .from("files")
      .select("size");
      
    if (error) throw error;
    
    const totalStorage = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    return {
      totalStorage,
      filesCount: files.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return {
      totalStorage: 0,
      filesCount: 0, 
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Test connection to a storage provider
export async function testProviderConnection(provider: StorageProviderDatabase): Promise<boolean> {
  try {
    // Create a temporary client
    let clientConfig: any = {};
    const credentials = typeof provider.credentials === 'string' 
      ? JSON.parse(provider.credentials) 
      : provider.credentials;
    
    clientConfig = {
      region: credentials.region || 'auto',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }
    };

    if (credentials.endpoint) {
      clientConfig.endpoint = credentials.endpoint;
      clientConfig.forcePathStyle = true;
    }

    const client = new S3Client(clientConfig);
    
    // Try a simple operation - list buckets or check if the configured bucket exists
    const command = new GetObjectCommand({
      Bucket: credentials.bucket,
      Key: 'test-connection.txt', // This file probably doesn't exist, but the error will tell us if the credentials work
    });
    
    try {
      await client.send(command);
      return true;
    } catch (error: any) {
      // Check if error is due to the file not existing (which is fine)
      // rather than authentication failure
      if (error.name === 'NoSuchKey') {
        return true; // Connection works, file just doesn't exist
      }
      
      console.error("Connection test failed:", error);
      return false;
    }
  } catch (error) {
    console.error("Error testing provider connection:", error);
    return false;
  }
}

// Migrate files between providers (simplified implementation)
export async function migrateFiles(sourceProviderId: string, targetProviderId: string): Promise<{
  success: boolean;
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedFiles = 0;
  let failedFiles = 0;
  
  try {
    // Get providers
    const allProviders = await fetchProviders();
    const sourceProvider = allProviders.find(p => p.id === sourceProviderId);
    const targetProvider = allProviders.find(p => p.id === targetProviderId);
    
    if (!sourceProvider || !targetProvider) {
      throw new Error('Source or target provider not found');
    }
    
    // Get files to migrate - limit to a reasonable batch size to start
    const { data: files, error } = await supabase
      .from('files')
      .select('file_path, content_type')
      .limit(100); // Start with a small batch as a test
      
    if (error) throw error;
    
    const totalFiles = files.length;
    console.log(`Starting migration of ${totalFiles} files`);
    
    // Process each file
    for (const file of files) {
      try {
        // Download from source
        const fileBlob = await downloadFile(file.file_path, sourceProviderId);
        
        // Create a File object
        const fileObj = new File([fileBlob], file.file_path.split('/').pop() || 'file', {
          type: file.content_type
        });
        
        // Upload to target
        await uploadFile(fileObj, file.file_path, { clientId: targetProviderId });
        
        migratedFiles++;
        console.log(`Migrated file ${file.file_path} (${migratedFiles}/${totalFiles})`);
      } catch (fileError: any) {
        failedFiles++;
        errors.push(`Failed to migrate ${file.file_path}: ${fileError.message}`);
        console.error(`Failed to migrate file ${file.file_path}:`, fileError);
      }
    }
    
    return {
      success: failedFiles === 0,
      totalFiles,
      migratedFiles,
      failedFiles,
      errors,
    };
  } catch (error: any) {
    console.error("Migration failed:", error);
    return {
      success: false,
      totalFiles: 0,
      migratedFiles,
      failedFiles,
      errors: [`Migration error: ${error.message}`],
    };
  }
}

// Import type for metrics
export interface UsageMetrics {
  totalStorage: number;
  filesCount: number;
  lastUpdated: string;
}
