import { supabase } from "@/integrations/supabase/client";
import { StorageProvider, StorageProviderDatabase } from "@/types/storage";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Interface for storage providers
interface IStorageProvider {
  upload(file: File, path: string): Promise<void>;
  download(path: string): Promise<Blob>;
  getUrl(path: string): Promise<string>;
  remove(paths: string[]): Promise<void>;
}

// Supabase storage provider implementation
class SupabaseStorage implements IStorageProvider {
  private bucket: string = "files";

  async upload(file: File, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
  }

  async download(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .download(path);

    if (error) throw error;
    if (!data) throw new Error("Failed to download file");

    return data;
  }

  async getUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Failed to get signed URL");

    return data.signedUrl;
  }

  async remove(paths: string[]): Promise<void> {
    const { error } = await supabase.storage.from(this.bucket).remove(paths);

    if (error) throw error;
  }
}

// Cloudflare R2 storage provider implementation
class CloudflareR2Storage implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(credentials: Record<string, any>) {
    this.bucket = credentials.bucket || "files";

    this.client = new S3Client({
      region: "auto",
      endpoint: credentials.endpoint || `https://1b62578902cca1b93fcd7b720f5afe82.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  async upload(file: File, path: string): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      ContentDisposition: `inline; filename="${file.name}"`,
      // Adicionar headers CORS
      ACL: 'public-read',
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async download(path: string): Promise<Blob> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error("Failed to download file");
    }

    // Convert the readable stream to a blob
    const responseArrayBuffer = await response.Body.transformToByteArray();
    return new Blob([responseArrayBuffer], { type: response.ContentType });
  }

  async getUrl(path: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    // Generate presigned URL that expires in 1 hour
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return url;
  }

  async remove(paths: string[]): Promise<void> {
    for (const path of paths) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);
    }
  }
}

// Factory to create storage provider instances
export async function createStorageProvider(): Promise<IStorageProvider> {
  try {
    // Check if user is authenticated first
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.log("No authenticated session, using default storage provider");
      return new SupabaseStorage();
    }

    // Try to fetch active storage provider from database
    // Add error handling for 400 errors (e.g., due to RLS policies)
    const { data: provider, error } = await supabase
      .from("storage_providers")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    // Handle various error cases
    if (error) {
      console.error("Error fetching storage provider:", error);
      // If access denied due to permissions (usually 403 or 400 with permission message)
      // or table doesn't exist, fall back to default
      return new SupabaseStorage();
    }

    // If no active provider found
    if (!provider) {
      console.log("No active storage provider found, using default");
      return new SupabaseStorage();
    }

    const typedProvider = provider as StorageProviderDatabase;

    // Create appropriate storage provider based on type
    switch (typedProvider.provider) {
      case "cloudflare":
        return new CloudflareR2Storage(typedProvider.credentials);
      // Implement other providers as needed
      default:
        return new SupabaseStorage();
    }
  } catch (error) {
    console.error("Failed to initialize storage provider:", error);
    // Default to Supabase storage in case of errors
    return new SupabaseStorage();
  }
}

// Singleton instance of the current storage provider
let currentStorageProvider: IStorageProvider | null = null;

// Get or create the storage provider
export async function getStorageProvider(): Promise<IStorageProvider> {
  if (!currentStorageProvider) {
    currentStorageProvider = await createStorageProvider();
  }
  return currentStorageProvider;
}

// Reset the current provider (e.g., after changing active provider)
export function resetStorageProvider(): void {
  currentStorageProvider = null;
}

// Utility functions for easier use
export async function uploadFile(file: File, path: string): Promise<void> {
  const provider = await getStorageProvider();
  return provider.upload(file, path);
}

export async function downloadFile(path: string): Promise<Blob> {
  const provider = await getStorageProvider();
  return provider.download(path);
}

export async function getFileUrl(path: string): Promise<string> {
  const provider = await getStorageProvider();
  return provider.getUrl(path);
}

export async function removeFiles(paths: string[]): Promise<void> {
  const provider = await getStorageProvider();
  return provider.remove(paths);
}
