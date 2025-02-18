
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MediaPreview from '@/components/MediaPreview';
import { Lock, Download } from 'lucide-react';
import { FileData } from '@/types';
import { decryptFile } from '@/utils/encryption';

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);

  // Extrair a chave de criptografia do hash da URL
  const encryptionKey = location.hash.replace('#key=', '');

  const { data: shareData, isLoading } = useQuery({
    queryKey: ['shared-file', id],
    queryFn: async () => {
      const { data: sharedFile, error } = await supabase
        .from('shared_files')
        .select(`
          *,
          files:file_path (
            filename,
            content_type,
            size,
            is_favorite,
            created_at,
            updated_at,
            id,
            user_id,
            file_path,
            folder_id,
            category
          )
        `)
        .eq(id?.startsWith('custom-') ? 'custom_url' : 'id', id?.replace('custom-', ''))
        .single();

      if (error) throw error;

      if (sharedFile.expires_at && new Date(sharedFile.expires_at) < new Date()) {
        throw new Error('Este link expirou');
      }

      return sharedFile;
    },
  });

  useEffect(() => {
    const decryptContent = async () => {
      if (shareData?.encryption_key && encryptionKey && !decryptedUrl) {
        try {
          const response = await fetch(shareData.files.url);
          const encryptedContent = await response.text();
          
          const decryptedFile = await decryptFile(
            encryptedContent,
            encryptionKey,
            shareData.files.content_type,
            shareData.files.filename
          );
          
          setDecryptedUrl(URL.createObjectURL(decryptedFile));
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível descriptografar o arquivo.",
          });
        }
      }
    };

    decryptContent();
  }, [shareData, encryptionKey]);

  const handleDownload = async () => {
    if (!shareData) return;

    try {
      if (shareData.encryption_key) {
        if (!decryptedUrl) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Aguarde a descriptografia do arquivo.",
          });
          return;
        }

        const a = document.createElement('a');
        a.href = decryptedUrl;
        a.download = shareData.files.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const { data, error } = await supabase.storage
          .from('files')
          .download(shareData.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = shareData.files.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao baixar arquivo",
      });
    }
  };

  const checkPassword = () => {
    if (shareData?.password === password) {
      setIsPasswordCorrect(true);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Senha incorreta",
      });
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
        <Button onClick={() => navigate('/')}>Voltar ao início</Button>
      </div>
    );
  }

  if (shareData.password && !isPasswordCorrect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Lock className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-4">Arquivo Protegido</h1>
        <div className="w-full max-w-sm space-y-4">
          <Input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={checkPassword}>
            Acessar
          </Button>
        </div>
      </div>
    );
  }

  const fileData: FileData = {
    ...shareData.files,
    url: decryptedUrl || shareData.files.url,
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{shareData.files.filename}</h1>
          <p className="text-sm text-muted-foreground">
            Compartilhado em {new Date(shareData.created_at).toLocaleDateString()}
          </p>
          {shareData.encryption_key && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Criptografado
            </p>
          )}
        </div>

        <MediaPreview
          file={fileData}
          onDownload={handleDownload}
        />

        <Button
          size="lg"
          className="w-full"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}

export default Share;
