import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  RefreshCw,
  FolderPlus,
  FileText,
  FileUp,
  MousePointerClick,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { resetStorageProvider } from "@/utils/storage";

interface WorkspaceContextMenuProps {
  children: React.ReactNode;
  onCreateFolder: () => void;
  onCreateTextFile: () => void;
  onUploadFile: () => void;
  onSelectAll: () => void;
}

export function WorkspaceContextMenu({
  children,
  onCreateFolder,
  onCreateTextFile,
  onUploadFile,
  onSelectAll,
}: WorkspaceContextMenuProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRefreshFiles = () => {
    // Reset storage provider to reflect any configuration changes
    resetStorageProvider();
    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast({
      title: t("dashboard.refresh.success"),
      description: t("dashboard.refresh.description"),
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-screen w-full overflow-hidden">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-background/95 dark:bg-black/95 backdrop-blur-xl border-border/50">
        <ContextMenuItem
          onClick={handleRefreshFiles}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          {t("dashboard.contextMenu.refresh")}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-border/50" />
        <ContextMenuItem
          onClick={onCreateFolder}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <FolderPlus className="h-4 w-4" />
          {t("dashboard.contextMenu.createFolder")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onCreateTextFile}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <FileText className="h-4 w-4" />
          {t("dashboard.contextMenu.createTextFile")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onUploadFile}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <FileUp className="h-4 w-4" />
          {t("dashboard.contextMenu.uploadFile")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onSelectAll}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <MousePointerClick className="h-4 w-4" />
          {t("dashboard.contextMenu.selectAll")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
