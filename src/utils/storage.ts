
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

let s3Client: S3Client | null = null;

const getS3Client = async () => {
  if (s3Client) {
    return s3Client;
  }

  const { data, error } = await supabase
    .from("storage_providers")
    .select("*")
    .eq("name", "s3")
    .single();

  if (error) {
    console.error("Error fetching S3 configuration:", error);
    throw new Error("Failed to fetch S3 configuration");
  }

  if (!data) {
    throw new Error("S3 configuration not found");
  }

  // Parse credentials from the JSON field
  let credentials;
  try {
    // Check if credentials is already a parsed object or needs to be parsed
    credentials = typeof data.credentials === 'string' 
      ? JSON.parse(data.credentials) 
      : data.credentials;
  } catch (error) {
    console.error("Error parsing S3 credentials:", error);
    throw new Error("Failed to parse S3 credentials");
  }

  s3Client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  return s3Client;
};

// Create a custom function to get an S3 client for any S3-compatible provider
const getS3CompatibleClient = async (providerName: string) => {
  const { data, error } = await supabase
    .from("storage_providers")
    .select("*")
    .eq("name", providerName)
    .single();

  if (error) {
    console.error(`Error fetching ${providerName} configuration:`, error);
    throw new Error(`Failed to fetch ${providerName} configuration`);
  }

  if (!data) {
    throw new Error(`${providerName} configuration not found`);
  }

  // Parse credentials from the JSON field
  let credentials;
  try {
    credentials = typeof data.credentials === 'string' 
      ? JSON.parse(data.credentials) 
      : data.credentials;
  } catch (error) {
    console.error(`Error parsing ${providerName} credentials:`, error);
    throw new Error(`Failed to parse ${providerName} credentials`);
  }

  // Create an S3 client with the appropriate configuration for the provider
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
    // Force path style access for Cloudflare R2 and some other providers
    clientConfig.forcePathStyle = true;
  }

  return new S3Client(clientConfig);
};

const getStorageProvider = async () => {
  try {
    const { data, error } = await supabase
      .from("storage_providers")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching storage provider:", error);
      throw new Error("Failed to fetch storage provider");
    }

    if (!data) {
      throw new Error("No active storage provider found");
    }

    // Parse credentials and extract bucket name
    let credentials;
    try {
      // Check if credentials is already a parsed object or needs to be parsed
      credentials = typeof data.credentials === 'string' 
        ? JSON.parse(data.credentials) 
        : data.credentials;
    } catch (error) {
      console.error("Error parsing credentials:", error, "Raw data:", data.credentials);
      throw new Error("Failed to parse storage provider credentials");
    }

    return {
      provider: data.name,
      bucket: credentials.bucket || "files", // Default to "files" if not specified
    };
  } catch (error) {
    console.error("Error in getStorageProvider:", error);
    throw error;
  }
};

export const resetStorageProvider = () => {
  s3Client = null;
};

export const getFileUrl = async (filePath: string): Promise<string> => {
  if (!filePath) {
    console.error("Empty file path provided to getFileUrl");
    throw new Error("File path is required");
  }
  
  try {
    const { provider, bucket } = await getStorageProvider();

    switch (provider) {
      case "supabase": {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
      }
      case "s3": {
        const s3Client = await getS3Client();
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: filePath,
        });
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
      }
      case "cloudflare": {
        // Use the S3-compatible client for Cloudflare R2
        const client = await getS3CompatibleClient("cloudflare");
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: filePath,
        });
        return getSignedUrl(client, command, { expiresIn: 3600 });
      }
      case "google_drive":
        throw new Error("Google Drive not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (error) {
    console.error("Error getting signed URL:", error, "for file:", filePath);
    throw error;
  }
};

export const removeFiles = async (filePaths: string[]): Promise<void> => {
  if (!filePaths || filePaths.length === 0) {
    console.warn("No file paths provided for deletion.");
    return;
  }

  const { provider, bucket } = await getStorageProvider();

  try {
    switch (provider) {
      case "supabase":
        // Delete files from Supabase storage
        const { error } = await supabase.storage.from(bucket).remove(filePaths);

        if (error) {
          console.error("Error deleting files from Supabase:", error);
          throw new Error(`Failed to delete files from Supabase: ${error.message}`);
        }
        console.log(`Successfully deleted ${filePaths.length} file(s) from Supabase.`);
        break;
      case "s3": {
        // Delete files from S3
        const client = await getS3Client();

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
      case "cloudflare": {
        // Use the S3-compatible client for Cloudflare
        const client = await getS3CompatibleClient("cloudflare");

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
      case "google_drive":
        throw new Error("Google Drive not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error;
  }
};

export async function downloadFile(filePath: string): Promise<Blob> {
  if (!filePath) {
    throw new Error("File path is required for download");
  }
  
  const { provider, bucket } = await getStorageProvider();

  switch (provider) {
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
    case "s3": {
      const s3Client = await getS3Client();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      try {
        const response = await s3Client.send(command);
        if (response.Body) {
          const blob = await response.Body.transformToByteArray();
          return new Blob([blob]);
        } else {
          throw new Error("No body in S3 response");
        }
      } catch (error) {
        console.error("Error downloading file from S3:", error);
        throw new Error("Failed to download file");
      }
    }
    case "cloudflare": {
      const client = await getS3CompatibleClient("cloudflare");
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
          throw new Error("No body in Cloudflare R2 response");
        }
      } catch (error) {
        console.error("Error downloading file from Cloudflare R2:", error);
        throw new Error("Failed to download file from Cloudflare R2");
      }
    }
    case "google_drive":
      throw new Error("Google Drive not yet implemented");
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
}

export async function uploadFile(
  file: File, 
  filePath: string, 
  options: UploadOptions = {}
): Promise<string> {
  const { provider, bucket } = await getStorageProvider();
  
  let fileData: ArrayBuffer;
  fileData = await file.arrayBuffer();
  
  try {    
    let result: string | null = null;
    
    switch (provider) {
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
      case 's3': {
        // Implement S3 upload with progress tracking
        const s3Client = await getS3Client();
        
        // Fix: Convert ArrayBuffer to Uint8Array for AWS SDK
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
            await s3Client.send(command);
            options.onUploadProgress(100);
          } else {
            await s3Client.send(command);
          }
          result = filePath;
        } catch (uploadError) {
          console.error('Error during S3 upload:', uploadError);
          throw new Error('Failed to upload file to S3');
        }
        break;
      }
      case 'cloudflare': {
        // Use the S3-compatible client for Cloudflare R2
        const client = await getS3CompatibleClient("cloudflare");
        
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
            // Simulate progress since Cloudflare R2 doesn't have native progress tracking
            options.onUploadProgress(10);
            await client.send(command);
            options.onUploadProgress(100);
          } else {
            await client.send(command);
          }
          result = filePath;
        } catch (uploadError) {
          console.error('Error during Cloudflare R2 upload:', uploadError);
          throw new Error('Failed to upload file to Cloudflare R2');
        }
        break;
      }
      case 'google_drive':
        throw new Error("Google Drive not yet implemented");
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
    
    if (!result) {
      throw new Error('Upload failed: no result returned');
    }
    
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
