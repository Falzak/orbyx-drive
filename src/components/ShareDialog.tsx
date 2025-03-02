import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { FileData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Link, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ShareDialogProps {
  file: FileData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Buscar informações de compartilhamento existente
  const { data: existingShare, isLoading: isLoadingShare } = useQuery({
    queryKey: ['shared-file', file.file_path],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_files")
        .select("*")
        .eq("file_path", file.file_path)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching share:", error);
        return null;
      }

      return data;
    },
  });

  // Atualizar estados quando existir compartilhamento
  useEffect(() => {
    if (existingShare) {
      setIsPublic(existingShare.is_public);
      setPassword(existingShare.password || "");
      setExpiresAt(existingShare.expires_at || "");
      setShareUrl(`${window.location.origin}/share/${existingShare.id}`);
    }
  }, [existingShare]);

  const handleShare = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const shareData = {
        file_path: file.file_path,
        shared_by: user.id,
        is_public: isPublic,
        password: password || null,
        // Removendo expires_at por enquanto
      };

      const { data, error } = await supabase
        .from("shared_files")
        .insert(shareData)
        .select()
        .single();

      if (error) throw error;

      const newShareUrl = `${window.location.origin}/share/${data.id}`;
      setShareUrl(newShareUrl);
      queryClient.invalidateQueries({ queryKey: ['shared-file', file.file_path] });

      toast({
        title: "Link criado com sucesso",
        description: "O link de compartilhamento foi gerado.",
      });
    } catch (error) {
      console.error("Share error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o link de compartilhamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("shared_files")
        .delete()
        .eq("file_path", file.file_path);

      if (error) throw error;

      setShareUrl("");
      queryClient.invalidateQueries({ queryKey: ['shared-file', file.file_path] });

      toast({
        title: "Compartilhamento removido",
        description: "O arquivo não está mais compartilhado.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Stop sharing error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o compartilhamento.",
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
          <DialogTitle>
            {existingShare ? "Gerenciar compartilhamento" : "Compartilhar arquivo"}
          </DialogTitle>
          <DialogDescription>
            {existingShare 
              ? "Gerencie as configurações de compartilhamento do seu arquivo."
              : "Configure as opções de compartilhamento do seu arquivo."}
          </DialogDescription>
        </DialogHeader>
        
        {existingShare ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link de compartilhamento:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-transparent"
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
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Configurações atuais:</p>
              <div className="space-y-1">
                <p className="text-sm">• Acesso: {isPublic ? "Público" : "Protegido"}</p>
                {existingShare.password && <p className="text-sm">• Protegido por senha</p>}
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleStopSharing}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Parar de compartilhar
                </>
              )}
            </Button>
          </div>
        ) : (
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

            <Button
              onClick={handleShare}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Gerar link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
