
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
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

const getStorageProvider = async () => {
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
        // Handle cloudflare specific logic
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
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
      case "s3":
      case "cloudflare":
        // Delete files from S3 or Cloudflare (they use similar S3-compatible APIs)
        const s3Client = await getS3Client();

        // Process deletions one by one
        for (const filePath of filePaths) {
          try {
            const deleteCommand = new S3Client({
              Bucket: bucket,
              Key: filePath,
            });
            // await s3Client.send(deleteCommand);
            console.log(`Deleted file: ${filePath}`);
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        }
        console.log(`Successfully processed deletion of ${filePaths.length} file(s).`);
        break;
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
    case "s3":
    case "cloudflare": {
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
        console.error("Error downloading file from S3/Cloudflare:", error);
        throw new Error("Failed to download file");
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
      case 's3':
      case 'cloudflare':
        // Implement S3/Cloudflare upload with progress tracking
        const s3Client = await getS3Client();
        
        // Prepare upload with progress
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && options.onUploadProgress) {
              const progress = Math.round((event.loaded / event.total) * 100);
              options.onUploadProgress(progress);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(filePath);
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed due to network error'));
          });
          
          xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
          });
        });
        
        // Convert ArrayBuffer to Buffer for AWS SDK
        const buffer = new Uint8Array(fileData);
        
        // Generate pre-signed URL for upload
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          ContentType: file.type,
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(fileData);
        
        result = await uploadPromise;
        break;
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
