
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { FileData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  file: FileData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('shared_files')
        .insert({
          file_path: file.file_path,
          shared_by: (await supabase.auth.getUser()).data.user?.id,
          is_public: isPublic,
          password: password || null,
          custom_url: customUrl || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          permissions: ['view', 'download'],
        })
        .select()
        .single();

      if (error) throw error;

      const url = customUrl
        ? `${window.location.origin}/share/custom-${customUrl}`
        : `${window.location.origin}/share/${data.id}`;

      setShareUrl(url);

      toast({
        title: "Link criado com sucesso",
        description: "O link de compartilhamento foi gerado.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o link de compartilhamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar o link.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Compartilhar arquivo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Link público</Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {!isPublic && (
            <div className="grid gap-2">
              <Label htmlFor="password">Senha de proteção</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite uma senha (opcional)"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="expires">Data de expiração</Label>
            <Input
              id="expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custom-url">URL personalizada</Label>
            <Input
              id="custom-url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="nome-personalizado (opcional)"
            />
          </div>

          {shareUrl && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Input
                value={shareUrl}
                readOnly
                className="bg-transparent border-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleShare}
            disabled={isLoading}
            className={cn(
              "w-full",
              shareUrl && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : shareUrl ? (
              <>
                <Link className="mr-2 h-4 w-4" />
                Link criado
              </>
            ) : (
              "Gerar link"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
