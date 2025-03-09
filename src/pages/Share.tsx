
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Download, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadFile } from '@/utils/storage';
import { decryptData } from '@/utils/encryption';

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
        title: "Senha inválida",
        description: "Tente novamente"
      });
    }
  };

  const handleDownload = async () => {
    if (!shareData?.file_path) return;
    
    setIsDownloading(true);
    
    try {
      // Download and automatically decrypt the file
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
        user_agent: encryptData(navigator.userAgent) // Encrypt user agent for privacy
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: "Tente novamente mais tarde"
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
        <h1 className="text-2xl font-bold">Arquivo não encontrado</h1>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  if (shareData.password && !isPasswordCorrect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Lock className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-4">Arquivo protegido</h1>
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-4">
          <Input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="max-w-lg w-full bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Arquivo compartilhado</h1>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Criptografado</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="font-medium">{shareData.filename}</p>
            <p className="text-sm text-muted-foreground">
              Tamanho: {(shareData.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button 
            onClick={handleDownload}
            className="w-full gap-2"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Descriptografando...' : 'Baixar arquivo'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Este arquivo é criptografado usando AES e só pode ser descriptografado no seu dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Share;
