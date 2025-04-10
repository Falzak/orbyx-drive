import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Download, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadFile, getStorageProvider } from '@/utils/storage';
import { decryptData } from '@/utils/encryption';
import { cn } from '@/lib/utils';
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{
    status: 'idle' | 'scanning' | 'safe' | 'unsafe' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const { data: shareData, isLoading, error } = useQuery({
    queryKey: ['shared-file', id],
    queryFn: async () => {
      if (!id) return null;

      // First, fetch share data
      const { data: shareData, error: shareError } = await supabase
        .from("shared_files")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (shareError) {
        console.error('Error fetching share:', shareError);
        return null;
      }

      if (!shareData) return null;

      // Check expiration
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return null;
      }

      // Try to decrypt the encrypted password if it exists
      try {
        if (shareData.encrypted_password) {
          shareData.password = decryptData(shareData.encrypted_password);
          delete shareData.encrypted_password;
        }
      } catch (decryptError) {
        console.error('Failed to decrypt shared file data:', decryptError);
      }

      // Fetch file data using the exact file_path
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('filename, size, content_type')
        .eq('file_path', shareData.file_path)
        .maybeSingle();

      if (fileError) {
        console.error('Error fetching file:', fileError);
        // If the file is not found, return what we have with default values
        return {
          ...shareData,
          filename: shareData.file_path.split('/').pop() || 'arquivo',
          size: 0,
          content_type: 'application/octet-stream'
        };
      }

      return {
        ...shareData,
        ...fileData
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Debug logs
  console.log('ShareData:', shareData);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shareData?.password === password) {
      setIsPasswordCorrect(true);
    } else {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.invalidPassword")
      });
    }
  };

  const scanFile = async () => {
    if (!shareData?.file_path) return;
    
    setIsScanning(true);
    setScanStatus({ status: 'scanning' });
    
    try {
      // Generate file URL for virus scanning
      let fileUrl;
      
      const { provider, providerType, bucket } = await getStorageProvider(shareData.content_type);
      
      switch (providerType) {
        case "supabase": {
          const { data } = supabase.storage.from(bucket).getPublicUrl(shareData.file_path);
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
            Key: shareData.file_path,
          });
          fileUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
          break;
        }
        default:
          throw new Error(`Provider ${provider} not supported for virus scanning`);
      }
      
      // Call our virus scan edge function
      const { data: scanResult, error: scanError } = await supabase.functions.invoke('virus-scan', {
        body: { 
          fileUrl,
          fileId: id,
        }
      });

      if (scanError) {
        console.error("Error during virus scan:", scanError);
        setScanStatus({ 
          status: 'error', 
          message: t("share.scanError") 
        });
        return false;
      }

      if (scanResult.status === 'timeout') {
        setScanStatus({ 
          status: 'scanning', 
          message: scanResult.message 
        });
        return true;
      } else if (!scanResult.safe) {
        setScanStatus({ 
          status: 'unsafe', 
          message: t("share.fileNotSafe") 
        });
        return false;
      }
      
      setScanStatus({ 
        status: 'safe', 
        message: t("share.fileSafe") 
      });
      return true;
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : t("share.scanError") 
      });
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = async () => {
    if (!shareData?.file_path) return;
    
    // Skip scanning if already scanned and safe
    if (scanStatus.status !== 'safe') {
      const isSafe = await scanFile();
      if (!isSafe) {
        toast({
          variant: "destructive",
          title: t("share.securityWarning"),
          description: scanStatus.message
        });
        return;
      }
    }
    
    setIsDownloading(true);
    
    try {
      // Download the file
      const blob = await downloadFile(shareData.file_path);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = shareData.filename || 'download';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Log download activity
      await supabase.from('share_activity_logs').insert({
        share_id: id,
        activity_type: 'download',
        user_ip: 'encrypted', // For privacy, we don't store actual IPs
        user_agent: navigator.userAgent
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("share.downloadError")
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t("share.fileNotFound")}</h1>
        <Button onClick={() => navigate('/')}>{t("common.goBack")}</Button>
      </div>
    );
  }

  if (shareData.password && !isPasswordCorrect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Lock className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t("share.protectedFile")}</h1>
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-4">
          <Input
            type="password"
            placeholder={t("share.enterPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            {t("common.continue")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="max-w-lg w-full bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("share.sharedFile")}</h1>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">{t("share.encrypted")}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="font-medium">{shareData.filename}</p>
            <p className="text-sm text-muted-foreground">
              {t("share.fileSize")}: {(shareData.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          
          {/* Security status indicator */}
          {scanStatus.status !== 'idle' && (
            <div className={cn(
              "p-3 rounded-md text-sm flex items-center gap-2",
              scanStatus.status === 'scanning' ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300" : 
              scanStatus.status === 'safe' ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300" : 
              "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
            )}>
              {scanStatus.status === 'scanning' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scanStatus.status === 'safe' ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{scanStatus.message}</span>
            </div>
          )}
          
          <Button 
            onClick={isScanning ? undefined : (scanStatus.status === 'idle' ? scanFile : handleDownload)}
            className="w-full gap-2"
            disabled={isDownloading || isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("share.scanningFile")}
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("share.decrypting")}
              </>
            ) : scanStatus.status === 'idle' ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                {t("share.scanAndDownload")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("share.downloadFile")}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t("share.securityNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Share;
