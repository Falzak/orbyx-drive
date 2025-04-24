import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileData } from "@/types";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Download,
  Share2,
  Star,
  Trash2,
  Edit,
  FileIcon,
  Clock,
  HardDrive,
  FileType,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RenameFileDialog } from "@/components/RenameFileDialog";

interface FileContextMenuProps {
  file: FileData;
  children: React.ReactNode;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRestore?: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
  onEditFolder?: (folder: FileData) => void;
  isTrashView?: boolean;
  isFavoritesView?: boolean;
}

export const FileContextMenu = React.forwardRef<
  HTMLDivElement,
  FileContextMenuProps
>(
  (
    {
      file,
      children,
      onPreview,
      onDownload,
      onShare,
      onDelete,
      onRestore,
      onRename,
      onToggleFavorite,
      onEditFolder,
      isTrashView,
      isFavoritesView,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

    const isPreviewableFile = (contentType: string) => {
      return (
        contentType.startsWith("image/") ||
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/") ||
        contentType === "text/plain" ||
        contentType === "application/pdf"
      );
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-80 divide-y divide-border/30">
          <div className="px-3 py-4 space-y-4">
            <div className="flex items-start gap-4 group">
              <div className="relative shrink-0 transition-all duration-300 group-hover:scale-[1.03]">
                {file.content_type.startsWith("image/") && file.url ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/30 bg-background/60 dark:bg-black/60 backdrop-blur-xl shadow-sm">
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl bg-gradient-to-b from-muted/40 to-muted/50 flex items-center justify-center border border-border/30 backdrop-blur-xl shadow-sm transition-all duration-300 group-hover:from-muted/50 group-hover:to-muted/60"
                    style={
                      file.is_folder
                        ? { backgroundColor: file.color || "#94a3b8" }
                        : {}
                    }
                  >
                    <span className="text-3xl transition-all duration-300 group-hover:scale-115">
                      {file.is_folder
                        ? file.icon || "📁"
                        : getFileIcon(file.content_type)}
                    </span>
                  </div>
                )}
                {file.is_favorite && (
                  <div className="absolute -top-1.5 -right-1.5 transition-all duration-300 group-hover:scale-110 animate-pulse">
                    <Star className="w-5 h-5 fill-yellow-400 stroke-[1.5px] drop-shadow-md" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="font-medium text-base text-foreground/90 truncate group-hover:text-foreground transition-colors duration-200">
                  {file.filename}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="h-5 px-2 text-[10px] font-medium bg-accent/40 hover:bg-accent/50 backdrop-blur-xl transition-colors duration-200"
                  >
                    {file.content_type.split("/").pop()?.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground/80">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 bg-background/30 dark:bg-black/20 backdrop-blur-xl p-2.5 rounded-lg border border-border/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>
                  {t("fileExplorer.fileProperties.details.created", {
                    date: formatDate(file.created_at),
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <FileType className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>
                  {t("fileExplorer.fileProperties.details.type", {
                    type: file.content_type,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>
                  {t("fileExplorer.fileProperties.details.size", {
                    size: formatFileSize(file.size),
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            {isPreviewableFile(file.content_type) && (
              <>
                <ContextMenuItem
                  onClick={() => onPreview(file)}
                  className="group rounded-md"
                >
                  <FileIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                    {t("fileExplorer.contextMenu.open")}
                  </span>
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem
              onClick={() => onDownload(file)}
              className="group rounded-md"
            >
              <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                {t("fileExplorer.contextMenu.download")}
              </span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onShare(file)}
              className="group rounded-md"
            >
              <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                {t("fileExplorer.contextMenu.share")}
              </span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onToggleFavorite(file)}
              className="group rounded-md"
            >
              <Star
                className={cn(
                  "h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200",
                  file.is_favorite && "fill-yellow-400"
                )}
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                {file.is_favorite
                  ? t("fileExplorer.contextMenu.unfavorite")
                  : t("fileExplorer.contextMenu.favorite")}
              </span>
            </ContextMenuItem>
            {!file.is_folder && (
              <ContextMenuItem
                onClick={() => setIsRenameDialogOpen(true)}
                className="group rounded-md"
              >
                <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  {t("fileExplorer.contextMenu.rename")}
                </span>
              </ContextMenuItem>
            )}
            {file.is_folder && (
              <ContextMenuItem
                onClick={() => onEditFolder?.(file)}
                className="group rounded-md"
              >
                <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  {t("fileExplorer.contextMenu.editFolder")}
                </span>
              </ContextMenuItem>
            )}
          </div>

          <div className="p-1.5">
            {isTrashView ? (
              <>
                <ContextMenuItem
                  onClick={() => onRestore?.(file)}
                  className="text-primary hover:bg-primary/10 hover:text-primary group rounded-md"
                >
                  <RotateCcw className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                    {t("fileExplorer.contextMenu.restore")}
                  </span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onDelete(file)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive group rounded-md"
                >
                  <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                    {t("fileExplorer.contextMenu.deletePermanently")}
                  </span>
                </ContextMenuItem>
              </>
            ) : (
              <ContextMenuItem
                onClick={() => onDelete(file)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive group rounded-md"
              >
                <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  {t("fileExplorer.contextMenu.moveToTrash")}
                </span>
              </ContextMenuItem>
            )}
          </div>
        </ContextMenuContent>
        <RenameFileDialog
          file={file}
          open={isRenameDialogOpen}
          onOpenChange={setIsRenameDialogOpen}
          onRename={onRename}
        />
      </ContextMenu>
    );
  }
);

FileContextMenu.displayName = "FileContextMenu";
