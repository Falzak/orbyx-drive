import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  userId: string;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  currentPath = "/",
  userId,
}: CreateFolderDialogProps) {
  const { t } = useTranslation();
  const [folderName, setFolderName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsLoading(true);
    try {
      // Criar a pasta no banco de dados
      const { error } = await supabase.from("files").insert({
        filename: folderName,
        file_path: `${currentPath}${folderName}/`,
        content_type: "folder",
        size: 0,
        user_id: userId,
        is_folder: true,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("fileExplorer.actions.createFolderSuccess"),
      });

      // Atualizar a lista de arquivos
      queryClient.invalidateQueries({ queryKey: ["files"] });

      // Fechar o modal e limpar o estado
      onClose();
      setFolderName("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("fileExplorer.actions.createFolderError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 dark:bg-black/95 backdrop-blur-xl border-border/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              {t("fileExplorer.createFolder.title")}
            </DialogTitle>
            <DialogDescription>
              {t("fileExplorer.createFolder.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">
                {t("fileExplorer.createFolder.name")}
              </Label>
              <Input
                id="folderName"
                placeholder={t("fileExplorer.createFolder.namePlaceholder")}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="bg-background/50 dark:bg-black/50"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              className="bg-background/50 dark:bg-black/50"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || isLoading}
              className="bg-primary/90 hover:bg-primary"
            >
              {isLoading ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
