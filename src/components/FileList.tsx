import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileData } from "@/types";
import { formatFileSize, getFileIcon, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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

interface FileListProps {
  files: FileData[];
  isLoading: boolean;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
}

export function FileList({
  files,
  isLoading,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onToggleFavorite,
}: FileListProps) {
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
      <div className="rounded-lg border border-border/50 bg-background/50 dark:bg-black/50 backdrop-blur-sm w-full h-full p-6">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[60%] text-foreground/70">
                {t("fileExplorer.fileProperties.name")}
              </TableHead>
              <TableHead className="w-[20%] text-foreground/70">
                {t("fileExplorer.fileProperties.size")}
              </TableHead>
              <TableHead className="w-[20%] text-foreground/70">
                {t("fileExplorer.fileProperties.modified")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow
                key={i}
                className="hover:bg-transparent border-border/50"
              >
                <TableCell className="max-w-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background/50 dark:bg-black/50 backdrop-blur-sm w-full h-full p-6">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[60%] text-foreground/70">
              {t("fileExplorer.fileProperties.name")}
            </TableHead>
            <TableHead className="w-[20%] text-foreground/70">
              {t("fileExplorer.fileProperties.size")}
            </TableHead>
            <TableHead className="w-[20%] text-foreground/70">
              {t("fileExplorer.fileProperties.modified")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger asChild>
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="group cursor-pointer transition-all hover:bg-accent/5 border-border/50"
                    onClick={() => {
                      if (isMediaFile(file.content_type)) {
                        onPreview(file);
                      }
                    }}
                  >
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {file.content_type.startsWith("image/") &&
                          file.url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/50 bg-background/50 dark:bg-black/50">
                              <img
                                src={file.url}
                                alt={file.filename}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center shrink-0 border border-border/50 transition-transform duration-200 group-hover:scale-110">
                              <span className="text-2xl drop-shadow-sm">
                                {getFileIcon(file.content_type)}
                              </span>
                            </div>
                          )}
                          {file.is_favorite && (
                            <div className="absolute -top-1.5 -right-1.5">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-2 drop-shadow-sm" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate text-sm text-foreground/90 group-hover:text-foreground transition-colors">
                            {file.filename}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap group-hover:text-foreground/70 transition-colors">
                      {formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap group-hover:text-foreground/70 transition-colors">
                      {formatDate(file.created_at)}
                    </TableCell>
                  </motion.tr>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-72 bg-background/95 dark:bg-black/95 backdrop-blur-xl border-border/50 shadow-lg divide-y divide-border/50">
                  <div className="px-2 py-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {file.content_type.startsWith("image/") && file.url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 bg-background/50 dark:bg-black/50">
                            <img
                              src={file.url}
                              alt={file.filename}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center border border-border/50">
                            <span className="text-3xl">
                              {getFileIcon(file.content_type)}
                            </span>
                          </div>
                        )}
                        {file.is_favorite && (
                          <div className="absolute -top-1 -right-1">
                            <Star className="w-4 h-4 fill-yellow-400 stroke-2" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground/90 truncate">
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] font-medium bg-accent/50 hover:bg-accent/50"
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
                        <span>Criado em {formatDate(file.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileType className="h-3.5 w-3.5" />
                        <span>{file.content_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    {isMediaFile(file.content_type) && (
                      <>
                        <ContextMenuItem
                          onClick={() => onPreview(file)}
                          className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        >
                          <FileIcon className="h-4 w-4 mr-2" />
                          {t("fileExplorer.contextMenu.open")}
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-border/50" />
                      </>
                    )}
                    <ContextMenuItem
                      onClick={() => onDownload(file)}
                      className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("fileExplorer.contextMenu.download")}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => onShare(file)}
                      className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {t("fileExplorer.contextMenu.share")}
                    </ContextMenuItem>
                    <ContextMenuSeparator className="bg-border/50" />
                    <ContextMenuItem
                      onClick={() => onToggleFavorite(file)}
                      className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
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
                      className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("fileExplorer.contextMenu.rename")}
                    </ContextMenuItem>
                  </div>

                  <div className="p-1">
                    <ContextMenuItem
                      onClick={() => onDelete(file)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("fileExplorer.contextMenu.delete")}
                    </ContextMenuItem>
                  </div>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
