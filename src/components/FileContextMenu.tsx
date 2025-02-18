import React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FileContextMenuProps {
  file: FileData;
  children: React.ReactNode;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
  onEditFolder?: (folder: FileData) => void;
}

export function FileContextMenu({
  file,
  children,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onToggleFavorite,
  onEditFolder,
}: FileContextMenuProps) {
  const { t } = useTranslation();

  const isMediaFile = (contentType: string) => {
    return (
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent 
        className="w-72 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border/50 shadow-xl divide-y divide-border/50"
      >
        <div className="px-2 py-3 space-y-3">
          <div className="flex items-start gap-3 group">
            <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-[1.02]">
              {file.content_type.startsWith("image/") && file.url ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 bg-background/80 dark:bg-black/80 backdrop-blur-xl shadow-sm">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-lg bg-gradient-to-b from-muted/50 to-muted/60 flex items-center justify-center border border-border/50 backdrop-blur-xl shadow-sm transition-all duration-200 group-hover:from-muted/60 group-hover:to-muted/70"
                  style={
                    file.is_folder
                      ? { backgroundColor: file.color || "#94a3b8" }
                      : {}
                  }
                >
                  <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                    {file.is_folder
                      ? file.icon || "📁"
                      : getFileIcon(file.content_type)}
                  </span>
                </div>
              )}
              {file.is_favorite && (
                <div className="absolute -top-1 -right-1 transition-transform duration-200 group-hover:scale-110">
                  <Star className="w-4 h-4 fill-yellow-400 stroke-2 drop-shadow-sm" />
                </div>
              )}
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate group-hover:text-foreground transition-colors duration-200">
                {file.filename}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-medium bg-accent/50 hover:bg-accent/60 backdrop-blur-xl transition-colors duration-200"
                >
                  {file.content_type.split("/").pop()?.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {t("fileExplorer.fileProperties.details.created", {
                  date: formatDate(file.created_at),
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileType className="h-3.5 w-3.5" />
              <span>
                {t("fileExplorer.fileProperties.details.type", {
                  type: file.content_type,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              <span>
                {t("fileExplorer.fileProperties.details.size", {
                  size: formatFileSize(file.size),
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-1">
          {isMediaFile(file.content_type) && (
            <>
              <ContextMenuItem
                onClick={() => onPreview(file)}
                className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
              >
                <FileIcon className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  {t("fileExplorer.contextMenu.open")}
                </span>
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-border/50" />
            </>
          )}
          <ContextMenuItem
            onClick={() => onDownload(file)}
            className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
          >
            <Download className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">
              {t("fileExplorer.contextMenu.download")}
            </span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onShare(file)}
            className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
          >
            <Share2 className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">
              {t("fileExplorer.contextMenu.share")}
            </span>
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-border/50" />
          <ContextMenuItem
            onClick={() => onToggleFavorite(file)}
            className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
          >
            <Star
              className={cn(
                "h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200",
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
              onClick={() => {
                const newName = prompt(
                  t("fileExplorer.contextMenu.renamePrompt"),
                  file.filename
                );
                if (newName && newName !== file.filename) {
                  onRename(file, newName);
                }
              }}
              className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
            >
              <Edit className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                {t("fileExplorer.contextMenu.rename")}
              </span>
            </ContextMenuItem>
          )}
          {file.is_folder && (
            <ContextMenuItem
              onClick={() => onEditFolder?.(file)}
              className="text-foreground hover:bg-accent/60 hover:text-accent-foreground cursor-pointer transition-all duration-200 group rounded-sm"
            >
              <Edit className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                {t("fileExplorer.contextMenu.editFolder")}
              </span>
            </ContextMenuItem>
          )}
        </div>

        <div className="p-1">
          <ContextMenuItem
            onClick={() => onDelete(file)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-all duration-200 group rounded-sm"
          >
            <Trash2 className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">
              {t("fileExplorer.contextMenu.delete")}
            </span>
          </ContextMenuItem>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
}
