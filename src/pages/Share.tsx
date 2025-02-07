
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MediaPreview from '@/components/MediaPreview';
import { Lock, Download } from 'lucide-react';

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);

  const { data: shareData, isLoading } = useQuery({
    queryKey: ['shared-file', id],
    queryFn: async () => {
      const { data: sharedFile, error } = await supabase
        .from('shared_files')
        .select(`
          *,
          files:file_path (
            filename,
            content_type
          )
        `)
        .eq(id.startsWith('custom-') ? 'custom_url' : 'id', id.replace('custom-', ''))
        .single();

      if (error) throw error;

      if (sharedFile.expires_at && new Date(sharedFile.expires_at) < new Date()) {
        throw new Error('This link has expired');
      }

      return sharedFile;
    },
  });

  const handleDownload = async () => {
    if (!shareData) return;

    const { data, error } = await supabase.storage
      .from('files')
      .download(shareData.file_path);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao baixar arquivo",
      });
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = shareData.files.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const { data: signedUrl } = supabase.storage
    .from('files')
    .getPublicUrl(shareData.file_path);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{shareData.files.filename}</h1>
          <p className="text-sm text-muted-foreground">
            Compartilhado em {new Date(shareData.created_at).toLocaleDateString()}
          </p>
        </div>

        <MediaPreview
          contentType={shareData.files.content_type}
          url={signedUrl.publicUrl}
          filename={shareData.files.filename}
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
};

export default Share;

