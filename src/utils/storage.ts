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

  const s3Config = JSON.parse(data.config);

  s3Client = new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
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

  return {
    provider: data.name,
    bucket: data.bucket,
  };
};

export const resetStorageProvider = () => {
  s3Client = null;
};

export const getFileUrl = async (filePath: string): Promise<string> => {
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
    case "google_drive":
      throw new Error("Google Drive not yet implemented");
    default:
      throw new Error(`Provider ${provider} not implemented`);
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
        // Delete files from S3
        const s3Client = await getS3Client();

        // Prepare delete operations for each file
        const deleteParams = {
          Bucket: bucket,
          Delete: {
            Objects: filePaths.map(Key => ({ Key })),
            Quiet: false, // Set to true to suppress success reports.
          },
        };

        // Use deleteObjects to delete multiple files in a single request
        // const deleteCommand = new DeleteObjectsCommand(deleteParams);
        // const deleteResponse = await s3Client.send(deleteCommand);

        // if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
        //   console.error("Errors deleting files from S3:", deleteResponse.Errors);
        //   throw new Error(`Failed to delete some files from S3: ${deleteResponse.Errors.map(e => e.Message).join(', ')}`);
        // }

        console.log(`Successfully deleted ${filePaths.length} file(s) from S3.`);
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
        throw new Error("Failed to download file from S3");
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
        // Adicionar suporte para progresso de upload no S3
        const s3Client = await getS3Client();
        
        // Preparar upload com progresso
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
        
        // Implementar o upload real para S3 usando presigned URL
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          Body: fileData,
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
