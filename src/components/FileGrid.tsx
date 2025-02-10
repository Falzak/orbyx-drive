import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileData } from "@/types";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Download, Share2, Star, Trash2, Edit, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileGridProps {
  files: FileData[];
  isLoading: boolean;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
}

export function FileGrid({
  files,
  isLoading,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onToggleFavorite,
}: FileGridProps) {
  const { t } = useTranslation();

  const isMediaFile = (contentType: string) => {
    return (
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <Card className="overflow-hidden border-border">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
    >
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger asChild>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onDoubleClick={() => {
                  if (isMediaFile(file.content_type)) {
                    onPreview(file);
                  }
                }}
              >
                <Card className="overflow-hidden cursor-pointer border-border transition-shadow duration-200 hover:shadow-lg bg-background/80 dark:bg-black/80 backdrop-blur-xl">
                  <div className="aspect-square relative bg-gradient-to-b from-muted/5 to-muted/20">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">
                        {getFileIcon(file.content_type)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-t border-border">
                    <p className="font-medium truncate text-sm text-foreground/90">
                      {file.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border">
              {isMediaFile(file.content_type) && (
                <>
                  <ContextMenuItem
                    onClick={() => onPreview(file)}
                    className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <FileIcon className="h-4 w-4 mr-2" />
                    {t("fileExplorer.contextMenu.open")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              <ContextMenuItem
                onClick={() => onDownload(file)}
                className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("fileExplorer.contextMenu.download")}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onShare(file)}
                className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t("fileExplorer.contextMenu.share")}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onToggleFavorite(file)}
                className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Star
                  className={cn(
                    "h-4 w-4 mr-2",
                    file.is_favorite && "fill-yellow-400"
                  )}
                />
                {file.is_favorite
                  ? t("fileExplorer.contextMenu.unfavorite")
                  : t("fileExplorer.contextMenu.favorite")}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  const newName = prompt(
                    t("fileExplorer.contextMenu.renamePrompt"),
                    file.filename
                  );
                  if (newName && newName !== file.filename) {
                    onRename(file, newName);
                  }
                }}
                className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("fileExplorer.contextMenu.rename")}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onDelete(file)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("fileExplorer.contextMenu.delete")}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
